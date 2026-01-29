"use client";

import { logWatering, logFertilizing } from "@/app/actions/watering";
import { deletePlant } from "@/app/actions/plants";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Droplets, Sprout, Trash2 } from "lucide-react";
import { useState } from "react";

export function QuickActions({ plantId }: { plantId: string }) {
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleWater() {
    const fd = new FormData();
    fd.set("plantId", plantId);
    await logWatering(fd);
    toast({ title: "Gegossen", description: "Gießen wurde eingetragen." });
  }

  async function handleFertilize() {
    const fd = new FormData();
    fd.set("plantId", plantId);
    await logFertilizing(fd);
    toast({ title: "Gedüngt", description: "Düngen wurde eingetragen." });
  }

  async function handleDelete() {
    await deletePlant(plantId);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleWater}>
          <Droplets className="mr-1 h-4 w-4 text-blue-500" />
          Gießen
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleFertilize}>
          <Sprout className="mr-1 h-4 w-4 text-green-500" />
          Düngen
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pflanze löschen?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Check-ins und Events werden gelöscht.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
