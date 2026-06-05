"use client";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

/**
 * Minimaler Stub: verhindert Build-Fehler und erlaubt späteres Ersetzen durch shadcn/ui.
 */
export function useToast() {
  return {
    toast: (opts: ToastOptions) => {
      // Aktuell nur Konsole, damit die App ohne UI-Framework weiterläuft.
      // Du kannst das später durch echte Toast-UI ersetzen.
      // eslint-disable-next-line no-console
      console.log("[toast]", opts.variant ?? "default", opts.title ?? "", opts.description ?? "");
    }
  };
}

