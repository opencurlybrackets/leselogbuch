"use client";

import { useCallback, useEffect, useState } from "react";
import { Book } from "@/lib/types";
import { BookCard } from "@/components/book-card";
import { BookDetails } from "@/components/book-details";
import { AddBookDialog } from "@/components/add-book-dialog";
import { AiCoach } from "@/components/ai-coach";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Library, BookOpenCheck, LogOut, Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { deleteBook, fetchBooks, insertBook, updateBook } from "@/lib/books-db";

export default function LeseLogbuchPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [aiLabel, setAiLabel] = useState<string>("Quelle: Google Books/OpenLibrary (Fallback)");

  const loadBooks = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserEmail(user.email ?? null);
    const list = await fetchBooks(supabase);
    setBooks(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadBooks();
      } catch (e) {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Bibliothek konnte nicht geladen werden",
            description: e instanceof Error ? e.message : "Unbekannter Fehler"
          });
        }
      } finally {
        if (!cancelled) setIsLoadingBooks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBooks, toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai-status");
        const status = (await res.json()) as { ollamaAvailable?: boolean; ollamaModel?: string };
        if (cancelled) return;
        setAiLabel(
          status.ollamaAvailable ? `KI: Ollama (${status.ollamaModel})` : "Quelle: Google Books/OpenLibrary (Fallback)"
        );
      } catch {
        if (!cancelled) setAiLabel("Quelle: Google Books/OpenLibrary (Fallback)");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAddBook(book: Book) {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Nicht angemeldet");

    const saved = await insertBook(supabase, book, user.id);
    setBooks((prev) => [saved, ...prev]);
  }

  async function handleUpdateBook(id: string, updates: Partial<Book>) {
    const supabase = createClient();
    await updateBook(supabase, id, updates);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    setSelectedBook((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
  }

  async function handleDeleteBook(id: string) {
    const supabase = createClient();
    await deleteBook(supabase, id);
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setSelectedBook((prev) => (prev?.id === id ? null : prev));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Library className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-headline font-bold hidden sm:block tracking-tight">
              LeseLogbuch <span className="text-primary">Dark</span>
            </h1>
            <span className="hidden lg:inline-flex text-xs text-muted-foreground border border-border rounded-full px-2 py-1 bg-card/60 truncate max-w-[200px]">
              {userEmail ?? aiLabel}
            </span>
          </div>

          <div className="flex-1 max-w-xl relative">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Bibliothek durchsuchen..."
                className="w-full bg-card border-border pl-10 focus:ring-primary h-10 rounded-full"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <AddBookDialog
              onAdd={async (b) => {
                try {
                  await handleAddBook(b);
                } catch (e) {
                  toast({
                    variant: "destructive",
                    title: "Speichern fehlgeschlagen",
                    description: e instanceof Error ? e.message : "Unbekannter Fehler"
                  });
                  throw e;
                }
              }}
            />
            <Button
              type="button"
              onClick={handleSignOut}
              className="hidden sm:inline-flex border-border px-3 py-2"
              title="Abmelden"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            <BookOpenCheck className="w-8 h-8 text-primary" /> Meine Bibliothek
          </h2>

          {isLoadingBooks ? (
            <div className="flex items-center gap-2 text-muted-foreground py-12">
              <Loader2 className="w-5 h-5 animate-spin" />
              Bibliothek wird geladen…
            </div>
          ) : filteredBooks.length === 0 ? (
            <p className="text-muted-foreground py-8">
              {books.length === 0
                ? "Noch keine Bücher. Klicke auf „Buch hinzufügen“, um zu starten."
                : "Keine Treffer für deine Suche."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={(b) => {
                    setSelectedBook(b);
                    setIsDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="lg:w-[350px] shrink-0">
          <AiCoach readingHistory={books} />
        </aside>
      </main>

      <BookDetails
        book={selectedBook}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={async (id, up) => {
          try {
            await handleUpdateBook(id, up);
          } catch (e) {
            toast({
              variant: "destructive",
              title: "Aktualisieren fehlgeschlagen",
              description: e instanceof Error ? e.message : "Unbekannter Fehler"
            });
          }
        }}
        onDelete={async (id) => {
          try {
            await handleDeleteBook(id);
          } catch (e) {
            toast({
              variant: "destructive",
              title: "Löschen fehlgeschlagen",
              description: e instanceof Error ? e.message : "Unbekannter Fehler"
            });
          }
        }}
      />
      <Toaster />
    </div>
  );
}
