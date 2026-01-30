import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { downloadObject, uploadBuffer, headObject } from "@/lib/s3";
import { confirmPhotoSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { photoId } = confirmPhotoSchema.parse(body);

    const photo = await db.plantPhoto.findUnique({ where: { id: photoId } });
    if (!photo || photo.userId !== userId) {
      return NextResponse.json(
        { error: "Foto nicht gefunden" },
        { status: 404 }
      );
    }
    if (photo.status === "confirmed") {
      return NextResponse.json({ photoId: photo.id, status: "confirmed" });
    }

    // Verify the object exists in S3
    try {
      await headObject(photo.objectKeyOriginal);
    } catch {
      return NextResponse.json(
        { error: "Datei nicht in S3 gefunden. Upload abgeschlossen?" },
        { status: 400 }
      );
    }

    // Generate thumbnail with sharp
    let width: number | undefined;
    let height: number | undefined;
    try {
      const originalBuffer = await downloadObject(photo.objectKeyOriginal);
      const image = sharp(originalBuffer).rotate(); // auto-rotate based on EXIF orientation
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      const thumbBuffer = await image
        .resize({ width: 600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      await uploadBuffer(
        photo.objectKeyThumb!,
        thumbBuffer,
        "image/webp"
      );
    } catch (err) {
      // Thumbnail generation failed — continue without thumb
      console.error("Thumbnail-Erzeugung fehlgeschlagen:", err);
    }

    // Update DB record
    const updated = await db.plantPhoto.update({
      where: { id: photoId },
      data: {
        status: "confirmed",
        width,
        height,
      },
    });

    return NextResponse.json({
      photoId: updated.id,
      status: "confirmed",
      width: updated.width,
      height: updated.height,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Nicht authentifiziert") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Bestätigung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
