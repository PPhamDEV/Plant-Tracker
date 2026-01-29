"use server";

import { db } from "@/lib/db";
import { createCheckInSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createCheckIn(formData: FormData) {
  const raw = {
    plantId: formData.get("plantId") as string,
    status: formData.get("status") as string || "ok",
    notes: formData.get("notes") as string || undefined,
    photoUrl: formData.get("photoUrl") as string || undefined,
  };

  const data = createCheckInSchema.parse(raw);

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
        photoUrl: data.photoUrl,
      },
    });
  } else {
    await db.plantCheckIn.create({
      data: {
        plantId: data.plantId,
        status: data.status,
        notes: data.notes,
        photoUrl: data.photoUrl,
        date: today,
      },
    });
  }

  revalidatePath(`/plants/${data.plantId}`);
  revalidatePath("/");
}
