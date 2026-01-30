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

// Photo upload schemas

const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

export const presignRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_PHOTO_TYPES, {
    message: "Dateityp nicht erlaubt",
  }),
  fileSize: z.number().int().positive().max(MAX_PHOTO_SIZE, "Datei zu groß (max 10MB)"),
  plantId: z.string().optional(),
  takenAt: z.string().optional(),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;

export const confirmPhotoSchema = z.object({
  photoId: z.string().min(1),
});

export const batchPhotoUrlsSchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1).max(100),
  size: z.enum(["thumb", "original"]).default("thumb"),
});
