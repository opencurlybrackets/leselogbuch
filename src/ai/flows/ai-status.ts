import { getOllamaConfig, isOllamaAvailable } from "@/ai/ollama";

export type AiStatus = {
  provider: "ollama" | "googlebooks";
  ollamaAvailable: boolean;
  ollamaModel: string;
};

export async function getAiStatus(): Promise<AiStatus> {
  const cfg = getOllamaConfig();
  const ok = await isOllamaAvailable();
  return {
    provider: ok ? "ollama" : "googlebooks",
    ollamaAvailable: ok,
    ollamaModel: cfg.model
  };
}
