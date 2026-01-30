import { getIdentificationProvider } from "@/lib/identification";
import { db } from "@/lib/db";
import { downloadObject } from "@/lib/s3";
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

/** GET with photoId query param: fetch image from S3 and identify */
export async function GET(request: NextRequest) {
  try {
    const photoId = request.nextUrl.searchParams.get("photoId");
    if (!photoId) {
      return NextResponse.json({ error: "photoId erforderlich" }, { status: 400 });
    }

    const photo = await db.plantPhoto.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json({ error: "Foto nicht gefunden" }, { status: 404 });
    }

    const buffer = await downloadObject(photo.objectKeyOriginal);
    const provider = getIdentificationProvider();
    const results = await provider.identify(buffer);

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Identifizierung fehlgeschlagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
