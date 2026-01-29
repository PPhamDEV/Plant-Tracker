import { NewPlantForm } from "./new-plant-form";

export default function NewPlantPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Neue Pflanze</h1>
      <NewPlantForm />
    </div>
  );
}
