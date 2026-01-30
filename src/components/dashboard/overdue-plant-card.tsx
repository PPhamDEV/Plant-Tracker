"use client";

import { Leaf, Droplets, Flower2 } from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { QuickActionButton } from "./quick-action-button";
import { logWatering, logFertilizing } from "@/app/actions/watering";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

interface OverduePlantCardProps {
  plant: {
    id: string;
    name: string;
    location: string;
    resolvedPhotoUrl: string | null;
    wateringProgress: number; // 0.0 - 1.0+
    daysSinceWatered: number | null;
  };
}

export function OverduePlantCard({ plant }: OverduePlantCardProps) {
  const { toast } = useToast();

  async function handleWater() {
    const formData = new FormData();
    formData.set("plantId", plant.id);
    try {
      await logWatering(formData);
      toast({ title: `${plant.name} gegossen!` });
    } catch {
      toast({ title: "Fehler beim Gießen", variant: "destructive" });
      throw new Error("Failed");
    }
  }

  async function handleFertilize() {
    const formData = new FormData();
    formData.set("plantId", plant.id);
    try {
      await logFertilizing(formData);
      toast({ title: `${plant.name} gedüngt!` });
    } catch {
      toast({ title: "Fehler beim Düngen", variant: "destructive" });
      throw new Error("Failed");
    }
  }

  return (
    <div className="glass-card rounded-xl p-3">
      <div className="flex items-center gap-3">
        <ProgressRing progress={plant.wateringProgress} size={52} strokeWidth={3}>
          <Link href={`/plants/${plant.id}`}>
            {plant.resolvedPhotoUrl ? (
              <img
                src={plant.resolvedPhotoUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Leaf className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </Link>
        </ProgressRing>

        <Link href={`/plants/${plant.id}`} className="flex-1 min-w-0">
          <p className="font-medium truncate">{plant.name}</p>
          <p className="text-xs text-muted-foreground">{plant.location}</p>
          {plant.daysSinceWatered !== null && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Seit {plant.daysSinceWatered} {plant.daysSinceWatered === 1 ? "Tag" : "Tagen"} nicht gegossen
            </p>
          )}
        </Link>

        <div className="flex flex-col gap-1.5 shrink-0">
          <QuickActionButton
            icon={<Droplets className="h-3.5 w-3.5" />}
            label="Gießen"
            confirmLabel="Jetzt gießen?"
            onAction={handleWater}
            variant="water"
          />
          <QuickActionButton
            icon={<Flower2 className="h-3.5 w-3.5" />}
            label="Düngen"
            confirmLabel="Jetzt düngen?"
            onAction={handleFertilize}
            variant="fertilize"
          />
        </div>
      </div>
    </div>
  );
}
