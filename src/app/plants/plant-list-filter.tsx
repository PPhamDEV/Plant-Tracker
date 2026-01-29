"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Props {
  locations: string[];
  currentLocation?: string;
  currentSort?: string;
  currentQuery?: string;
}

export function PlantListFilter({ locations, currentLocation, currentSort, currentQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/plants?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Suche..."
        defaultValue={currentQuery}
        onChange={(e) => {
          const timeout = setTimeout(() => updateParam("q", e.target.value), 300);
          return () => clearTimeout(timeout);
        }}
        className="flex-1"
      />
      <Select
        value={currentLocation || ""}
        onChange={(e) => updateParam("location", e.target.value)}
      >
        <option value="">Alle Standorte</option>
        {locations.map((loc) => (
          <option key={loc} value={loc}>
            {loc}
          </option>
        ))}
      </Select>
      <Select
        value={currentSort || ""}
        onChange={(e) => updateParam("sort", e.target.value)}
      >
        <option value="">Zuletzt aktualisiert</option>
        <option value="name">Name</option>
        <option value="created">Neueste zuerst</option>
      </Select>
    </div>
  );
}
