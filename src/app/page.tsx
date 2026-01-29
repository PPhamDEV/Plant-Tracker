import { db } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Droplets, CalendarCheck, AlertTriangle, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [plantCount, todayCheckIns, plants] = await Promise.all([
      db.plant.count(),
      db.plantCheckIn.count({ where: { date: { gte: todayStart } } }),
      db.plant.findMany({
        include: {
          wateringEvents: { orderBy: { date: "desc" }, take: 1 },
        },
      }),
    ]);

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
      where: { date: { gte: todayStart } },
      select: { plantId: true },
    });
    const checkedInIds = new Set(plantsWithCheckIn.map((c) => c.plantId));
    const needsCheckIn = plants.filter((p) => !checkedInIds.has(p.id));

    return { plantCount, todayCheckIns, overdueWatering, needsCheckIn };
  } catch {
    return { plantCount: 0, todayCheckIns: 0, overdueWatering: [], needsCheckIn: [] };
  }
}

export default async function DashboardPage() {
  const { plantCount, todayCheckIns, overdueWatering, needsCheckIn } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/plants/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Neue Pflanze
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Leaf className="h-4 w-4" />
              Pflanzen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{plantCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              Check-ins heute
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayCheckIns}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Droplets className="h-4 w-4" />
              Gießen fällig
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {overdueWatering.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Ohne Check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{needsCheckIn.length}</p>
          </CardContent>
        </Card>
      </div>

      {overdueWatering.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Gießen überfällig</h2>
          <div className="space-y-2">
            {overdueWatering.slice(0, 5).map((plant) => (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center gap-3 p-3">
                    {plant.photoUrl ? (
                      <img src={plant.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Leaf className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{plant.name}</p>
                      <p className="text-xs text-muted-foreground">{plant.location}</p>
                    </div>
                    <Droplets className="h-4 w-4 text-yellow-500" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {needsCheckIn.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Heute noch kein Check-in</h2>
          <div className="space-y-2">
            {needsCheckIn.slice(0, 5).map((plant) => (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center gap-3 p-3">
                    {plant.photoUrl ? (
                      <img src={plant.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Leaf className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{plant.name}</p>
                      <p className="text-xs text-muted-foreground">{plant.location}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {plantCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Leaf className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium">Noch keine Pflanzen</p>
            <p className="mt-1 text-sm text-muted-foreground">Füge deine erste Pflanze hinzu!</p>
            <Link href="/plants/new" className="mt-4">
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Pflanze anlegen
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
