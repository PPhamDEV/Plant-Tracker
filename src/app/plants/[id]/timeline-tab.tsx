"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "@/components/status-badge";
import { Leaf, Camera, Info, Play, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import {
  TimelineLightbox,
  type LightboxPhoto,
} from "@/components/timeline-lightbox";
import { TimelapsePlayer } from "@/components/timelapse-player";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateCheckIn, deleteCheckIn } from "@/app/actions/check-ins";

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
  plantId: string;
}

const STATUS_OPTIONS = [
  { value: "ok", label: "OK" },
  { value: "thirsty", label: "Durstig" },
  { value: "pests", label: "Schädlinge" },
  { value: "repotted", label: "Umgetopft" },
  { value: "sick", label: "Krank" },
  { value: "growing", label: "Wächst" },
] as const;

function ContextMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-full p-1.5 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
        aria-label="Aktionen"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border bg-card py-1 shadow-lg">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" />
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Löschen
          </button>
        </div>
      )}
    </div>
  );
}

export function TimelineTab({ checkIns, plantId }: TimelineTabProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showTimelapse, setShowTimelapse] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [infoIds, setInfoIds] = useState<Set<string>>(new Set());

  const [editingCheckIn, setEditingCheckIn] = useState<SerializedCheckIn | null>(null);
  const [deletingCheckInId, setDeletingCheckInId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleInfo = useCallback((id: string) => {
    setInfoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCheckIn) return;
    setSaving(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set("checkInId", editingCheckIn.id);
      await updateCheckIn(fd);
      setEditingCheckIn(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingCheckInId) return;
    setSaving(true);
    try {
      await deleteCheckIn(deletingCheckInId);
      setDeletingCheckInId(null);
    } finally {
      setSaving(false);
    }
  }

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
      {photosForLightbox.length >= 2 && (
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={() => setShowTimelapse(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Play className="h-3.5 w-3.5" />
            Timelapse
          </button>
        </div>
      )}

      <div className="relative pl-8 pt-2">
        {/* Vertical timeline line */}
        <div className="absolute left-[11px] top-4 bottom-0 w-px bg-border" />

        {checkIns.map((ci, i) => {
          const lbIndex = lightboxIndexMap.get(ci.id);
          const hasPhoto = !!ci.resolvedPhotoUrl;
          const date = new Date(ci.date);
          const expanded = expandedIds.has(ci.id);
          const showInfo = infoIds.has(ci.id);

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
              <div className="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                {/* Header row — always visible, tap to expand/collapse */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(ci.id)}
                  className="flex w-full items-center gap-3 p-3 text-left"
                >
                  {/* Small thumbnail */}
                  {ci.resolvedPhotoUrl ? (
                    <img
                      src={ci.resolvedPhotoUrl}
                      alt=""
                      className={`shrink-0 rounded-lg object-cover transition-all duration-300 ${
                        expanded ? "h-10 w-10" : "h-14 w-14"
                      }`}
                    />
                  ) : (
                    <div
                      className={`flex shrink-0 items-center justify-center rounded-lg bg-muted transition-all duration-300 ${
                        expanded ? "h-10 w-10" : "h-14 w-14"
                      }`}
                    >
                      <Leaf className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Status + date */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={ci.status} />
                      <span className="text-xs text-muted-foreground truncate">
                        {format(date, "dd. MMM yyyy, HH:mm", { locale: de })}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(date, {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>

                  {/* Info icon — only if notes exist */}
                  {ci.notes && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleInfo(ci.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          toggleInfo(ci.id);
                        }
                      }}
                      className={`shrink-0 rounded-full p-1.5 transition-colors ${
                        showInfo
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground"
                      }`}
                      aria-label="Notizen anzeigen"
                    >
                      <Info className="h-4 w-4" />
                    </div>
                  )}

                  {/* Context menu */}
                  <ContextMenu
                    onEdit={() => setEditingCheckIn(ci)}
                    onDelete={() => setDeletingCheckInId(ci.id)}
                  />
                </button>

                {/* Notes — revealed by info icon */}
                <AnimatePresence>
                  {showInfo && ci.notes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t px-3 py-2.5">
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {ci.notes}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expanded photo */}
                <AnimatePresence>
                  {expanded && ci.resolvedPhotoUrl && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden rounded-b-xl"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          lbIndex !== undefined && setOpenIndex(lbIndex)
                        }
                        className="group relative block w-full focus:outline-none"
                      >
                        <img
                          src={ci.resolvedPhotoUrl}
                          alt=""
                          className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                        <div className="absolute bottom-2 right-2 rounded-full bg-black/40 p-1.5 text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                          <Camera className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
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

      {showTimelapse && photosForLightbox.length >= 2 && (
        <TimelapsePlayer
          photos={photosForLightbox}
          onClose={() => setShowTimelapse(false)}
        />
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCheckIn}
        onOpenChange={(open) => !open && setEditingCheckIn(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in bearbeiten</DialogTitle>
          </DialogHeader>
          {editingCheckIn && (
            <form onSubmit={handleUpdate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="edit-status"
                  className="mb-1 block text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  defaultValue={editingCheckIn.status}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-notes"
                  className="mb-1 block text-sm font-medium"
                >
                  Notizen
                </label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={editingCheckIn.notes ?? ""}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCheckIn(null)}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Speichern…" : "Speichern"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingCheckInId}
        onOpenChange={(open) => !open && setDeletingCheckInId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Check-in und
              ein eventuell vorhandenes Foto werden gelöscht.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeletingCheckInId(null)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Löschen…" : "Löschen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
