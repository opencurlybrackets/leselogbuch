/**
 * @fileOverview Ein Genkit-Flow zum intelligenten Erfassen neuer Bücher.
 * Nutzt primär die Google Books API für verifizierte Fakten und Covers.
 * Genkit wird als "Veredler" genutzt, die App bleibt aber auch ohne KI-Key (eingeschränkt) funktionsfähig.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { refineWithOllama } from "@/ai/ollama";

const SmartBookEntryInputSchema = z.object({
  query: z.string().trim().min(1).describe("Der Buchtitel oder Autor.")
});
export type SmartBookEntryInput = z.infer<typeof SmartBookEntryInputSchema>;

const SmartBookEntryOutputSchema = z.object({
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  summary: z.string(),
  coverImageUrl: z.string(),
  sourceUsed: z.enum(["googlebooks", "openlibrary"]),
  aiUsed: z.enum(["ollama", "none"])
});
export type SmartBookEntryOutput = z.infer<typeof SmartBookEntryOutputSchema>;

const BookSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      author: z.string()
    })
  )
});
export type BookSuggestionsOutput = z.infer<typeof BookSuggestionsOutputSchema>;

/**
 * Hilfsfunktion zum Abrufen von Daten von der Google Books API.
 */
async function fetchFromGoogleBooks(query: string): Promise<{ data: any | null; status: number }> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { data: null, status: response.status };
    }
    return { data: await response.json(), status: response.status };
  } catch (error) {
    console.error("[Google Books] Netzwerkfehler:", error);
    return { data: null, status: 0 };
  }
}

/**
 * OpenLibrary Fallback (kostenlos, ohne API-Key).
 */
async function fetchFromOpenLibrary(query: string) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("[OpenLibrary] Netzwerkfehler:", error);
    return null;
  }
}

async function fetchOpenLibraryWorkDescription(workKey: string): Promise<string | null> {
  const url = `https://openlibrary.org${workKey}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = await response.json();
    const desc = json?.description;
    if (typeof desc === "string") return desc;
    if (desc && typeof desc.value === "string") return desc.value;
    return null;
  } catch {
    return null;
  }
}

/**
 * KI-Prompt zur Korrektur von Tippfehlern.
 */
const queryCorrectionPrompt = ai.definePrompt({
  name: "queryCorrectionPrompt",
  input: { schema: z.object({ query: z.string() }) },
  output: { schema: z.object({ correctedQuery: z.string() }) },
  prompt: `Du bist ein Bibliothekar. Der Benutzer sucht nach einem Buch: "{{{query}}}".
Nenne nur den korrekten Buchtitel/Autor ohne Kommentar. Falls korrekt, wiederhole ihn.`
});

/**
 * KI-Prompt zur Veredelung der Buchmetadaten.
 */
const refinementPrompt = ai.definePrompt({
  name: "refinementPrompt",
  input: {
    schema: z.object({
      title: z.string(),
      author: z.string(),
      description: z.string().optional()
    })
  },
  output: {
    schema: z.object({
      genre: z.string(),
      summary: z.string()
    })
  },
  prompt: `Analysiere dieses Buch: Titel: {{{title}}}, Autor: {{{author}}}, Beschreibung: {{{description}}}.
Liefere ein präzises deutsches Genre und eine packende Zusammenfassung (max. 3 Sätze).`
});

export async function smartBookEntry(input: SmartBookEntryInput): Promise<SmartBookEntryOutput> {
  const googleRes = await fetchFromGoogleBooks(input.query);
  let googleData = googleRes.data;
  let item = googleData?.items?.[0];
  let sourceUsed: "googlebooks" | "openlibrary" = "googlebooks";

  // Fallback: KI-Korrektur nur wenn Google nichts findet
  if (!item) {
    try {
      const correction = await queryCorrectionPrompt({ query: input.query });
      const corrected = (correction.output as any)?.correctedQuery as string | undefined;
      if (corrected && corrected.toLowerCase() !== input.query.toLowerCase()) {
        const correctedRes = await fetchFromGoogleBooks(corrected);
        googleData = correctedRes.data;
        item = googleData?.items?.[0];
      }
    } catch {
      console.warn("[Flow] KI-Korrektur übersprungen (evtl. fehlender API Key)");
    }
  }

  // Fallback: OpenLibrary wenn Google keine Ergebnisse liefert oder Quota erreicht ist (z. B. 429)
  if (!item) {
    if (googleRes.status === 429) {
      console.warn("[Google Books] Quota erreicht (429). Weiche auf OpenLibrary aus.");
    }
    const ol = await fetchFromOpenLibrary(input.query);
    const doc = ol?.docs?.[0];
    if (!doc) {
      throw new Error(`Buch "${input.query}" nicht gefunden. Bitte prüfe die Schreibweise.`);
    }

    sourceUsed = "openlibrary";

    const title = String(doc.title ?? input.query);
    const author = Array.isArray(doc.author_name) ? doc.author_name.join(", ") : "Unbekannter Autor";
    const isbn = Array.isArray(doc.isbn) ? doc.isbn[0] : undefined;

    let genre = Array.isArray(doc.subject) ? String(doc.subject[0]) : "Roman";
    let summary = "Keine Beschreibung verfügbar.";
    if (doc.key) {
      const desc = await fetchOpenLibraryWorkDescription(String(doc.key));
      if (desc) summary = `${desc.substring(0, 300)}...`;
    }

    let coverUrl: string | undefined;
    if (doc.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
    } else if (isbn) {
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    } else {
      coverUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
    }

    // Optional: Veredelung über Ollama
    let aiUsed: "ollama" | "none" = "none";
    const refined = await refineWithOllama({ title, author, description: summary });
    if (refined?.genre && refined?.summary) {
      genre = refined.genre;
      summary = refined.summary;
      aiUsed = "ollama";
    }

    return { title, author, genre, summary, coverImageUrl: coverUrl, sourceUsed, aiUsed };
  }

  const info = item.volumeInfo;
  const title = info.title;
  const author = info.authors?.join(", ") || "Unbekannter Autor";
  const isbn = info.industryIdentifiers?.find((id: any) => String(id.type).includes("ISBN_13"))?.identifier;

  let genre = info.categories?.[0] || "Roman";
  let summary = info.description ? `${String(info.description).substring(0, 300)}...` : "Keine Beschreibung verfügbar.";
  let aiUsed: "ollama" | "none" = "none";

  // Veredelung: zuerst Ollama (lokal), sonst Genkit-Stub (falls später ersetzt)
  const refined = await refineWithOllama({ title, author, description: info.description });
  if (refined?.genre && refined?.summary) {
    genre = refined.genre;
    summary = refined.summary;
    aiUsed = "ollama";
  } else {
    // Fallback: Genkit (aktuell Stub, daher meist ohne Effekt)
    try {
      const { output } = await refinementPrompt({ title, author, description: info.description });
      const out = output as any;
      if (out?.genre && out?.summary) {
        genre = out.genre;
        summary = out.summary;
      }
    } catch {
      console.warn("[Flow] KI-Veredelung übersprungen.");
    }
  }

  // Cover-Suche: Google -> OpenLibrary -> Placeholder
  let coverUrl =
    info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.thumbnail;

  if (!coverUrl && isbn) {
    coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  // HTTPS Fix
  if (coverUrl) {
    coverUrl = String(coverUrl).replace("http://", "https://");
  } else {
    coverUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/400/600`;
  }

  return { title, author, genre, summary, coverImageUrl: coverUrl, sourceUsed, aiUsed };
}

export async function getBookSuggestions(input: SmartBookEntryInput): Promise<BookSuggestionsOutput> {
  const googleRes = await fetchFromGoogleBooks(input.query);
  const googleData = googleRes.data;
  if (googleData?.items?.length) {
    const suggestions = googleData.items
      .map((item: any) => ({
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.join(", ") || "Unbekannter Autor"
      }))
      .slice(0, 5);

    return { suggestions };
  }

  // Fallback: OpenLibrary (z. B. wenn Google 429 liefert)
  const ol = await fetchFromOpenLibrary(input.query);
  if (!ol?.docs?.length) return { suggestions: [] };

  const suggestions = ol.docs
    .map((doc: any) => ({
      title: String(doc.title ?? ""),
      author: Array.isArray(doc.author_name) ? doc.author_name.join(", ") : "Unbekannter Autor"
    }))
    .filter((s: any) => s.title)
    .slice(0, 5);

  return { suggestions };
}
