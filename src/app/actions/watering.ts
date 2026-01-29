"use server";

import { db } from "@/lib/db";
import { createWateringSchema, createFertilizingSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function logWatering(formData: FormData) {
  const data = createWateringSchema.parse({
    plantId: formData.get("plantId") as string,
    notes: formData.get("notes") as string || undefined,
  });

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
  const data = createFertilizingSchema.parse({
    plantId: formData.get("plantId") as string,
    notes: formData.get("notes") as string || undefined,
    fertilizer: formData.get("fertilizer") as string || undefined,
  });

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
