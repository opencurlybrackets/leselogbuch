"use client";

import React, { createContext, isValidElement, useContext } from "react";

type DialogCtx = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DialogContext = createContext<DialogCtx | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("DialogTrigger must be used within <Dialog />");

  const onClick = () => ctx.onOpenChange(true);

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onClick: (...args: any[]) => {
        child.props?.onClick?.(...args);
        onClick();
      }
    });
  }

  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("DialogContent must be used within <Dialog />");
  if (!ctx.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={() => ctx.onOpenChange(false)}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className={["relative w-full rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl", className]
          .filter(Boolean)
          .join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={["text-lg font-bold", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

