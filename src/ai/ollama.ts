type OllamaGenerateResponse = {
  response?: string;
};

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";

export function getOllamaConfig() {
  return { host: OLLAMA_HOST, model: OLLAMA_MODEL };
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function refineWithOllama(input: {
  title: string;
  author: string;
  description?: string;
}): Promise<{ genre: string; summary: string } | null> {
  const available = await isOllamaAvailable();
  if (!available) return null;

  const prompt = [
    "Du bist ein Bibliothekar.",
    "Gib mir ein präzises deutsches Genre (1-3 Wörter) und eine packende Zusammenfassung in maximal 3 Sätzen.",
    "Antworte NUR als JSON im Format:",
    '{"genre":"...","summary":"..."}',
    "",
    `Titel: ${input.title}`,
    `Autor: ${input.author}`,
    input.description ? `Beschreibung: ${input.description}` : "Beschreibung: (keine)"
  ].join("\n");

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false
      })
    });
    if (!res.ok) return null;

    const data = (await res.json()) as OllamaGenerateResponse;
    const text = (data.response || "").trim();
    if (!text) return null;

    // Robust: JSON irgendwo in der Antwort finden
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    const jsonText = text.slice(start, end + 1);
    const parsed = JSON.parse(jsonText) as { genre?: string; summary?: string };
    if (!parsed.genre || !parsed.summary) return null;

    return {
      genre: String(parsed.genre).trim(),
      summary: String(parsed.summary).trim()
    };
  } catch {
    return null;
  }
}

