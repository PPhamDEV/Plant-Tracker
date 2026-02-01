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
 * iNaturalist computer vision (no API key required).
 *
 * Endpoint: https://api.inaturalist.org/v1/computervision/score_image
 * Docs-ish: https://api.inaturalist.org/v1/docs/#!/Computervision/get_computervision_score_image
 */
export class INaturalistIdentificationProvider
  implements PlantIdentificationProvider
{
  constructor(
    private options: {
      /** Limit of results returned to the UI. */
      topK?: number;
      /** Filter to plants (Plantae) when possible. */
      preferPlantae?: boolean;
    } = {}
  ) {}

  async identify(imageBuffer: Buffer): Promise<PlantIdentificationResult[]> {
    const topK = this.options.topK ?? 5;

    // Next/Node provides fetch + FormData in the runtime.
    const form = new FormData();
    // iNat doesn't care much about filename; mime detection is optional.
    form.append(
      "image",
      new Blob([new Uint8Array(imageBuffer)], { type: "image/jpeg" }),
      "plant.jpg"
    );

    const url = new URL("https://api.inaturalist.org/v1/computervision/score_image");
    // Ask for more and filter client-side.
    url.searchParams.set("top_k", String(Math.max(topK, 10)));

    const res = await fetch(url, {
      method: "POST",
      body: form,
      // iNat sometimes blocks requests without UA.
      headers: { "user-agent": "plant-tracker/1.0 (OpenClaw)" },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`iNaturalist error (${res.status}): ${text || res.statusText}`);
    }

    const data = (await res.json()) as {
      results?: Array<{
        score: number;
        taxon?: {
          name: string;
          preferred_common_name?: string;
          iconic_taxon_name?: string;
          rank?: string;
        };
      }>;
    };

    const raw = Array.isArray(data.results) ? data.results : [];

    const mapped = raw
      .map((r) => {
        const taxon = r.taxon;
        if (!taxon?.name) return null;

        const scientific = taxon.name;
        const common = taxon.preferred_common_name;

        return {
          name: common || scientific,
          species: scientific,
          confidence: clamp01(r.score),
          iconic: taxon.iconic_taxon_name,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const filtered = this.options.preferPlantae
      ? mapped.filter((x) => x.iconic === "Plantae")
      : mapped;

    return filtered.slice(0, topK).map(({ iconic: _iconic, ...rest }) => rest);
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
    case "inaturalist":
    case "inat":
      return new INaturalistIdentificationProvider({ topK: 5, preferPlantae: true });
    case "mock":
    default:
      return new MockIdentificationProvider();
    // case "plantnet":
    //   return new PlantNetProvider(process.env.PLANTNET_API_KEY!);
  }
}
