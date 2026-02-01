-- CreateTable
CREATE TABLE "plant_care_data" (
    "id" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "watering" TEXT NOT NULL,
    "light" TEXT NOT NULL,
    "temperature" TEXT NOT NULL,
    "substrate" TEXT NOT NULL,
    "problems" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'static',
    "perenualId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plant_care_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plant_care_data_scientificName_key" ON "plant_care_data"("scientificName");

-- CreateIndex
CREATE INDEX "plant_care_data_commonName_idx" ON "plant_care_data"("commonName");
