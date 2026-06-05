"use client";

import type { Book } from "@/lib/types";
import { StarRating } from "@/components/star-rating";

export function BookDetails({
  book,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, up: Partial<Book>) => void;
  onDelete: (id: string) => void;
}) {
  if (!isOpen || !book) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight">{book.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
            {book.genre ? <p className="text-xs text-muted-foreground mt-2">{book.genre}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            Schließen
          </button>
        </div>

        {book.summary ? <p className="mt-4 text-sm leading-relaxed opacity-90">{book.summary}</p> : null}

        <div className="mt-5 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bewertung</p>
          <StarRating
            value={book.rating ?? 0}
            onChange={(rating) => onUpdate(book.id, { rating })}
          />
          {(book.rating ?? 0) > 0 ? (
            <p className="text-xs text-muted-foreground">{book.rating} von 5 Sternen</p>
          ) : (
            <p className="text-xs text-muted-foreground">Stern antippen zum Bewerten</p>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              if (confirm(`„${book.title}" wirklich löschen?`)) {
                onDelete(book.id);
                onClose();
              }
            }}
            className="text-sm px-3 py-2 rounded-lg bg-destructive/20 text-destructive border border-destructive/40 hover:bg-destructive/30"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}
