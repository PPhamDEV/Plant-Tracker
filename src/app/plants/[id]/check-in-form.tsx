"use client";

import { createCheckIn } from "@/app/actions/check-ins";
import { PhotoUpload } from "@/components/photo-upload";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface CheckInFormProps {
  plantId: string;
  onSuccess?: () => void;
}

export function CheckInForm({ plantId, onSuccess }: CheckInFormProps) {
  const [photoId, setPhotoId] = useState("");
  const [pending, setPending] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    setPending(true);
    formData.set("plantId", plantId);
    formData.set("photoId", photoId);
    try {
      await createCheckIn(formData);
      toast({ title: "Check-in gespeichert" });
      setPhotoId("");
      setFormKey((k) => k + 1);
      onSuccess?.();
    } catch {
      toast({ title: "Fehler", description: "Check-in fehlgeschlagen", variant: "destructive" });
    } finally {
      setPending(false);
    }
  }

  return (
    <form key={formKey} action={handleSubmit} className="space-y-3">
      <PhotoUpload onUpload={setPhotoId} plantId={plantId} />

      <div>
        <Label htmlFor="status">Status</Label>
        <Select id="status" name="status" defaultValue="ok">
          <option value="ok">OK</option>
          <option value="thirsty">Durstig</option>
          <option value="growing">Wächst</option>
          <option value="pests">Schädlinge</option>
          <option value="sick">Krank</option>
          <option value="repotted">Umgetopft</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notizen</Label>
        <Textarea id="notes" name="notes" placeholder="Was fällt dir auf?" />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
        Check-in speichern
      </Button>
    </form>
  );
}
