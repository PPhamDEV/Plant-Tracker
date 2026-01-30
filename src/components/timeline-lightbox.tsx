"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  type PanInfo,
} from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export interface LightboxPhoto {
  photoId: string;
  thumbUrl: string;
  date: string;
  status: string;
  notes: string | null;
}

interface TimelineLightboxProps {
  photos: LightboxPhoto[];
  initialIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 300;
const DISMISS_Y_THRESHOLD = 100;

export function TimelineLightbox({
  photos,
  initialIndex,
  onClose,
}: TimelineLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const controls = useAnimation();
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Derive visual feedback from drag
  const backdropOpacity = useTransform(dragY, [0, 200], [1, 0.3]);
  const imageScale = useTransform(dragY, [0, 200], [1, 0.85]);
  const imageRotate = useTransform(dragX, [-300, 0, 300], [-5, 0, 5]);

  // Determine dominant drag axis
  const dragAxis = useRef<"x" | "y" | null>(null);

  const current = photos[index];
  const displayUrl = originalUrls[current.photoId] || current.thumbUrl;

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Fetch original-size URL
  const fetchOriginal = useCallback(
    async (photoId: string) => {
      if (originalUrls[photoId]) return;
      try {
        const res = await fetch(`/api/photos/${photoId}/url?size=original`);
        if (res.ok) {
          const { url } = await res.json();
          setOriginalUrls((prev) => ({ ...prev, [photoId]: url }));
          const img = new Image();
          img.src = url;
        }
      } catch {
        // Fall back to thumb
      }
    },
    [originalUrls]
  );

  // Load original for current + preload neighbors
  useEffect(() => {
    fetchOriginal(photos[index].photoId);
    if (index > 0) fetchOriginal(photos[index - 1].photoId);
    if (index < photos.length - 1) fetchOriginal(photos[index + 1].photoId);
  }, [index, photos, fetchOriginal]);

  const navigateTo = useCallback(
    async (next: number) => {
      if (next < 0 || next >= photos.length || isAnimating) return;
      setIsAnimating(true);
      const dir = next > index ? -1 : 1;
      // Slide current image out
      await controls.start({
        x: dir * window.innerWidth,
        opacity: 0,
        transition: { type: "spring", stiffness: 400, damping: 40, mass: 0.8 },
      });
      // Swap index and position image on opposite side
      setIndex(next);
      controls.set({ x: -dir * window.innerWidth * 0.3, opacity: 0 });
      // Slide new image in
      await controls.start({
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 400, damping: 35, mass: 0.8 },
      });
      setIsAnimating(false);
    },
    [index, photos.length, isAnimating, controls]
  );

  const goPrev = useCallback(() => navigateTo(index - 1), [navigateTo, index]);
  const goNext = useCallback(() => navigateTo(index + 1), [navigateTo, index]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext]);

  const handleDragStart = () => {
    dragAxis.current = null;
  };

  const handleDrag = (_: unknown, info: PanInfo) => {
    // Lock axis on first significant movement
    if (!dragAxis.current) {
      if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
        dragAxis.current =
          Math.abs(info.offset.x) > Math.abs(info.offset.y) ? "x" : "y";
      }
    }
    // Constrain to dominant axis
    if (dragAxis.current === "x") {
      dragY.set(0);
    } else if (dragAxis.current === "y") {
      dragX.set(0);
    }
  };

  const handleDragEnd = async (_: unknown, info: PanInfo) => {
    const axis = dragAxis.current;
    dragAxis.current = null;

    if (axis === "y") {
      // Dismiss gesture
      if (info.offset.y > DISMISS_Y_THRESHOLD) {
        onClose();
      } else {
        // Snap back
        dragY.set(0);
      }
      dragX.set(0);
      return;
    }

    // Horizontal swipe
    dragY.set(0);
    const swipedEnough =
      Math.abs(info.offset.x) > SWIPE_THRESHOLD ||
      Math.abs(info.velocity.x) > SWIPE_VELOCITY;

    if (swipedEnough && !isAnimating) {
      if (info.offset.x > 0 && index > 0) {
        dragX.set(0);
        goPrev();
      } else if (info.offset.x < 0 && index < photos.length - 1) {
        dragX.set(0);
        goNext();
      } else {
        dragX.set(0);
      }
    } else {
      dragX.set(0);
    }
  };

  // Open animation
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    setEntered(true);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: entered ? 1 : 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        style={{ opacity: backdropOpacity }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            {index + 1} / {photos.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Photo area */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
        {/* Desktop prev arrow */}
        {index > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-3 z-20 hidden rounded-full bg-white/10 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white hover:scale-110 md:block"
            aria-label="Vorheriges Foto"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <motion.div
          className="h-full w-full cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={{ left: 0.4, right: 0.4, top: 0.3, bottom: 0.6 }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          style={{ x: dragX, y: dragY }}
        >
          <motion.div
            className="flex h-full w-full items-center justify-center px-4"
            animate={controls}
            style={{ scale: imageScale, rotate: imageRotate }}
          >
            <img
              src={displayUrl}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain select-none"
              draggable={false}
            />
          </motion.div>
        </motion.div>

        {/* Desktop next arrow */}
        {index < photos.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-3 z-20 hidden rounded-full bg-white/10 p-2.5 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white hover:scale-110 md:block"
            aria-label="Nächstes Foto"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Bottom info bar */}
      <motion.div
        className="relative z-10 px-4 pb-6 pt-4"
        style={{ opacity: backdropOpacity }}
      >
        <div className="mx-auto max-w-lg rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <StatusBadge status={current.status} />
            <span className="text-sm text-white/70">
              {format(new Date(current.date), "dd.MM.yyyy HH:mm", {
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

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => !isAnimating && navigateTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
