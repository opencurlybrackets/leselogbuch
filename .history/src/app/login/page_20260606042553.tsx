"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Library, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        setMessage(
          "Konto erstellt. Falls E-Mail-Bestätigung aktiv ist, bitte Link in der Mail öffnen — sonst direkt anmelden."
        );
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const text =
        err instanceof Error ? err.message : "Anmeldung fehlgeschlagen.";
      setMessage(text);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Library className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">LeseLogbuch</h1>
            <p className="text-sm text-muted-foreground">
              Persönlicher Zugang
            </p>
          </div>
        </div>

        {authError ? (
          <p className="text-sm text-destructive mb-4">
            Anmeldung fehlgeschlagen. Bitte erneut versuchen.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground" htmlFor="email">
              E-Mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 bg-background"
              placeholder="deine@email.de"
            />
          </div>

          <div>
            <label
              className="text-sm text-muted-foreground"
              htmlFor="password"
            >
              Passwort
            </label>
            <Input
              id="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-11 bg-background"
              placeholder="mindestens 8 Zeichen"
            />
          </div>

          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}

          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Bitte warten…
              </>
            ) : mode === "signup" ? (
              "Konto einmalig anlegen"
            ) : (
              "Anmelden"
            )}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
        >
          {mode === "signin"
            ? "Noch kein Konto? Einmalig registrieren"
            : "Schon registriert? Zur Anmeldung"}
        </button>

        <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
          Nur für deinen persönlichen Zugang. Nach der Registrierung kannst du
          in Supabase weitere Anmeldungen deaktivieren (siehe SUPABASE.md).
        </p>
      </div>
    </div>
  );
}