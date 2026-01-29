"use client";

import { Camera, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  className?: string;
}

export function PhotoUpload({ onUpload, currentUrl, className }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload fehlgeschlagen");

      const data = await res.json();
      setPreview(data.url);
      onUpload(data.url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setPreview(null);
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
          <button
            onClick={clear}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
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
              <span className="text-sm text-muted-foreground">Foto aufnehmen oder hochladen</span>
            </>
          )}
        </div>
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
