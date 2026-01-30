import { db } from "@/lib/db";
import { createPresignedReadUrl } from "@/lib/s3";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Leaf, Plus, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { PlantListFilter } from "./plant-list-filter";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; location?: string; sort?: string }>;
}

export default async function PlantsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { q, location, sort } = params;

  let plants: Awaited<ReturnType<typeof db.plant.findMany<{
    include: {
      photo: true;
      checkIns: { orderBy: { date: "desc" }; take: 1 };
    };
  }>>> = [];
  try {
    plants = await db.plant.findMany({
      where: {
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
        ...(location ? { location } : {}),
      },
      include: {
        photo: true,
        checkIns: { orderBy: { date: "desc" }, take: 1 },
      },
      orderBy: sort === "name"
        ? { name: "asc" }
        : sort === "created"
          ? { createdAt: "desc" }
          : { updatedAt: "desc" },
    });
  } catch {
    plants = [];
  }

  // Resolve photo URLs for all plants
  const plantsWithUrls = await Promise.all(
    plants.map(async (plant) => {
      let resolvedPhotoUrl: string | null = null;
      if (plant.photo) {
        const key = plant.photo.objectKeyThumb || plant.photo.objectKeyOriginal;
        try {
          resolvedPhotoUrl = await createPresignedReadUrl(key);
        } catch { /* ignore */ }
      } else if (plant.photoUrl) {
        resolvedPhotoUrl = plant.photoUrl;
      }
      return { ...plant, resolvedPhotoUrl };
    })
  );

  let locations: string[] = [];
  try {
    const raw = await db.plant.findMany({ select: { location: true }, distinct: ["location"] });
    locations = raw.map((r) => r.location);
  } catch {
    // ignore
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pflanzen</h1>
        <Link href="/plants/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Neu
          </Button>
        </Link>
      </div>

      <PlantListFilter locations={locations} currentLocation={location} currentSort={sort} currentQuery={q} />

      {plantsWithUrls.length === 0 ? (
        <EmptyState
          icon={Leaf}
          title="Keine Pflanzen gefunden"
          description={q || location ? "Versuche andere Filter." : "Lege deine erste Pflanze an!"}
        >
          {!q && !location && (
            <Link href="/plants/new">
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Pflanze anlegen
              </Button>
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-2">
          {plantsWithUrls.map((plant) => {
            const lastCheckIn = plant.checkIns[0];
            return (
              <Link key={plant.id} href={`/plants/${plant.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="flex items-center gap-3 p-3">
                    {plant.resolvedPhotoUrl ? (
                      <img
                        src={plant.resolvedPhotoUrl}
                        alt={plant.name}
                        className="h-14 w-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                        <Leaf className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{plant.name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {plant.location}
                      </div>
                      {lastCheckIn && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Letzter Check-in:{" "}
                          {formatDistanceToNow(lastCheckIn.date, { addSuffix: true, locale: de })}
                        </p>
                      )}
                    </div>
                    {lastCheckIn && <StatusBadge status={lastCheckIn.status} />}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
