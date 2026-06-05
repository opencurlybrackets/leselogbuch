"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Search, Sparkles, Book as BookIcon } from "lucide-react";
import { Book } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AddBookDialogProps {
  onAdd: (book: Book) => void;
}

export function AddBookDialog({ onAdd }: AddBookDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; author: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [providerLabel, setProviderLabel] = useState<string>("Quelle: Google Books/OpenLibrary (Fallback)");
  const requestIdRef = useRef(0);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  async function postJson<T>(url: string, payload: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error || "Request fehlgeschlagen");
    }
    return json as T;
  }

  // Reset Zustand wenn der Dialog geschlossen wird
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Anzeige: welcher KI-/Datenmodus aktuell genutzt wird
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai-status");
        const status = (await res.json()) as { ollamaAvailable?: boolean; ollamaModel?: string };
        if (cancelled) return;
        if (status.ollamaAvailable) {
          setProviderLabel(`KI: Ollama (${status.ollamaModel})`);
        } else {
          setProviderLabel("Quelle: Google Books/OpenLibrary (Fallback)");
        }
      } catch {
        if (!cancelled) setProviderLabel("Quelle: Google Books/OpenLibrary (Fallback)");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Schließen der Vorschläge bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  // Automatische Vorschläge beim Tippen (mit Debounce und Race-Condition Schutz)
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length <= 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const currentId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const result = await postJson<{ suggestions: { title: string; author: string }[] }>("/api/book-suggestions", {
          query: trimmedQuery
        });

        // Nur verarbeiten, wenn dies die aktuellste Anfrage war
        if (currentId === requestIdRef.current) {
          if (result && result.suggestions) {
            setSuggestions(result.suggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
          }
        }
      } catch (error: unknown) {
        if (currentId === requestIdRef.current) {
          // eslint-disable-next-line no-console
          console.error("Vorschlagsfehler:", error);
          setSuggestions([]);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (manualQuery?: string) => {
    if (isLoading) return;

    const finalQuery = (manualQuery || query).trim();
    if (!finalQuery) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const result = await postJson<{
        title: string;
        author: string;
        genre: string;
        summary: string;
        coverImageUrl: string;
        sourceUsed: "googlebooks" | "openlibrary";
        aiUsed: "ollama" | "none";
      }>("/api/smart-book-entry", { query: finalQuery });

      const newBook: Book = {
        id: crypto.randomUUID(),
        title: result.title,
        author: result.author,
        genre: result.genre,
        summary: result.summary,
        coverImageUrl: result.coverImageUrl,
        dateAdded: new Date().toISOString()
      };

      onAdd(newBook);
      setIsOpen(false);
      toast({
        title: "Buch hinzugefügt!",
        description: `${result.title} wurde erfolgreich erfasst. (Quelle: ${result.sourceUsed}${result.aiUsed === "ollama" ? ", KI: Ollama" : ""})`
      });
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error("Fehler bei Bucherfassung:", error);
      const message = error instanceof Error ? error.message : "Das Buch konnte nicht automatisch gefunden werden.";
      toast({
        variant: "destructive",
        title: "Suche fehlgeschlagen",
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (title: string, author: string) => {
    const fullQuery = `${title} ${author}`;
    setQuery(fullQuery);
    setShowSuggestions(false);
    handleSearch(fullQuery);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Buch hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Intelligente Buchsuche
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4 relative">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-body">
              Suche nach Titel oder Autor. Wir finden automatisch alle Details und das passende Cover.
            </p>
            <p className="text-xs text-muted-foreground">{providerLabel}</p>
            <div className="relative" ref={suggestionsRef}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Z.B. Der Medicus oder Noah Gordon..."
                  className="pl-10 h-12 bg-background border-border focus:ring-primary"
                  disabled={isLoading}
                  onFocus={() => query.trim().length > 2 && setShowSuggestions(true)}
                />
              </form>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2 max-h-[250px] overflow-y-auto">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1 mb-1">
                      Empfohlene Treffer
                    </p>
                    {suggestions.map((s) => (
                      <button
                        key={`${s.title}-${s.author}`}
                        type="button"
                        onClick={() => handleSuggestionClick(s.title, s.author)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-primary/10 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 flex-shrink-0 bg-muted rounded flex items-center justify-center">
                          <BookIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                            {s.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{s.author}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={() => handleSearch()}
            className="w-full h-12 bg-primary hover:bg-primary/90 font-bold"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buch wird gesucht...
              </>
            ) : (
              "Buch jetzt erfassen"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
