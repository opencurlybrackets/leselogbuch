"use client";

import type { Book } from "@/lib/types";

export function BookCard({ book, onClick }: { book: Book; onClick: (b: Book) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(book)}
      style={{
        textAlign: "left",
        background: "#111827",
        color: "#f3f4f6",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 12,
        cursor: "pointer"
      }}
    >
      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            width: 60,
            height: 84,
            borderRadius: 10,
            background: "#0b0b0f",
            border: "1px solid #1f2937",
            overflow: "hidden",
            flexShrink: 0
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {book.coverImageUrl ? (
            <img
              alt={`Cover ${book.title}`}
              src={book.coverImageUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{book.title}</div>
          <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>{book.author}</div>
          {book.genre ? <div style={{ opacity: 0.7, marginTop: 8, fontSize: 12 }}>{book.genre}</div> : null}
        </div>
      </div>
    </button>
  );
}

