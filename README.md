# Leselogbuch (Next.js + TypeScript)

Dieses Repo ist eine **minimal lauffähige** Struktur für deine Leselogbuch-App, damit du sie sauber auf GitHub hochladen kannst.

## Lokales Setup

```bash
npm install
npm run dev
```

Dann im Browser öffnen: http://localhost:3000

## Wichtige Ordner

- `src/app/` – Next.js App Router (Pages)
- `src/components/` – UI-Komponenten
- `src/lib/` – Types/Helper
- `src/ai/` – (optional) KI/Flow-Code

## Hinweise zu deinen Snippets

- Ich habe die **Backticks in URLs** korrigiert (die waren als Zeichen im String).
- Im `smart-book-entry` Flow habe ich die **doppelten Backticks** in Template-Strings korrigiert und `z` auf **zod** umgestellt.
- `src/ai/genkit.ts` ist aktuell nur ein **Stub**, damit der Build auch ohne Genkit/API-Key läuft. Du kannst ihn später durch echtes Genkit ersetzen.

## Online stellen (GitHub + Vercel)

Ausführliche Anleitung: **[DEPLOY.md](./DEPLOY.md)**

Kurzfassung:

1. Repo auf GitHub anlegen und Code pushen  
2. Auf [vercel.com](https://vercel.com) mit GitHub anmelden und das Repo importieren  
3. Fertig — Vercel deployt bei jedem `git push` automatisch  

**Hinweis:** GitHub Pages reicht für diese App **nicht** (API-Routen für die Buchsuche). Vercel Free Tier ist die passende Wahl.

