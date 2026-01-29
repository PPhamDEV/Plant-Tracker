export interface PlantIdentificationResult {
  name: string;
  species: string;
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

// Factory: swap provider via env variable
export function getIdentificationProvider(): PlantIdentificationProvider {
  const provider = process.env.IDENT_PROVIDER || "mock";

  switch (provider) {
    case "mock":
    default:
      return new MockIdentificationProvider();
    // case "plantnet":
    //   return new PlantNetProvider(process.env.PLANTNET_API_KEY!);
  }
}
