import { NextResponse } from "next/server";
import { getBookSuggestions } from "@/ai/flows/smart-book-entry";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { query?: string };
    const query = String(body?.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = await getBookSuggestions({ query });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}

