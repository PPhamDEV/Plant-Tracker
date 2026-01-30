-- CreateTable
CREATE TABLE "plant_photos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT,
    "objectKeyOriginal" TEXT NOT NULL,
    "objectKeyThumb" TEXT,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_photos_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add photoId to plants
ALTER TABLE "plants" ADD COLUMN "photoId" TEXT;

-- AlterTable: add photoId to plant_check_ins
ALTER TABLE "plant_check_ins" ADD COLUMN "photoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "plants_photoId_key" ON "plants"("photoId");

-- CreateIndex
CREATE UNIQUE INDEX "plant_check_ins_photoId_key" ON "plant_check_ins"("photoId");

-- CreateIndex
CREATE INDEX "plant_photos_userId_idx" ON "plant_photos"("userId");

-- CreateIndex
CREATE INDEX "plant_photos_plantId_idx" ON "plant_photos"("plantId");

-- AddForeignKey: plant_photos -> users
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: plant_photos -> plants (PlantPhotos relation)
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: plants.photoId -> plant_photos (ProfilePhoto relation)
ALTER TABLE "plants" ADD CONSTRAINT "plants_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "plant_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: plant_check_ins.photoId -> plant_photos (CheckInPhoto relation)
ALTER TABLE "plant_check_ins" ADD CONSTRAINT "plant_check_ins_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "plant_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
