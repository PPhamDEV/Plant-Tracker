import { getIdentificationProvider } from "@/lib/identification";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const provider = getIdentificationProvider();
    const results = await provider.identify(buffer);

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Identifizierung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
