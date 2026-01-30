"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
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

const SWIPE_THRESHOLD = 75;
const SWIPE_VELOCITY = 500;
const DISMISS_THRESHOLD = 120;

export function TimelineLightbox({
  photos,
  initialIndex,
  onClose,
}: TimelineLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Fetch original-size URL for a given photo
  const fetchOriginal = useCallback(
    async (photoId: string) => {
      if (originalUrls[photoId]) return;
      try {
        const res = await fetch(`/api/photos/${photoId}/url?size=original`);
        if (res.ok) {
          const { url } = await res.json();
          setOriginalUrls((prev) => ({ ...prev, [photoId]: url }));
          // Preload image
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

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= photos.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, photos.length]
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

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

  // Horizontal swipe handler
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (Math.abs(offset.x) > SWIPE_THRESHOLD || Math.abs(velocity.x) > SWIPE_VELOCITY) {
      if (offset.x > 0) goPrev();
      else goNext();
    }
  };

  // Vertical swipe-to-dismiss state
  const [dragY, setDragY] = useState(0);

  const handleDismissDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_THRESHOLD) {
      onClose();
    }
    setDragY(0);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-white/70">
            {index + 1} / {photos.length}
          </span>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Schließen"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Photo area */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          {/* Desktop prev arrow */}
          {index > 0 && (
            <button
              onClick={goPrev}
              className="absolute left-2 z-10 hidden rounded-full bg-black/40 p-2 text-white/70 transition-colors hover:bg-black/60 hover:text-white md:block"
              aria-label="Vorheriges Foto"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={index}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.5}
                onDrag={(_, info) => setDragY(info.offset.y)}
                onDragEnd={handleDismissDragEnd}
                style={{
                  opacity: 1 - Math.min(Math.abs(dragY) / 300, 0.5),
                  scale: 1 - Math.min(Math.abs(dragY) / 1000, 0.1),
                }}
                className="h-full w-full"
              >
                <img
                  src={displayUrl}
                  alt=""
                  className="h-full w-full object-contain select-none"
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Desktop next arrow */}
          {index < photos.length - 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 z-10 hidden rounded-full bg-black/40 p-2 text-white/70 transition-colors hover:bg-black/60 hover:text-white md:block"
              aria-label="Nächstes Foto"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Bottom info bar */}
        <div className="relative z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={current.status} />
            <span className="text-sm text-white/70">
              {format(new Date(current.date), "dd.MM.yyyy HH:mm", {
                locale: de,
              })}
            </span>
          </div>
          {current.notes && (
            <p className="mt-1 text-sm text-white/90">{current.notes}</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
