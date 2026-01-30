"use server";

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createWateringSchema, createFertilizingSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function logWatering(formData: FormData) {
  const userId = await getCurrentUserId();

  const data = createWateringSchema.parse({
    plantId: formData.get("plantId") as string,
    notes: formData.get("notes") as string || undefined,
  });

  // Verify plant ownership
  const plant = await db.plant.findUnique({ where: { id: data.plantId } });
  if (!plant || plant.userId !== userId) {
    throw new Error("Pflanze nicht gefunden oder keine Berechtigung");
  }

  await db.wateringEvent.create({
    data: {
      plantId: data.plantId,
      notes: data.notes,
    },
  });

  revalidatePath(`/plants/${data.plantId}`);
  revalidatePath("/");
}

export async function logFertilizing(formData: FormData) {
  const userId = await getCurrentUserId();

  const data = createFertilizingSchema.parse({
    plantId: formData.get("plantId") as string,
    notes: formData.get("notes") as string || undefined,
    fertilizer: formData.get("fertilizer") as string || undefined,
  });

  // Verify plant ownership
  const plant = await db.plant.findUnique({ where: { id: data.plantId } });
  if (!plant || plant.userId !== userId) {
    throw new Error("Pflanze nicht gefunden oder keine Berechtigung");
  }

  await db.fertilizingEvent.create({
    data: {
      plantId: data.plantId,
      notes: data.notes,
      fertilizer: data.fertilizer,
    },
  });

  revalidatePath(`/plants/${data.plantId}`);
  revalidatePath("/");
}
