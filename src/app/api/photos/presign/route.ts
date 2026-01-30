import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createPresignedUploadUrl } from "@/lib/s3";
import { presignRequestSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const body = await request.json();
    const data = presignRequestSchema.parse(body);

    // Validate plant ownership if plantId provided
    if (data.plantId) {
      const plant = await db.plant.findUnique({
        where: { id: data.plantId },
        select: { userId: true },
      });
      if (!plant || plant.userId !== userId) {
        return NextResponse.json(
          { error: "Pflanze nicht gefunden" },
          { status: 404 }
        );
      }
    }

    // Build S3 object key
    const ext = data.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const id = uuidv4();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const objectKey = `users/${userId}/photos/${yearMonth}/${id}.${ext}`;
    const thumbKey = `users/${userId}/photos/${yearMonth}/${id}_thumb.webp`;

    // Create pending PlantPhoto record
    const photo = await db.plantPhoto.create({
      data: {
        userId,
        plantId: data.plantId || null,
        objectKeyOriginal: objectKey,
        objectKeyThumb: thumbKey,
        mimeType: data.fileType,
        sizeBytes: data.fileSize,
        takenAt: data.takenAt ? new Date(data.takenAt) : now,
        status: "pending",
      },
    });

    // Generate presigned PUT URL
    const uploadUrl = await createPresignedUploadUrl(
      objectKey,
      data.fileType,
      data.fileSize,
      600 // 10 min
    );

    return NextResponse.json({
      photoId: photo.id,
      uploadUrl,
      objectKey,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Nicht authentifiziert") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Presign fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
