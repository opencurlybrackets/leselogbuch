"use client";

import type { ComponentProps } from "react";

export function Button(props: ComponentProps<"button">) {
  const { className, type, ...rest } = props;
  return (
    <button
      type={type ?? "button"}
      {...rest}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl",
        "px-4 py-2 font-bold",
        "border border-border bg-secondary text-secondary-foreground",
        "hover:opacity-95 transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

