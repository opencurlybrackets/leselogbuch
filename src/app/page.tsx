"use client";

import { useEffect, useState } from "react";
import { Book } from "@/lib/types";
import { BookCard } from "@/components/book-card";
import { BookDetails } from "@/components/book-details";
import { AddBookDialog } from "@/components/add-book-dialog";
import { AiCoach } from "@/components/ai-coach";
import { Input } from "@/components/ui/input";
import { Search, Library, BookOpenCheck } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

export default function LeseLogbuchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [aiLabel, setAiLabel] = useState<string>("Quelle: Google Books/OpenLibrary (Fallback)");

  useEffect(() => {
    const saved = localStorage.getItem("leselogbuch_books");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBooks(parsed.length > 0 ? parsed : getInitialBooks());
      } catch (e) {
        setBooks(getInitialBooks());
      }
    } else {
      setBooks(getInitialBooks());
    }
  }, []);

  // Anzeige im Header: ob Ollama genutzt werden kann
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai-status");
        const status = (await res.json()) as { ollamaAvailable?: boolean; ollamaModel?: string };
        if (cancelled) return;
        setAiLabel(status.ollamaAvailable ? `KI: Ollama (${status.ollamaModel})` : "Quelle: Google Books/OpenLibrary (Fallback)");
      } catch {
        if (!cancelled) setAiLabel("Quelle: Google Books/OpenLibrary (Fallback)");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem("leselogbuch_books", JSON.stringify(books));
    }
  }, [books]);

  function getInitialBooks(): Book[] {
    return [
      {
        id: "medicus-1",
        title: "Der Medicus",
        author: "Noah Gordon",
        genre: "Historischer Roman",
        summary:
          "Im 11. Jahrhundert reist der junge Engländer Rob Cole nach Persien, um beim legendären Arzt Avicenna die Kunst des Heilens zu erlernen. Eine monumentale Saga über Wissen, Glauben und Abenteuer.",
        coverImageUrl:
          "https://books.google.com/books/content?id=p7j9AgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
        review: "Ein zeitloser Klassiker, den man gelesen haben muss.",
        dateAdded: new Date().toISOString(),
        rating: 5
      },
      {
        id: "bibel-1",
        title: "Die Bibel",
        author: "Diverse Autoren",
        genre: "Religiöse Literatur",
        summary:
          "Die Heilige Schrift, bestehend aus Altem und Neuem Testament. Ein Fundament der Weltliteratur und westlichen Kultur.",
        coverImageUrl:
          "https://books.google.com/books/content?id=GzIuAAAAYAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
        review: "Ein kulturelles Muss.",
        dateAdded: new Date().toISOString(),
        rating: 4
      }
    ];
  }

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
      ? true
      : false
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Library className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-headline font-bold hidden sm:block tracking-tight">
              LeseLogbuch <span className="text-primary">Dark</span>
            </h1>
            <span className="hidden md:inline-flex text-xs text-muted-foreground border border-border rounded-full px-2 py-1 bg-card/60">
              {aiLabel}
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

          <div className="flex items-center gap-4">
            <AddBookDialog onAdd={(b) => setBooks((prev) => [b, ...prev])} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <h2 className="text-3xl font-headline font-bold flex items-center gap-3">
            <BookOpenCheck className="w-8 h-8 text-primary" /> Meine Bibliothek
          </h2>

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
        </div>

        <aside className="lg:w-[350px] shrink-0">
          <AiCoach readingHistory={books} />
        </aside>
      </main>

      <BookDetails
        book={selectedBook}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={(id, up) => {
          setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...up } : b)));
          setSelectedBook((prev) => (prev?.id === id ? { ...prev, ...up } : prev));
        }}
        onDelete={(id) => setBooks((prev) => prev.filter((b) => b.id !== id))}
      />
      <Toaster />
    </div>
  );
}
