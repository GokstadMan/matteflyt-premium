# Plan: MatteFlyt — Auth + Studentdashboard (demo)

Gjør MatteFlyt om til et ekte produkt: brukere kan registrere seg, logge inn, og se et personlig dashboard med fremgang (basert på seed-data).

## Hva som bygges

### 1. Lovable Cloud (backend)
- Aktivere Cloud (database, auth, server functions).
- `profiles`-tabell koblet til `auth.users` (id, full_name, created_at) + trigger som auto-oppretter profil ved signup.
- RLS: brukere kan kun lese/oppdatere egen profil.
- Sosial pålogging: Google aktiveres via Lovable-broker.

### 2. Auth-sider
- `/auth` — kombinert Logg inn / Registrer (e-post + passord, og "Fortsett med Google").
- Header på landingssiden får "Logg inn"-knapp; når innlogget vises "Dashboard" + avatar/utlogging.
- Glemt passord + `/reset-password`-side.

### 3. Beskyttede ruter
- `src/routes/_authenticated/route.tsx` (integration-managed gate, redirect til `/auth`).
- `_authenticated/dashboard.tsx` — studentdashboard.

### 4. Studentdashboard (demo med seed-data)
Designet i samme premium-stil som landingssiden (lysegrønn palett, glassmorphism, Framer Motion).

Innhold:
- **Velkomst-hero**: "Hei, {fornavn} 👋" + dagens streak.
- **Stats-kort** (4 stk): Mestrede emner, Løste oppgaver, Studietid denne uken, XP/nivå.
- **Fremgang per emne** (Algebra, Geometri, Brøk, Likninger, Funksjoner) med progress-bars.
- **Ukentlig aktivitet**: enkel bar-chart (Recharts).
- **Anbefalte neste leksjoner**: 3 kort.
- **Achievements/badges**: 4–6 utmerkelser.

All data er hardkodet seed-data per bruker (ingen ekte oppgaveløsing i denne versjonen — det er neste steg).

### 5. Landingsside-oppdatering
- CTA-knapper ("Start gratis", "Kom i gang") peker til `/auth`.
- Innlogget bruker sendes til `/dashboard` ved klikk på CTA.

## Tekniske detaljer

- `src/integrations/supabase/client.ts` for browser-auth.
- `onAuthStateChange` i `__root.tsx` for cache-invalidering.
- Profil-data hentet via `createServerFn` med `requireSupabaseAuth`.
- Seed-data lever som konstanter i `src/lib/dashboard-seed.ts` (kan byttes ut med ekte queries senere).
- Recharts legges til for grafer.

## Ikke inkludert i denne versjonen
- Faktiske matteoppgaver / quiz-motor.
- Lagring av reell fremgang.
- Lærer-/foreldredashboard.
- Betaling.

Disse kan bygges som neste iterasjon når demo-flyten er på plass.

## Estimat
Mellomstor build — én sammenhengende implementasjon. Bruker mellom ~25–40 credits avhengig av justeringer underveis. God utnyttelse av kredittene dine før de utløper.
