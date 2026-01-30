import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { createPresignedReadUrl } from "@/lib/s3";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const userId = await getCurrentUserId();
    const { id } = await params;
    const size = request.nextUrl.searchParams.get("size") || "thumb";

    const photo = await db.plantPhoto.findUnique({ where: { id } });
    if (!photo || photo.userId !== userId) {
      return NextResponse.json(
        { error: "Foto nicht gefunden" },
        { status: 404 }
      );
    }

    const key =
      size === "original" || !photo.objectKeyThumb
        ? photo.objectKeyOriginal
        : photo.objectKeyThumb;

    const url = await createPresignedReadUrl(key);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof Error && err.message === "Nicht authentifiziert") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "URL-Erzeugung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
