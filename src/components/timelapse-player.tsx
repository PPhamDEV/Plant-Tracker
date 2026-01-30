"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import type { LightboxPhoto } from "./timeline-lightbox";

interface TimelapsePlayerProps {
  /** Photos in display order (newest-first from timeline). Will be reversed to chronological. */
  photos: LightboxPhoto[];
  onClose: () => void;
}

const SPEED_OPTIONS = [1, 2, 3, 4, 5] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

const INTERVAL_MS: Record<Speed, number> = {
  1: 2500,
  2: 1250,
  3: 800,
  4: 500,
  5: 300,
};

export function TimelapsePlayer({ photos: photosDesc, onClose }: TimelapsePlayerProps) {
  // Chronological order (oldest first)
  const photos = [...photosDesc].reverse();

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<Speed>(3);
  const [showControls, setShowControls] = useState(true);
  const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});

  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = photos[index];
  const displayUrl = originalUrls[current.photoId] || current.thumbUrl;

  // ─── Body scroll lock ───
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ─── Preload all original-resolution URLs on mount ───
  useEffect(() => {
    let cancelled = false;
    async function preloadAll() {
      for (const photo of photos) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/photos/${photo.photoId}/url?size=original`);
          if (res.ok) {
            const { url } = await res.json();
            if (!cancelled) {
              setOriginalUrls((prev) => ({ ...prev, [photo.photoId]: url }));
              // Warm browser cache
              const img = new Image();
              img.src = url;
            }
          }
        } catch {
          // Fall back to thumb
        }
      }
    }
    preloadAll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Auto-advance ───
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIndex((prev) => {
        if (prev >= photos.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, INTERVAL_MS[speed]);
    return () => clearInterval(id);
  }, [playing, speed, photos.length]);

  // ─── Controls auto-hide ───
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [resetControlsTimer]);

  const handleInteraction = useCallback(() => {
    resetControlsTimer();
  }, [resetControlsTimer]);

  // ─── Navigation helpers ───
  const goPrev = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1));
    resetControlsTimer();
  }, [resetControlsTimer]);

  const goNext = useCallback(() => {
    setIndex((prev) => Math.min(photos.length - 1, prev + 1));
    resetControlsTimer();
  }, [photos.length, resetControlsTimer]);

  const togglePlay = useCallback(() => {
    setPlaying((prev) => {
      // If at end, restart from beginning
      if (!prev) {
        setIndex((i) => (i >= photos.length - 1 ? 0 : i));
      }
      return !prev;
    });
    resetControlsTimer();
  }, [photos.length, resetControlsTimer]);

  const cycleSpeed = useCallback(() => {
    setSpeed((prev) => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    });
    resetControlsTimer();
  }, [resetControlsTimer]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, togglePlay, goPrev, goNext]);

  // ─── Progress bar scrub ───
  const progressRef = useRef<HTMLDivElement>(null);

  const scrubToPosition = useCallback(
    (clientX: number) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newIndex = Math.round(ratio * (photos.length - 1));
      setIndex(newIndex);
      resetControlsTimer();
    },
    [photos.length, resetControlsTimer]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      scrubToPosition(e.clientX);
    },
    [scrubToPosition]
  );

  // Drag scrub
  const isDragging = useRef(false);

  const handleProgressPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      scrubToPosition(e.clientX);
    },
    [scrubToPosition]
  );

  const handleProgressPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      scrubToPosition(e.clientX);
    },
    [scrubToPosition]
  );

  const handleProgressPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const progress = photos.length > 1 ? index / (photos.length - 1) : 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col select-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleInteraction}
        onMouseMove={handleInteraction}
        onTouchStart={handleInteraction}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

        {/* ─── Top bar ─── */}
        <motion.div
          className="relative z-10 flex items-center justify-between px-4 py-3"
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ pointerEvents: showControls ? "auto" : "none" }}
        >
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            {index + 1} / {photos.length}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleSpeed}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Geschwindigkeit ändern"
            >
              {speed}x
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 p-2 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Schließen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* ─── Photo area with true crossfade (overlay dissolve) ─── */}
        <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
          <AnimatePresence initial={false}>
            <motion.img
              key={current.photoId}
              src={displayUrl}
              alt=""
              className="absolute inset-0 h-full w-full rounded-lg object-contain px-4"
              draggable={false}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          </AnimatePresence>
        </div>

        {/* ─── Center controls ─── */}
        <motion.div
          className="relative z-10 flex items-center justify-center gap-6 py-2"
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ pointerEvents: showControls ? "auto" : "none" }}
        >
          <button
            onClick={goPrev}
            disabled={index === 0}
            className="rounded-full bg-white/10 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:hover:bg-white/10"
            aria-label="Vorheriges Foto"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={togglePlay}
            className="rounded-full bg-white/15 p-3.5 text-white backdrop-blur-sm transition-all hover:bg-white/25 hover:scale-110"
            aria-label={playing ? "Pause" : "Abspielen"}
          >
            {playing ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          <button
            onClick={goNext}
            disabled={index === photos.length - 1}
            className="rounded-full bg-white/10 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:hover:bg-white/10"
            aria-label="Nächstes Foto"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </motion.div>

        {/* ─── Bottom info bar ─── */}
        <motion.div
          className="relative z-10 px-4 pb-2 pt-2"
          animate={{ opacity: showControls ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ pointerEvents: showControls ? "auto" : "none" }}
        >
          <div className="mx-auto max-w-lg rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <StatusBadge status={current.status} />
              <span className="text-sm text-white/70">
                {format(new Date(current.date), "dd. MMM yyyy", {
                  locale: de,
                })}
              </span>
            </div>
            {current.notes && (
              <p className="mt-1.5 text-sm leading-relaxed text-white/90">
                {current.notes}
              </p>
            )}
          </div>
        </motion.div>

        {/* ─── Progress bar ─── */}
        <div
          ref={progressRef}
          className="relative z-10 mx-4 mb-4 h-6 cursor-pointer flex items-center"
          onClick={handleProgressClick}
          onPointerDown={handleProgressPointerDown}
          onPointerMove={handleProgressPointerMove}
          onPointerUp={handleProgressPointerUp}
        >
          {/* Track */}
          <div className="w-full h-1 rounded-full bg-white/20">
            {/* Fill */}
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute h-3.5 w-3.5 rounded-full bg-white shadow-md transition-all duration-300"
            style={{ left: `calc(${progress * 100}% - 7px)` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
