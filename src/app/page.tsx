import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { auth } from "@/lib/auth";
import { createPresignedReadUrl } from "@/lib/s3";
import { DashboardClient, type DashboardData } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

type PlantWithWatering = Awaited<ReturnType<typeof db.plant.findMany<{
  include: { photo: true; wateringEvents: { orderBy: { date: "desc" }; take: 1 } };
}>>>[number];

async function resolvePlantPhotoUrl(plant: PlantWithWatering): Promise<string | null> {
  if (plant.photo) {
    const key = plant.photo.objectKeyThumb || plant.photo.objectKeyOriginal;
    try {
      return await createPresignedReadUrl(key);
    } catch { /* ignore */ }
  }
  return plant.photoUrl || null;
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  // Get unique days (YYYY-MM-DD), sorted descending
  const uniqueDays = [
    ...new Set(
      dates.map((d) => {
        const local = new Date(d);
        return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
      })
    ),
  ].sort().reverse();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Streak must start from today or yesterday
  const firstDay = uniqueDays[0];
  if (!firstDay) return 0;

  const firstDate = new Date(firstDay + "T00:00:00");
  const todayDate = new Date(todayStr + "T00:00:00");
  const diffFromToday = Math.floor((todayDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffFromToday > 1) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const curr = new Date(uniqueDays[i] + "T00:00:00");
    const prev = new Date(uniqueDays[i - 1] + "T00:00:00");
    const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function getDashboardData(): Promise<DashboardData> {
  try {
    const userId = await getCurrentUserId();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get user name
    const session = await auth();
    const userName = session?.user?.name ?? null;

    // Fetch streak data: all care events from last 100 days
    const hundredDaysAgo = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000);

    const [plantCount, todayCheckIns, plants, wateringDates, fertilizingDates] = await Promise.all([
      db.plant.count({ where: { userId } }),
      db.plantCheckIn.count({ where: { date: { gte: todayStart }, plant: { userId } } }),
      db.plant.findMany({
        where: { userId },
        include: {
          photo: true,
          wateringEvents: { orderBy: { date: "desc" }, take: 1 },
        },
      }),
      db.wateringEvent.findMany({
        where: { plant: { userId }, date: { gte: hundredDaysAgo } },
        select: { date: true },
      }),
      db.fertilizingEvent.findMany({
        where: { plant: { userId }, date: { gte: hundredDaysAgo } },
        select: { date: true },
      }),
    ]);

    // Calculate streak from combined care events
    const allCareDates = [
      ...wateringDates.map((w) => w.date),
      ...fertilizingDates.map((f) => f.date),
    ];
    const streak = calculateStreak(allCareDates);

    // Plants overdue for watering
    const overdueWatering = plants.filter((plant) => {
      if (!plant.wateringIntervalDays) return false;
      const lastWatered = plant.wateringEvents[0]?.date;
      if (!lastWatered) return true;
      const diff = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= plant.wateringIntervalDays;
    });

    // Plants needing check-in (no check-in today)
    const plantsWithCheckIn = await db.plantCheckIn.findMany({
      where: { date: { gte: todayStart }, plant: { userId } },
      select: { plantId: true },
    });
    const checkedInIds = new Set(plantsWithCheckIn.map((c) => c.plantId));
    const needsCheckIn = plants.filter((p) => !checkedInIds.has(p.id));

    // Resolve photo URLs and build overdue plants with progress data
    const overduePlants = await Promise.all(
      overdueWatering.slice(0, 8).map(async (plant) => {
        const lastWatered = plant.wateringEvents[0]?.date;
        const daysSinceWatered = lastWatered
          ? Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const wateringProgress =
          plant.wateringIntervalDays && daysSinceWatered !== null
            ? daysSinceWatered / plant.wateringIntervalDays
            : 1;

        return {
          id: plant.id,
          name: plant.name,
          location: plant.location,
          resolvedPhotoUrl: await resolvePlantPhotoUrl(plant),
          wateringProgress,
          daysSinceWatered,
        };
      })
    );

    const needsCheckInPlants = await Promise.all(
      needsCheckIn.slice(0, 8).map(async (plant) => ({
        id: plant.id,
        name: plant.name,
        location: plant.location,
        resolvedPhotoUrl: await resolvePlantPhotoUrl(plant),
      }))
    );

    return {
      userName,
      plantCount,
      todayCheckIns,
      overdueCount: overdueWatering.length,
      needsCheckInCount: needsCheckIn.length,
      streak,
      overduePlants,
      needsCheckInPlants,
    };
  } catch {
    return {
      userName: null,
      plantCount: 0,
      todayCheckIns: 0,
      overdueCount: 0,
      needsCheckInCount: 0,
      streak: 0,
      overduePlants: [],
      needsCheckInPlants: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return <DashboardClient data={data} />;
}
