"use client";

import type { Book } from "@/lib/types";

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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "#0f172a",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 16,
          color: "#f3f4f6"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{book.title}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>{book.author}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", color: "#f3f4f6", border: "none" }}>
            Schließen
          </button>
        </div>

        {book.summary ? <p style={{ marginTop: 12, opacity: 0.9 }}>{book.summary}</p> : null}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button
            onClick={() => onUpdate(book.id, { rating: Math.min(5, (book.rating ?? 0) + 1) })}
            style={{
              background: "#334155",
              border: "1px solid #475569",
              color: "#f3f4f6",
              padding: "8px 10px",
              borderRadius: 10,
              cursor: "pointer"
            }}
          >
            Rating +1
          </button>
          <button
            onClick={() => onDelete(book.id)}
            style={{
              background: "#7f1d1d",
              border: "1px solid #991b1b",
              color: "#f3f4f6",
              padding: "8px 10px",
              borderRadius: 10,
              cursor: "pointer"
            }}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

