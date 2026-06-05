/** Hilfen für deutsche Metadaten (Google Books, OpenLibrary, Übersetzungs-Fallback). */

const GERMAN_MARKERS = /[äöüßÄÖÜ]|\b(und|der|die|das|ein|eine|ist|sind|wird|nicht|auch|für|von|mit|auf|im|den|dem|des)\b/i;

export function isLikelyGerman(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (GERMAN_MARKERS.test(t)) return true;
  const latinOnly = /^[\x00-\x7F\s.,;:!?'"()-]+$/.test(t);
  return !latinOnly;
}

function scoreGoogleVolume(item: { volumeInfo?: Record<string, unknown> }): number {
  const info = item.volumeInfo ?? {};
  let score = 0;
  const lang = String(info.language ?? "").toLowerCase();
  if (lang === "de") score += 20;
  const title = String(info.title ?? "");
  if (/[äöüßÄÖÜ]/.test(title)) score += 5;
  const desc = String(info.description ?? "");
  if (isLikelyGerman(desc)) score += 4;
  const cat = String((info.categories as string[] | undefined)?.[0] ?? "");
  if (/deutsch|german|literatur|belletristik|roman|sachbuch/i.test(cat)) score += 2;
  return score;
}

export function pickBestGermanGoogleItem<T extends { volumeInfo?: Record<string, unknown> }>(
  items: T[] | undefined
): T | null {
  if (!items?.length) return null;
  return items.reduce((best, item) => (scoreGoogleVolume(item) > scoreGoogleVolume(best) ? item : best));
}

export function pickBestGermanOpenLibraryDoc(doc: Record<string, unknown> | undefined): boolean {
  if (!doc) return false;
  const langs = doc.language;
  if (Array.isArray(langs) && langs.some((l) => String(l).toLowerCase() === "de")) return true;
  const title = String(doc.title ?? "");
  return /[äöüßÄÖÜ]/.test(title);
}

export async function translateToGerman(text: string, maxLen = 450): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || isLikelyGerman(trimmed)) return trimmed;

  const chunk = trimmed.slice(0, maxLen);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|de`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return trimmed;
    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText?.trim();
    if (!translated || translated.toUpperCase() === chunk.toUpperCase()) return trimmed;
    return translated;
  } catch {
    return trimmed;
  }
}

export async function ensureGermanMetadata(fields: {
  title: string;
  author: string;
  genre: string;
  summary: string;
}): Promise<{ title: string; author: string; genre: string; summary: string }> {
  const [title, genre, summary] = await Promise.all([
    isLikelyGerman(fields.title) ? fields.title : translateToGerman(fields.title, 200),
    isLikelyGerman(fields.genre) ? fields.genre : translateToGerman(fields.genre, 80),
    isLikelyGerman(fields.summary) ? fields.summary : translateToGerman(fields.summary, 450)
  ]);

  return {
    title,
    author: fields.author,
    genre,
    summary
  };
}
