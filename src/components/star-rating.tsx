"use client";

import { Star } from "lucide-react";

export function StarRating({
  value = 0,
  onChange,
  size = 22
}: {
  value?: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Bewertung">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (value ?? 0);
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star} von 5 Sternen`}
            onClick={() => onChange(star)}
            className="p-0.5 rounded hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Star
              width={size}
              height={size}
              className={filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}
            />
          </button>
        );
      })}
    </div>
  );
}
