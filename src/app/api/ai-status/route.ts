import { NextResponse } from "next/server";
import { getOllamaConfig, isOllamaAvailable } from "@/ai/ollama";

export async function GET() {
  const cfg = getOllamaConfig();
  const ok = await isOllamaAvailable();
  return NextResponse.json({
    provider: ok ? "ollama" : "googlebooks",
    ollamaAvailable: ok,
    ollamaModel: cfg.model
  });
}

