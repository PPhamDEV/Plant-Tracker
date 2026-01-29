-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Unbekannt',
    "species" TEXT,
    "variety" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL DEFAULT 'Unbekannt',
    "notes" TEXT,
    "origin" TEXT,
    "price" DOUBLE PRECISION,
    "substrate" TEXT,
    "potSize" TEXT,
    "lightCondition" TEXT,
    "wateringIntervalDays" INTEGER,
    "fertilizingIntervalDays" INTEGER,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_check_ins" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watering_events" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watering_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fertilizing_events" (
    "id" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "fertilizer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fertilizing_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "plants_userId_idx" ON "plants"("userId");

-- CreateIndex
CREATE INDEX "plants_location_idx" ON "plants"("location");

-- CreateIndex
CREATE INDEX "plant_check_ins_plantId_idx" ON "plant_check_ins"("plantId");

-- CreateIndex
CREATE INDEX "plant_check_ins_date_idx" ON "plant_check_ins"("date");

-- CreateIndex
CREATE UNIQUE INDEX "plant_check_ins_plantId_date_key" ON "plant_check_ins"("plantId", "date");

-- CreateIndex
CREATE INDEX "watering_events_plantId_idx" ON "watering_events"("plantId");

-- CreateIndex
CREATE INDEX "watering_events_date_idx" ON "watering_events"("date");

-- CreateIndex
CREATE INDEX "fertilizing_events_plantId_idx" ON "fertilizing_events"("plantId");

-- CreateIndex
CREATE INDEX "fertilizing_events_date_idx" ON "fertilizing_events"("date");

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_check_ins" ADD CONSTRAINT "plant_check_ins_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watering_events" ADD CONSTRAINT "watering_events_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizing_events" ADD CONSTRAINT "fertilizing_events_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
