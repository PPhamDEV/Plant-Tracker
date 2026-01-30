"use server";

import { db } from "@/lib/db";
import { getDefaultUserId } from "@/lib/user";
import { createPlantSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPlant(formData: FormData) {
  const userId = await getDefaultUserId();

  const raw = {
    name: formData.get("name") as string,
    species: formData.get("species") as string || undefined,
    variety: formData.get("variety") as string || undefined,
    purchaseDate: formData.get("purchaseDate") as string || undefined,
    location: formData.get("location") as string,
    notes: formData.get("notes") as string || undefined,
    origin: formData.get("origin") as string || undefined,
    price: formData.get("price") ? Number(formData.get("price")) : undefined,
    substrate: formData.get("substrate") as string || undefined,
    potSize: formData.get("potSize") as string || undefined,
    lightCondition: formData.get("lightCondition") as string || undefined,
    wateringIntervalDays: formData.get("wateringIntervalDays") ? Number(formData.get("wateringIntervalDays")) : undefined,
    fertilizingIntervalDays: formData.get("fertilizingIntervalDays") ? Number(formData.get("fertilizingIntervalDays")) : undefined,
    photoUrl: formData.get("photoUrl") as string || undefined,
  };

  const data = createPlantSchema.parse(raw);
  const photoId = (formData.get("photoId") as string) || undefined;

  const plant = await db.plant.create({
    data: {
      userId,
      name: data.name,
      species: data.species,
      variety: data.variety,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
      location: data.location,
      notes: data.notes,
      origin: data.origin,
      price: data.price,
      substrate: data.substrate,
      potSize: data.potSize,
      lightCondition: data.lightCondition,
      wateringIntervalDays: data.wateringIntervalDays,
      fertilizingIntervalDays: data.fertilizingIntervalDays,
      photoUrl: photoId ? undefined : data.photoUrl,
      photoId: photoId || undefined,
    },
  });

  // Associate the PlantPhoto with this plant
  if (photoId) {
    await db.plantPhoto.update({
      where: { id: photoId },
      data: { plantId: plant.id },
    });
  }

  revalidatePath("/");
  revalidatePath("/plants");
  redirect(`/plants/${plant.id}`);
}

export async function deletePlant(plantId: string) {
  await db.plant.delete({ where: { id: plantId } });
  revalidatePath("/");
  revalidatePath("/plants");
  redirect("/plants");
}
