"use client";

import { Camera, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onUpload: (photoId: string) => void;
  plantId?: string;
  currentUrl?: string;
  className?: string;
}

export function PhotoUpload({
  onUpload,
  plantId,
  currentUrl,
  className,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      // 1. Get presigned upload URL
      const presignRes = await fetch("/api/photos/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          plantId: plantId || undefined,
        }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error || "Presign fehlgeschlagen");
      }
      const { uploadUrl, photoId } = await presignRes.json();

      // 2. Upload directly to S3/MinIO
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error("Upload zu S3 fehlgeschlagen");
      }

      // 3. Confirm upload (triggers thumbnail generation)
      const confirmRes = await fetch("/api/photos/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (!confirmRes.ok) {
        const data = await confirmRes.json();
        throw new Error(data.error || "Bestätigung fehlgeschlagen");
      }

      onUpload(photoId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
      setPreview(null);
      URL.revokeObjectURL(localUrl);
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onUpload("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Vorschau"
            className="h-48 w-full rounded-lg object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
          {!uploading && (
            <button
              onClick={clear}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-colors"
        >
          {uploading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <>
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Foto aufnehmen oder hochladen
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!preview && !uploading && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="mr-1 h-4 w-4" />
            Hochladen
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              if (fileRef.current) {
                fileRef.current.setAttribute("capture", "environment");
                fileRef.current.click();
                fileRef.current.removeAttribute("capture");
              }
            }}
          >
            <Camera className="mr-1 h-4 w-4" />
            Kamera
          </Button>
        </div>
      )}
    </div>
  );
}
