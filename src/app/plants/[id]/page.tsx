import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createPresignedReadUrl } from "@/lib/s3";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Leaf, MapPin, Calendar, Droplets, Sprout, Sun } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { PlantActions } from "./plant-actions";
import { TimelineTab } from "./timeline-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

/** Resolve photo to a displayable URL (S3 signed or legacy local) */
async function resolvePhotoUrl(
  photo: { objectKeyThumb: string | null; objectKeyOriginal: string } | null,
  legacyUrl: string | null | undefined,
  size: "thumb" | "original" = "thumb"
): Promise<string | null> {
  if (photo) {
    const key =
      size === "original" || !photo.objectKeyThumb
        ? photo.objectKeyOriginal
        : photo.objectKeyThumb;
    try {
      return await createPresignedReadUrl(key);
    } catch {
      return null;
    }
  }
  return legacyUrl || null;
}

export default async function PlantDetailPage({ params }: Props) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const plant = await db.plant.findUnique({
    where: { id },
    include: {
      photo: true,
      checkIns: {
        orderBy: { date: "desc" },
        take: 50,
        include: { photo: true },
      },
      wateringEvents: { orderBy: { date: "desc" }, take: 20 },
      fertilizingEvents: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  if (!plant || plant.userId !== userId) notFound();

  // Resolve hero image
  const heroUrl = await resolvePhotoUrl(plant.photo, plant.photoUrl, "thumb");

  // Resolve check-in photo URLs
  const checkInsWithUrls = await Promise.all(
    plant.checkIns.map(async (ci) => ({
      ...ci,
      resolvedPhotoUrl: await resolvePhotoUrl(ci.photo, ci.photoUrl, "thumb"),
      photoId: ci.photo?.id ?? null,
    }))
  );

  const daysSincePurchase = Math.floor(
    (Date.now() - plant.purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastWatered = plant.wateringEvents[0]?.date;
  const lastFertilized = plant.fertilizingEvents[0]?.date;
  const lastCheckIn = plant.checkIns[0];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={plant.name}
            className="h-56 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-56 w-full items-center justify-center rounded-xl bg-muted">
            <Leaf className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-gradient-to-t from-black/70 to-transparent p-4">
          <h1 className="text-2xl font-bold text-white">{plant.name}</h1>
          {plant.species && (
            <p className="text-sm text-white/80">{plant.species}{plant.variety ? ` '${plant.variety}'` : ""}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge variant="outline" className="shrink-0">
          <Calendar className="mr-1 h-3 w-3" />
          {daysSincePurchase} Tage
        </Badge>
        <Badge variant="outline" className="shrink-0">
          <MapPin className="mr-1 h-3 w-3" />
          {plant.location}
        </Badge>
        {plant.lightCondition && (
          <Badge variant="outline" className="shrink-0">
            <Sun className="mr-1 h-3 w-3" />
            {plant.lightCondition}
          </Badge>
        )}
        {lastCheckIn && <StatusBadge status={lastCheckIn.status} />}
      </div>

      {/* Quick Actions + FAB + Bottom Sheet */}
      <PlantActions plantId={plant.id} />

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Card>
          <CardContent className="p-3">
            <Droplets className="mx-auto h-5 w-5 text-blue-500" />
            <p className="mt-1 text-xs text-muted-foreground">Zuletzt gegossen</p>
            <p className="text-sm font-medium">
              {lastWatered
                ? formatDistanceToNow(lastWatered, { addSuffix: true, locale: de })
                : "Nie"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <Sprout className="mx-auto h-5 w-5 text-green-500" />
            <p className="mt-1 text-xs text-muted-foreground">Zuletzt gedüngt</p>
            <p className="text-sm font-medium">
              {lastFertilized
                ? formatDistanceToNow(lastFertilized, { addSuffix: true, locale: de })
                : "Nie"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <Calendar className="mx-auto h-5 w-5 text-purple-500" />
            <p className="mt-1 text-xs text-muted-foreground">Check-ins</p>
            <p className="text-sm font-medium">{plant.checkIns.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      {(plant.notes || plant.substrate || plant.potSize || plant.origin || plant.price != null) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {plant.notes && <p>{plant.notes}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              {plant.substrate && <p>Substrat: <span className="text-foreground">{plant.substrate}</span></p>}
              {plant.potSize && <p>Topf: <span className="text-foreground">{plant.potSize}</span></p>}
              {plant.origin && <p>Herkunft: <span className="text-foreground">{plant.origin}</span></p>}
              {plant.price != null && <p>Preis: <span className="text-foreground">{plant.price}€</span></p>}
              {plant.wateringIntervalDays && <p>Gieß-Intervall: <span className="text-foreground">{plant.wateringIntervalDays} Tage</span></p>}
              {plant.fertilizingIntervalDays && <p>Dünge-Intervall: <span className="text-foreground">{plant.fertilizingIntervalDays} Tage</span></p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Timeline / Watering / Fertilizing */}
      <Tabs defaultValue="timeline">
        <TabsList className="w-full">
          <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
          <TabsTrigger value="watering" className="flex-1">Gießen</TabsTrigger>
          <TabsTrigger value="fertilizing" className="flex-1">Düngen</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <TimelineTab
            checkIns={checkInsWithUrls.map((ci) => ({
              id: ci.id,
              date: ci.date.toISOString(),
              status: ci.status,
              notes: ci.notes,
              resolvedPhotoUrl: ci.resolvedPhotoUrl,
              photoId: ci.photoId,
            }))}
          />
        </TabsContent>

        <TabsContent value="watering">
          {plant.wateringEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Noch nicht gegossen.</p>
          ) : (
            <div className="space-y-2">
              {plant.wateringEvents.map((w) => (
                <Card key={w.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(w.date, "dd.MM.yyyy HH:mm", { locale: de })}
                      </p>
                      {w.notes && <p className="text-xs text-muted-foreground">{w.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fertilizing">
          {plant.fertilizingEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Noch nicht gedüngt.</p>
          ) : (
            <div className="space-y-2">
              {plant.fertilizingEvents.map((f) => (
                <Card key={f.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Sprout className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(f.date, "dd.MM.yyyy HH:mm", { locale: de })}
                      </p>
                      {f.fertilizer && <p className="text-xs text-muted-foreground">{f.fertilizer}</p>}
                      {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
