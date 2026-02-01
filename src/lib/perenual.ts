/**
 * Perenual Plant API client.
 *
 * Free tier: 100 requests/day, species details only for ID < 3000.
 * We use this as a supplement — static data is the primary fallback.
 */

const PERENUAL_BASE = "https://perenual.com/api/v2";

interface PerenualSpeciesListItem {
  id: number;
  common_name: string;
  scientific_name: string[];
}

interface PerenualSpeciesDetails {
  id: number;
  common_name: string;
  scientific_name: string[];
  watering: string;
  watering_general_benchmark: { value: string; unit: string } | null;
  sunlight: string[];
  cycle: string;
  growth_rate: string | null;
  maintenance: string | null;
  care_level: string | null;
  indoor: boolean;
  description: string | null;
  hardiness: { min: string; max: string } | null;
  propagation: string[];
  pruning_month: string[];
}

function getApiKey(): string {
  const key = process.env.PERENUAL_API_KEY;
  if (!key) throw new Error("PERENUAL_API_KEY ist nicht gesetzt");
  return key;
}

/** Search for a species by name, returns ID and basic info. */
export async function searchSpecies(
  query: string
): Promise<PerenualSpeciesListItem[]> {
  const key = getApiKey();
  const url = `${PERENUAL_BASE}/species-list?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

/** Get full species details (only works for ID < 3000 on free tier). */
export async function getSpeciesDetails(
  id: number
): Promise<PerenualSpeciesDetails | null> {
  if (id >= 3000) return null; // Free tier limitation
  const key = getApiKey();
  const url = `${PERENUAL_BASE}/species/details/${id}?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return null;
  const data = await res.json();
  // Check if the response contains "Upgrade Plans" strings
  if (
    typeof data.watering === "string" &&
    data.watering.includes("Upgrade Plans")
  ) {
    return null;
  }
  return data;
}

/** Map Perenual watering values to German care description. */
function mapWatering(details: PerenualSpeciesDetails): string {
  const benchmark = details.watering_general_benchmark;
  const freq = details.watering?.toLowerCase() ?? "";
  const days = benchmark?.value?.replace(/"/g, "") ?? "";
  const unit = benchmark?.unit ?? "";

  const parts: string[] = [];
  if (freq === "frequent") {
    parts.push("Regelmäßig gießen, Erde stets leicht feucht halten.");
  } else if (freq === "average") {
    parts.push(
      "Mäßig gießen, obere Erdschicht zwischen den Wassergaben antrocknen lassen."
    );
  } else if (freq === "minimum") {
    parts.push(
      "Sehr sparsam gießen, Erde zwischen den Wassergaben gut austrocknen lassen."
    );
  } else if (freq) {
    parts.push(`Gießen: ${details.watering}.`);
  }

  if (days && unit) {
    parts.push(`Richtwert: alle ${days} ${unit === "days" ? "Tage" : unit}.`);
  }

  parts.push("Staunässe unbedingt vermeiden.");
  return parts.join(" ");
}

/** Map sunlight array to German description. */
function mapLight(details: PerenualSpeciesDetails): string {
  const sl = details.sunlight ?? [];
  if (sl.length === 0) return "Helles indirektes Licht ist für die meisten Zimmerpflanzen ideal.";

  const mapped = sl.map((s) => {
    const l = s.toLowerCase();
    if (l.includes("full sun")) return "volle Sonne";
    if (l.includes("full shade")) return "Schatten";
    if (l.includes("part shade") || l.includes("part sun"))
      return "Halbschatten";
    if (l.includes("filtered")) return "gefiltertes Licht";
    return s;
  });

  return `Bevorzugt: ${mapped.join(", ")}. Direkte Mittagssonne bei empfindlichen Pflanzen vermeiden.`;
}

/** Map hardiness to German temperature description. */
function mapTemperature(details: PerenualSpeciesDetails): string {
  const parts: string[] = [];
  parts.push("18–25 °C ist für die meisten Zimmerpflanzen optimal.");

  if (details.hardiness) {
    const zone = details.hardiness.min;
    if (parseInt(zone) >= 10) {
      parts.push("Nicht frosthart, ganzjährig drinnen halten.");
    }
  }

  if (details.indoor) {
    parts.push("Gut als Zimmerpflanze geeignet.");
  }

  parts.push("Zugluft und direkte Heizungsluft vermeiden.");
  return parts.join(" ");
}

/** Build substrate description. */
function mapSubstrate(details: PerenualSpeciesDetails): string {
  const parts: string[] = [];
  parts.push("Lockere, gut durchlässige Erde verwenden.");

  if (
    details.propagation?.some((p) =>
      p.toLowerCase().includes("cutting")
    )
  ) {
    parts.push("Lässt sich gut durch Stecklinge vermehren.");
  }

  if (details.pruning_month?.length > 0) {
    const months = details.pruning_month.slice(0, 3).join(", ");
    parts.push(`Bester Zeitpunkt zum Schneiden: ${months}.`);
  }

  parts.push("Alle 1–2 Jahre umtopfen, Frühjahr ist ideal.");
  return parts.join(" ");
}

/** Build common problems description. */
function mapProblems(details: PerenualSpeciesDetails): string {
  const parts: string[] = [];

  const maintenance = details.maintenance?.toLowerCase();
  if (maintenance === "low") {
    parts.push("Pflegeleichte Pflanze mit geringem Aufwand.");
  } else if (maintenance === "high") {
    parts.push(
      "Anspruchsvollere Pflanze, die regelmäßige Aufmerksamkeit braucht."
    );
  }

  const growth = details.growth_rate?.toLowerCase();
  if (growth === "high") {
    parts.push("Schnellwachsend — regelmäßig auf ausreichend Platz achten.");
  }

  parts.push(
    "Gelbe Blätter deuten oft auf Übergießen hin, braune Spitzen auf zu trockene Luft."
  );
  return parts.join(" ");
}

export interface PerenualCareData {
  scientificName: string;
  commonName: string;
  watering: string;
  light: string;
  temperature: string;
  substrate: string;
  problems: string;
  perenualId: number;
}

/**
 * Fetch care data from Perenual for a given species name.
 * Returns null if species not found or outside free tier.
 */
export async function fetchCareDataFromPerenual(
  speciesName: string
): Promise<PerenualCareData | null> {
  try {
    const results = await searchSpecies(speciesName);
    if (results.length === 0) return null;

    // Find the best match with ID < 3000
    const match = results.find((r) => r.id < 3000);
    if (!match) return null;

    const details = await getSpeciesDetails(match.id);
    if (!details) return null;

    return {
      scientificName: details.scientific_name[0] ?? speciesName,
      commonName: details.common_name,
      watering: mapWatering(details),
      light: mapLight(details),
      temperature: mapTemperature(details),
      substrate: mapSubstrate(details),
      problems: mapProblems(details),
      perenualId: details.id,
    };
  } catch {
    return null;
  }
}
