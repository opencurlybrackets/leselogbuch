# Supabase einrichten (Login + Cloud-Bibliothek)

## 1. Projekt anlegen

1. https://supabase.com → **Start your project** (GitHub-Login)
2. **New project** → Name z. B. `leselogbuch`, Region **Frankfurt** (EU)
3. Datenbank-Passwort sicher notieren → **Create**

## 2. Datenbank-Tabelle

1. Im Supabase-Dashboard: **SQL Editor** → **New query**
2. Inhalt aus `supabase/schema.sql` einfügen → **Run**

## 3. Auth (nur du)

1. **Authentication** → **Providers** → **Email** aktiv lassen
2. **Authentication** → **URL Configuration**:
   - **Site URL:** `https://leselogbuch.vercel.app` (oder deine Vercel-URL)
   - **Redirect URLs:**  
     `https://leselogbuch.vercel.app/auth/callback`  
     `http://localhost:3000/auth/callback`
3. **Einmalig Konto anlegen:** App öffnen → `/login` → „Noch kein Konto?“ → E-Mail + Passwort (min. 8 Zeichen)
4. **Optional – nur du als Nutzer:**  
   **Authentication** → **Providers** → Email → **Confirm email** nach Bedarf  
   Nach deiner Registrierung: **Authentication** → **Settings** → **Disable sign ups** (verhindert neue Konten)

## 4. API-Keys für die App

**Project Settings** → **API**:

| Variable | Wo kopieren |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` Key |

### Lokal (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

### Vercel

**Project** → **Settings** → **Environment Variables** → beide Variablen für **Production** (und Preview) setzen → **Redeploy**

## 5. Test

```bash
npm install
npm run dev
```

→ http://localhost:3000 → Weiterleitung zu `/login` → anmelden → Bücher hinzufügen → in Supabase **Table Editor** → `books` prüfen.

## Sicherheit

- **Row Level Security** ist aktiv: jeder Nutzer sieht nur eigene Zeilen (`user_id = auth.uid()`).
- Den `service_role` Key **nie** im Frontend verwenden — nur `anon` Key in der App.
