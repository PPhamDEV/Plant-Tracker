import { z } from "zod";

export const createPlantSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich").default("Unbekannt"),
  species: z.string().optional(),
  variety: z.string().optional(),
  purchaseDate: z.string().optional(),
  location: z.string().min(1).default("Unbekannt"),
  notes: z.string().optional(),
  origin: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  substrate: z.string().optional(),
  potSize: z.string().optional(),
  lightCondition: z.string().optional(),
  wateringIntervalDays: z.coerce.number().int().positive().optional(),
  fertilizingIntervalDays: z.coerce.number().int().positive().optional(),
  photoUrl: z.string().optional(),
});

export type CreatePlantInput = z.infer<typeof createPlantSchema>;

export const createCheckInSchema = z.object({
  plantId: z.string().min(1),
  status: z.enum(["ok", "thirsty", "pests", "repotted", "sick", "growing"]).default("ok"),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
});

export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;

export const createWateringSchema = z.object({
  plantId: z.string().min(1),
  notes: z.string().optional(),
});

export const createFertilizingSchema = z.object({
  plantId: z.string().min(1),
  notes: z.string().optional(),
  fertilizer: z.string().optional(),
});
