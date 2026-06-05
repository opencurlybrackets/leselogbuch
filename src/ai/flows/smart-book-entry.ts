/**
 * @fileOverview Ein Genkit-Flow zum intelligenten Erfassen neuer Bücher.
 * Nutzt primär die Google Books API für verifizierte Fakten und Covers.
 * Genkit wird als "Veredler" genutzt, die App bleibt aber auch ohne KI-Key (eingeschränkt) funktionsfähig.
 */

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { refineWithOllama } from "@/ai/ollama";
import {
  ensureGermanMetadata,
  pickBestGermanGoogleItem,
  pickBestGermanOpenLibraryDoc
} from "@/lib/book-locale";

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Hilfsfunktion zum Abrufen von Daten von der Google Books API.
 */
async function fetchFromGoogleBooks(
  query: string,
  germanPreferred = false
): Promise<{ data: any | null; status: number }> {
  const lang = germanPreferred ? "&langRestrict=de" : "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8${lang}`;
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

/** Zuerst deutsche Treffer, bei Bedarf ohne Sprachfilter (mehr Treffer). */
async function fetchGoogleWithFallback(query: string) {
  const de = await fetchFromGoogleBooks(query, true);
  if (de.data?.items?.length) return de;
  return fetchFromGoogleBooks(query, false);
}

/**
 * OpenLibrary Fallback (kostenlos, ohne API-Key).
 */
async function fetchFromOpenLibrary(query: string, germanPreferred = false) {
  const lang = germanPreferred ? "&language=de" : "";
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8${lang}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("[OpenLibrary] Netzwerkfehler:", error);
    return null;
  }
}

async function fetchOpenLibraryWithFallback(query: string) {
  const de = await fetchFromOpenLibrary(query, true);
  if (de?.docs?.length) return de;
  return fetchFromOpenLibrary(query, false);
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

async function finalizeBookFields(fields: {
  title: string;
  author: string;
  genre: string;
  summary: string;
  coverImageUrl: string;
  sourceUsed: "googlebooks" | "openlibrary";
  aiUsed: "ollama" | "none";
}): Promise<SmartBookEntryOutput> {
  try {
    const german = await ensureGermanMetadata({
      title: fields.title,
      author: fields.author,
      genre: fields.genre,
      summary: fields.summary
    });
    return { ...fields, ...german };
  } catch {
    return fields;
  }
}

export async function smartBookEntry(input: SmartBookEntryInput): Promise<SmartBookEntryOutput> {
  const googleRes = await fetchGoogleWithFallback(input.query);
  let googleData = googleRes.data;
  let item = pickBestGermanGoogleItem(googleData?.items) ?? googleData?.items?.[0];
  let sourceUsed: "googlebooks" | "openlibrary" = "googlebooks";

  // Fallback: KI-Korrektur nur wenn Google nichts findet
  if (!item) {
    try {
      const correction = await queryCorrectionPrompt({ query: input.query });
      const corrected = (correction.output as any)?.correctedQuery as string | undefined;
      if (corrected && corrected.toLowerCase() !== input.query.toLowerCase()) {
        const correctedRes = await fetchGoogleWithFallback(corrected);
        googleData = correctedRes.data;
        item = pickBestGermanGoogleItem(googleData?.items) ?? googleData?.items?.[0];
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
    const ol = await fetchOpenLibraryWithFallback(input.query);
    const doc =
      ol?.docs?.find((d: Record<string, unknown>) => pickBestGermanOpenLibraryDoc(d)) ?? ol?.docs?.[0];
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

    return finalizeBookFields({
      title,
      author,
      genre,
      summary,
      coverImageUrl: coverUrl,
      sourceUsed,
      aiUsed
    });
  }

  const info = item.volumeInfo;
  const title = info.title;
  const author = info.authors?.join(", ") || "Unbekannter Autor";
  const isbn = info.industryIdentifiers?.find((id: any) => String(id.type).includes("ISBN_13"))?.identifier;

  let genre = info.categories?.[0] || "Roman";
  const rawDesc = info.description ? stripHtml(String(info.description)) : "";
  let summary = rawDesc ? `${rawDesc.substring(0, 300)}...` : "Keine Beschreibung verfügbar.";
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

  return finalizeBookFields({
    title,
    author,
    genre,
    summary,
    coverImageUrl: coverUrl,
    sourceUsed,
    aiUsed
  });
}

export async function getBookSuggestions(input: SmartBookEntryInput): Promise<BookSuggestionsOutput> {
  const googleRes = await fetchGoogleWithFallback(input.query);
  const googleData = googleRes.data;
  if (googleData?.items?.length) {
    const suggestions = [...googleData.items]
      .sort(
        (a: { volumeInfo?: Record<string, unknown> }, b: { volumeInfo?: Record<string, unknown> }) =>
          (b.volumeInfo?.language === "de" ? 1 : 0) - (a.volumeInfo?.language === "de" ? 1 : 0)
      )
      .map((item: any) => ({
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.join(", ") || "Unbekannter Autor"
      }))
      .slice(0, 5);

    return { suggestions };
  }

  // Fallback: OpenLibrary (z. B. wenn Google 429 liefert)
  const ol = await fetchOpenLibraryWithFallback(input.query);
  if (!ol?.docs?.length) return { suggestions: [] };

  const suggestions = [...ol.docs]
    .sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (pickBestGermanOpenLibraryDoc(b) ? 1 : 0) - (pickBestGermanOpenLibraryDoc(a) ? 1 : 0)
    )
    .map((doc: any) => ({
      title: String(doc.title ?? ""),
      author: Array.isArray(doc.author_name) ? doc.author_name.join(", ") : "Unbekannter Autor"
    }))
    .filter((s: any) => s.title)
    .slice(0, 5);

  return { suggestions };
}
