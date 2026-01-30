"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Leaf } from "lucide-react";
import { format } from "date-fns";
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
      <div className="space-y-3">
        {checkIns.map((ci) => {
          const lbIndex = lightboxIndexMap.get(ci.id);
          return (
            <Card key={ci.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {ci.resolvedPhotoUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        lbIndex !== undefined && setOpenIndex(lbIndex)
                      }
                      className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                    >
                      <img
                        src={ci.resolvedPhotoUrl}
                        alt=""
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    </button>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                      <Leaf className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ci.status} />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ci.date), "dd.MM.yyyy HH:mm", {
                          locale: de,
                        })}
                      </span>
                    </div>
                    {ci.notes && <p className="mt-1 text-sm">{ci.notes}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
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
