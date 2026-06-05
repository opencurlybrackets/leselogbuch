"use client";

import type { Book } from "@/lib/types";
import { Star } from "lucide-react";

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
          {(book.rating ?? 0) > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 2, marginTop: 8 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  style={{
                    fill: i < (book.rating ?? 0) ? "#fbbf24" : "transparent",
                    color: i < (book.rating ?? 0) ? "#fbbf24" : "#6b7280"
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

