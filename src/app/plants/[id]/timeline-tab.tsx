"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { StatusBadge } from "@/components/status-badge";
import { Leaf, Camera } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  TimelineLightbox,
  type LightboxPhoto,
} from "@/components/timeline-lightbox";

export interface SerializedCheckIn {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  resolvedPhotoUrl: string | null;
  photoId: string | null;
}

interface TimelineTabProps {
  checkIns: SerializedCheckIn[];
}

export function TimelineTab({ checkIns }: TimelineTabProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Only check-ins with photos participate in lightbox
  const photosForLightbox: LightboxPhoto[] = checkIns
    .filter((ci) => ci.resolvedPhotoUrl && ci.photoId)
    .map((ci) => ({
      photoId: ci.photoId!,
      thumbUrl: ci.resolvedPhotoUrl!,
      date: ci.date,
      status: ci.status,
      notes: ci.notes,
    }));

  // Map from check-in id → lightbox index
  const lightboxIndexMap = new Map<string, number>();
  let lbIdx = 0;
  for (const ci of checkIns) {
    if (ci.resolvedPhotoUrl && ci.photoId) {
      lightboxIndexMap.set(ci.id, lbIdx++);
    }
  }

  if (checkIns.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Noch keine Check-ins.
      </p>
    );
  }

  return (
    <>
      <div className="relative pl-8 pt-2">
        {/* Vertical timeline line */}
        <div className="absolute left-[11px] top-4 bottom-0 w-px bg-border" />

        {checkIns.map((ci, i) => {
          const lbIndex = lightboxIndexMap.get(ci.id);
          const hasPhoto = !!ci.resolvedPhotoUrl;
          const date = new Date(ci.date);

          return (
            <motion.div
              key={ci.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="relative pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div
                className={`absolute -left-8 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 ${
                  hasPhoto
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/30 bg-background"
                }`}
              >
                {hasPhoto ? (
                  <Camera className="h-2.5 w-2.5 text-primary" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>

              {/* Card */}
              <div className="rounded-xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
                {/* Date + status header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ci.status} />
                    <span className="text-xs text-muted-foreground">
                      {format(date, "dd. MMM yyyy, HH:mm", { locale: de })}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(date, { addSuffix: true, locale: de })}
                  </span>
                </div>

                {/* Notes */}
                {ci.notes && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                    {ci.notes}
                  </p>
                )}

                {/* Photo thumbnail */}
                {ci.resolvedPhotoUrl ? (
                  <button
                    type="button"
                    onClick={() =>
                      lbIndex !== undefined && setOpenIndex(lbIndex)
                    }
                    className="group relative mt-2.5 block w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <img
                      src={ci.resolvedPhotoUrl}
                      alt=""
                      className="aspect-[16/10] w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 rounded-lg bg-black/0 transition-colors group-hover:bg-black/10" />
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <Camera className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ) : (
                  <div className="mt-2.5 flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-muted/50">
                    <Leaf className="h-8 w-8 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {openIndex !== null && photosForLightbox.length > 0 && (
        <TimelineLightbox
          photos={photosForLightbox}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
