"use server";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createCheckInSchema, updateCheckInSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { deleteObject } from "@/lib/s3";

export async function createCheckIn(formData: FormData) {
  const userId = await getCurrentUserId();

  const raw = {
    plantId: formData.get("plantId") as string,
    status: formData.get("status") as string || "ok",
    notes: formData.get("notes") as string || undefined,
    photoUrl: formData.get("photoUrl") as string || undefined,
  };

  const data = createCheckInSchema.parse(raw);

  // Verify plant ownership
  const plant = await db.plant.findUnique({ where: { id: data.plantId } });
  if (!plant || plant.userId !== userId) {
    throw new Error("Pflanze nicht gefunden oder keine Berechtigung");
  }

  const photoId = (formData.get("photoId") as string) || undefined;

  await db.plantCheckIn.create({
    data: {
      plantId: data.plantId,
      status: data.status,
      notes: data.notes,
      photoUrl: photoId ? undefined : data.photoUrl,
      photoId: photoId || undefined,
    },
  });

  // Associate photo with plant if not already
  if (photoId) {
    await db.plantPhoto.update({
      where: { id: photoId },
      data: { plantId: data.plantId },
    });
  }

  revalidatePath(`/plants/${data.plantId}`);
  revalidatePath("/");
}

export async function updateCheckIn(formData: FormData) {
  const userId = await getCurrentUserId();

  const raw = {
    checkInId: formData.get("checkInId") as string,
    status: formData.get("status") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const data = updateCheckInSchema.parse(raw);

  const checkIn = await db.plantCheckIn.findUnique({
    where: { id: data.checkInId },
    include: { plant: true },
  });
  if (!checkIn || checkIn.plant.userId !== userId) {
    throw new Error("Check-in nicht gefunden oder keine Berechtigung");
  }

  await db.plantCheckIn.update({
    where: { id: data.checkInId },
    data: {
      status: data.status,
      notes: data.notes ?? null,
    },
  });

  revalidatePath(`/plants/${checkIn.plantId}`);
  revalidatePath("/");
}

export async function deleteCheckIn(checkInId: string) {
  const userId = await getCurrentUserId();

  const checkIn = await db.plantCheckIn.findUnique({
    where: { id: checkInId },
    include: { plant: true, photo: true },
  });
  if (!checkIn || checkIn.plant.userId !== userId) {
    throw new Error("Check-in nicht gefunden oder keine Berechtigung");
  }

  // Clean up S3 objects and photo record if present
  if (checkIn.photo) {
    const keysToDelete = [
      checkIn.photo.objectKeyOriginal,
      checkIn.photo.objectKeyThumb,
    ].filter(Boolean) as string[];

    await Promise.all(keysToDelete.map((key) => deleteObject(key)));
    await db.plantPhoto.delete({ where: { id: checkIn.photo.id } });
  }

  await db.plantCheckIn.delete({ where: { id: checkInId } });

  revalidatePath(`/plants/${checkIn.plantId}`);
  revalidatePath("/");
}
