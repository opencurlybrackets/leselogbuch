"use client";

import type { Book } from "@/lib/types";

export function AiCoach({ readingHistory }: { readingHistory: Book[] }) {
  const count = readingHistory.length;
  const top = readingHistory.slice(0, 3).map((b) => b.title).join(", ");

  return (
    <section
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 14
      }}
    >
      <div style={{ fontWeight: 800 }}>AI Coach (Platzhalter)</div>
      <div style={{ marginTop: 8, opacity: 0.85, fontSize: 14 }}>
        Bücher in deiner Liste: <b>{count}</b>
      </div>
      {top ? (
        <div style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>Zuletzt: {top}</div>
      ) : (
        <div style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>Füge ein Buch hinzu, um Empfehlungen zu bekommen.</div>
      )}
      <div style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
        Hinweis: Hier kannst du später deinen Genkit/Firebase-Flow anbinden.
      </div>
    </section>
  );
}

