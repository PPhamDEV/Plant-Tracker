"use client";

import { createPlant } from "@/app/actions/plants";
import { PhotoUpload } from "@/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

interface IdentResult {
  name: string;
  species: string;
  confidence: number;
}

export function NewPlantForm() {
  const [photoId, setPhotoId] = useState("");
  const [identResults, setIdentResults] = useState<IdentResult[]>([]);
  const [identifying, setIdentifying] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  async function handleIdentify() {
    if (!photoId) return;
    setIdentifying(true);
    try {
      const res = await fetch(`/api/identify-plant?photoId=${photoId}`);
      const data = await res.json();
      if (data.results) {
        setIdentResults(data.results);
      }
    } catch {
      toast({ title: "Fehler", description: "Erkennung fehlgeschlagen", variant: "destructive" });
    } finally {
      setIdentifying(false);
    }
  }

  function applyIdentResult(result: IdentResult) {
    const form = formRef.current;
    if (!form) return;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const speciesInput = form.elements.namedItem("species") as HTMLInputElement;
    if (nameInput) nameInput.value = result.name;
    if (speciesInput) speciesInput.value = result.species;
    setIdentResults([]);
    toast({ title: "Übernommen", description: `${result.name} eingetragen` });
  }

  async function handleSubmit(formData: FormData) {
    setPending(true);
    formData.set("photoId", photoId);
    try {
      await createPlant(formData);
    } catch {
      toast({ title: "Fehler", description: "Pflanze konnte nicht angelegt werden", variant: "destructive" });
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Foto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PhotoUpload onUpload={setPhotoId} />
          {photoId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleIdentify}
              disabled={identifying}
            >
              {identifying ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              Pflanze erkennen
            </Button>
          )}
          {identResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Vorschläge:</p>
              {identResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyIdentResult(r)}
                  className="flex w-full items-center justify-between rounded-md border border-border p-2 text-left text-sm hover:bg-muted"
                >
                  <span>
                    <strong>{r.name}</strong>{" "}
                    <span className="text-muted-foreground">({r.species})</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(r.confidence * 100)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pflichtangaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue="Unbekannt" required />
          </div>
          <div>
            <Label htmlFor="purchaseDate">Kaufdatum</Label>
            <Input
              id="purchaseDate"
              name="purchaseDate"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <Label htmlFor="location">Standort</Label>
            <Input id="location" name="location" placeholder="z.B. Fensterbank Wohnzimmer" required />
          </div>
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea id="notes" name="notes" placeholder="Optionale Notizen..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optionale Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="species">Art</Label>
              <Input id="species" name="species" placeholder="z.B. Monstera" />
            </div>
            <div>
              <Label htmlFor="variety">Varietät</Label>
              <Input id="variety" name="variety" placeholder="z.B. Deliciosa" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="origin">Herkunft/Shop</Label>
              <Input id="origin" name="origin" placeholder="z.B. Baumarkt" />
            </div>
            <div>
              <Label htmlFor="price">Preis</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="substrate">Substrat</Label>
              <Input id="substrate" name="substrate" placeholder="z.B. Erde" />
            </div>
            <div>
              <Label htmlFor="potSize">Topfgröße</Label>
              <Input id="potSize" name="potSize" placeholder="z.B. 12cm" />
            </div>
          </div>
          <div>
            <Label htmlFor="lightCondition">Lichtbedingung</Label>
            <Select id="lightCondition" name="lightCondition">
              <option value="">Nicht angegeben</option>
              <option value="Direkte Sonne">Direkte Sonne</option>
              <option value="Helles indirektes Licht">Helles indirektes Licht</option>
              <option value="Halbschatten">Halbschatten</option>
              <option value="Schatten">Schatten</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="wateringIntervalDays">Gieß-Intervall (Tage)</Label>
              <Input id="wateringIntervalDays" name="wateringIntervalDays" type="number" min="1" />
            </div>
            <div>
              <Label htmlFor="fertilizingIntervalDays">Dünge-Intervall (Tage)</Label>
              <Input id="fertilizingIntervalDays" name="fertilizingIntervalDays" type="number" min="1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <input type="hidden" name="photoId" value={photoId} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
        Pflanze anlegen
      </Button>
    </form>
  );
}
