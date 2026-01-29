import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create default user
  const user = await prisma.user.upsert({
    where: { email: "admin@plant-tracker.local" },
    update: {},
    create: {
      email: "admin@plant-tracker.local",
      password: "not-used",
      name: "Admin",
    },
  });

  console.log("User created:", user.email);

  // Create sample plants
  const monstera = await prisma.plant.create({
    data: {
      userId: user.id,
      name: "Monstera",
      species: "Monstera deliciosa",
      location: "Wohnzimmer",
      purchaseDate: new Date("2024-06-15"),
      notes: "Großes Exemplar, sehr gesund",
      origin: "Baumarkt",
      price: 24.99,
      substrate: "Zimmerpflanzenerde",
      potSize: "21cm",
      lightCondition: "Helles indirektes Licht",
      wateringIntervalDays: 7,
      fertilizingIntervalDays: 14,
    },
  });

  const pothos = await prisma.plant.create({
    data: {
      userId: user.id,
      name: "Efeutute",
      species: "Epipremnum aureum",
      location: "Küche",
      purchaseDate: new Date("2024-08-01"),
      notes: "Hängende Pflanze am Regal",
      substrate: "Erde + Perlite",
      potSize: "14cm",
      lightCondition: "Halbschatten",
      wateringIntervalDays: 5,
    },
  });

  const snake = await prisma.plant.create({
    data: {
      userId: user.id,
      name: "Bogenhanf",
      species: "Sansevieria trifasciata",
      variety: "Laurentii",
      location: "Schlafzimmer",
      purchaseDate: new Date("2024-03-20"),
      origin: "Geschenk",
      lightCondition: "Schatten",
      wateringIntervalDays: 14,
    },
  });

  console.log("Plants created:", monstera.name, pothos.name, snake.name);

  // Create some check-ins
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  await prisma.plantCheckIn.createMany({
    data: [
      { plantId: monstera.id, status: "ok", notes: "Sieht super aus!", date: today },
      { plantId: monstera.id, status: "growing", notes: "Neues Blatt entdeckt", date: yesterday },
      { plantId: pothos.id, status: "thirsty", notes: "Blätter hängen leicht", date: yesterday },
      { plantId: snake.id, status: "ok", date: twoDaysAgo },
    ],
  });

  // Create some watering events
  await prisma.wateringEvent.createMany({
    data: [
      { plantId: monstera.id, date: today },
      { plantId: monstera.id, date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { plantId: pothos.id, date: yesterday },
      { plantId: snake.id, date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000) },
    ],
  });

  // Create a fertilizing event
  await prisma.fertilizingEvent.createMany({
    data: [
      { plantId: monstera.id, fertilizer: "Flüssigdünger", date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
