import { NextResponse } from "next/server";
import { smartBookEntry } from "@/ai/flows/smart-book-entry";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { query?: string };
    const query = String(body?.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "query fehlt" }, { status: 400 });
    }

    const result = await smartBookEntry({ query });
    return NextResponse.json(result);
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

