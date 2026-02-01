export interface PlantIdentificationResult {
  /** Human-friendly name to show in UI (usually common name, fallback scientific). */
  name: string;
  /** Scientific species/binomial when available. */
  species: string;
  /** 0..1 confidence score (provider-specific, normalized). */
  confidence: number;
}

export interface PlantIdentificationProvider {
  identify(imageBuffer: Buffer): Promise<PlantIdentificationResult[]>;
}

export class MockIdentificationProvider implements PlantIdentificationProvider {
  async identify(_imageBuffer: Buffer): Promise<PlantIdentificationResult[]> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    const mockResults: PlantIdentificationResult[] = [
      { name: "Monstera Deliciosa", species: "Monstera deliciosa", confidence: 0.92 },
      { name: "Philodendron", species: "Philodendron hederaceum", confidence: 0.45 },
      { name: "Pothos", species: "Epipremnum aureum", confidence: 0.21 },
    ];
    return mockResults;
  }
}

/**
 * Pl@ntNet identification provider.
 *
 * Free tier: 500 identifications/day.
 * Docs: https://my.plantnet.org/doc/api/identify
 * Requires PLANTNET_API_KEY env variable.
 */
export class PlantNetIdentificationProvider
  implements PlantIdentificationProvider
{
  constructor(
    private options: {
      apiKey: string;
      topK?: number;
      lang?: string;
    }
  ) {}

  async identify(imageBuffer: Buffer): Promise<PlantIdentificationResult[]> {
    const topK = this.options.topK ?? 5;

    const form = new FormData();
    form.append(
      "images",
      new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
      "plant.jpg"
    );
    form.append("organs", "auto");

    const url = new URL("https://my-api.plantnet.org/v2/identify/all");
    url.searchParams.set("api-key", this.options.apiKey);
    url.searchParams.set("nb-results", String(topK));
    if (this.options.lang) {
      url.searchParams.set("lang", this.options.lang);
    }

    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PlantNet error (${res.status}): ${text || res.statusText}`);
    }

    const data = (await res.json()) as {
      results?: Array<{
        score: number;
        species?: {
          scientificNameWithoutAuthor?: string;
          commonNames?: string[];
        };
      }>;
    };

    const raw = Array.isArray(data.results) ? data.results : [];

    return raw
      .map((r) => {
        const species = r.species;
        if (!species?.scientificNameWithoutAuthor) return null;

        const scientific = species.scientificNameWithoutAuthor;
        const common = species.commonNames?.[0];

        return {
          name: common || scientific,
          species: scientific,
          confidence: clamp01(r.score),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .slice(0, topK);
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

// Factory: swap provider via env variable
export function getIdentificationProvider(): PlantIdentificationProvider {
  const provider = (process.env.IDENT_PROVIDER || "mock").toLowerCase();

  switch (provider) {
    case "plantnet":
      if (!process.env.PLANTNET_API_KEY) {
        throw new Error("PLANTNET_API_KEY ist nicht gesetzt");
      }
      return new PlantNetIdentificationProvider({
        apiKey: process.env.PLANTNET_API_KEY,
        topK: 5,
        lang: "de",
      });
    case "mock":
    default:
      return new MockIdentificationProvider();
  }
}
