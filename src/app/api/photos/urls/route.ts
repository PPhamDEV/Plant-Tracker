import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createPresignedReadUrl } from "@/lib/s3";
import { batchPhotoUrlsSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { photoIds, size } = batchPhotoUrlsSchema.parse(body);

    const photos = await db.plantPhoto.findMany({
      where: { id: { in: photoIds }, userId },
    });

    const urls: Record<string, string> = {};
    await Promise.all(
      photos.map(async (photo) => {
        const key =
          size === "original" || !photo.objectKeyThumb
            ? photo.objectKeyOriginal
            : photo.objectKeyThumb;
        urls[photo.id] = await createPresignedReadUrl(key);
      })
    );

    return NextResponse.json({ urls });
  } catch (err) {
    if (err instanceof Error && err.message === "Nicht authentifiziert") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "URL-Erzeugung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
