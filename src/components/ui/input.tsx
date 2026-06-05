"use client";

import type { ComponentProps } from "react";

export function Input(props: ComponentProps<"input">) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={[
        "w-full rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground",
        "px-4 py-2 outline-none focus:ring-2 focus:ring-ring",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
