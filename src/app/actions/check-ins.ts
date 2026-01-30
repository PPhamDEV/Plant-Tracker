"use server";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createCheckInSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert: one check-in per plant per day
  const existing = await db.plantCheckIn.findUnique({
    where: {
      plantId_date: {
        plantId: data.plantId,
        date: today,
      },
    },
  });

  if (existing) {
    await db.plantCheckIn.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        notes: data.notes,
        photoUrl: photoId ? undefined : data.photoUrl,
        photoId: photoId || undefined,
      },
    });
  } else {
    await db.plantCheckIn.create({
      data: {
        plantId: data.plantId,
        status: data.status,
        notes: data.notes,
        photoUrl: photoId ? undefined : data.photoUrl,
        photoId: photoId || undefined,
        date: today,
      },
    });
  }

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
