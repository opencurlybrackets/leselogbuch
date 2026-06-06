# Online stellen: GitHub + Vercel (kostenlos)

Diese App nutzt **Next.js API-Routen** (`/api/smart-book-entry`, `/api/book-suggestions`, …).  
**GitHub Pages** hostet nur statische Dateien — die intelligente Buchsuche würde dort **nicht** laufen.

**Empfehlung:** Code auf **GitHub**, Hosting auf **Vercel** (Free Tier, für Next.js gedacht).

## Was online funktioniert

| Feature | Online (Vercel) |
|--------|------------------|
| Bibliothek, Suche, Buch hinzufügen | Ja |
| Google Books / OpenLibrary | Ja |
| Buch-Details, localStorage | Ja (Daten bleiben im **Browser** des Nutzers) |
| Ollama (lokale KI) | Nein (läuft nur auf deinem PC) |

Ohne Ollama nutzt die App automatisch die Metadaten von Google Books/OpenLibrary.

---

## Schritt 1: Repository auf GitHub anlegen

1. Auf https://github.com/new einloggen  
2. Repository-Name z. B. `leselogbuch`  
3. **Public** (für kostenloses Vercel-Hobby reicht das)  
4. **Kein** README/License/.gitignore hinzufügen (liegt schon im Projekt)  
5. **Create repository**

## Schritt 2: Code hochladen (einmalig)

Im Projektordner in PowerShell oder Terminal:

```powershell
cd "C:\Users\Leo\AppData\Roaming\TRAE SOLO\ModularData\ai-agent\work-mode-projects\6a2210f9419bcb9c0e839f58\leselogbuch-repo"

git init
git add .
git commit -m "Initial commit: LeseLogbuch Next.js App"

git branch -M main
git remote add origin https://github.com/DEIN_GITHUB_USER/leselogbuch.git
git push -u origin main
```

`DEIN_GITHUB_USER` und den Repo-Namen durch deine Werte ersetzen.

Beim ersten `git push` meldest du dich bei GitHub an (Browser oder Token).

## Schritt 3: Vercel verbinden (kostenlos)

1. https://vercel.com → **Sign Up** mit **GitHub**  
2. **Add New… → Project**  
3. Repository `leselogbuch` importieren  
4. Framework: **Next.js** (wird erkannt)  
5. **Deploy** — keine Env-Variablen nötig für den Standardbetrieb  

Nach 1–2 Minuten erhältst du eine URL wie `https://leselogbuch-xyz.vercel.app`.

### Optional: eigene Domain

Vercel → Project → **Settings → Domains** (Free Tier: `*.vercel.app` reicht meist).

### Supabase (Login + Bücher in der Cloud)

Env-Variablen in Vercel setzen (siehe **[SUPABASE.md](./SUPABASE.md)**):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ohne diese Variablen funktioniert Login/Speichern nicht.

### Optional: Ollama in der Cloud

Ollama auf Vercel ist nicht möglich. Nur sinnvoll, wenn du später ein **eigenes** Ollama/API-Gateway hostest und in Vercel setzt:

- `OLLAMA_HOST` = URL deines Servers  
- `OLLAMA_MODEL` = z. B. `llama3.1`

---

## Updates veröffentlichen

```powershell
git add .
git commit -m "Beschreibung der Änderung"
git push
```

Vercel baut und deployt automatisch bei jedem Push auf `main`.

---

## Alternative (nur wenn du API-Routen opferst)

**GitHub Pages** + `output: 'export'` — dann **keine** Server-APIs, Buchsuche müsste komplett im Browser oder über externe Dienste laufen. Für diese App **nicht** empfohlen.
