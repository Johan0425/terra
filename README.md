# Terra

A 3D digital twin of your fitness progress. Your avatar's posture, aura, and
mood shift with your real sleep, activity, and training consistency — synced
from Google Fit or logged manually.

## Status: Phase 1 of 5

| Phase | Scope | Status |
|---|---|---|
| 1 | Next.js + Tailwind + Auth.js (Google login) + DB schema + shared types | ✅ done |
| 2 | 3D scene: GLB avatar, OrbitControls, three-point lighting | ⬜ next |
| 3 | Animation State Machine (idle / energized / fatigued / leveling-up) | ⬜ |
| 4 | `avatarEngine.ts` + Google Fit sync + dashboard HUD + history timeline | ⬜ |
| 5 | Public landing page + milestones/share cards + demo seed data | ⬜ |

Everything currently in the repo is real, wired-up code — nothing is a mock.
Lines marked `// TODO: Johan` are copy/branding placeholders or logic that a
later phase fills in; they're not stubbed functionality.

## Stack

- Next.js 16 (App Router, TypeScript)
- Auth.js v5 (`next-auth@beta`) with the Google provider, `@auth/drizzle-adapter`
- Drizzle ORM + Postgres (Neon, via Vercel Storage)
- Tailwind CSS 4
- (Phase 2+) React Three Fiber, Drei, Framer Motion, Recharts

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run db:push               # creates tables from lib/db/schema.ts
npm run dev
```

### 1. Postgres

Easiest path: provision it on Vercel (Storage tab) even for local dev, then
run `vercel env pull .env.local` to get `POSTGRES_URL` automatically. See
"Deploying to Vercel" below.

Alternative: any Neon project's connection string works — paste it into
`POSTGRES_URL` in `.env.local`.

### 2. Google OAuth (required even for basic login)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create
   a project (or reuse one) → **APIs & Services → Credentials**.
2. **APIs & Services → OAuth consent screen**: set it to "External", add your
   app name, support email, and (while testing) add your own Google account
   under "Test users".
3. **Credentials → Create Credentials → OAuth client ID** → Application type
   "Web application".
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (local)
     - `https://<your-vercel-domain>/api/auth/callback/google` (production —
       add this once you have the Vercel URL)
4. Copy the generated **Client ID** and **Client secret** into
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env.local`.
5. (Phase 4 only) **APIs & Services → Library** → search "Fitness API" →
   Enable. This is not required for Phase 1 login, only for syncing steps /
   sleep / heart rate later.

> **iOS / Apple Health note:** Apple Health has no public web API — only the
> native HealthKit framework on-device. iPhone users who want their data in
> Terra have two options: (a) sync Apple Health → Google Health Connect →
> Google Fit on Android, or (b) use the manual daily-log form
> (`/api/manual-log`, Phase 4), which feeds the same `avatarEngine`.

### 3. Auth secret

```bash
npx auth secret   # writes AUTH_SECRET into .env.local for you
```

## Deploying to Vercel (Git-connected from the first commit)

1. `git init` (already done) → commit → push to a new GitHub repo:
   ```bash
   gh repo create terra --private --source=. --remote=origin --push
   # or create the repo manually on github.com, then:
   # git remote add origin <url> && git push -u origin main
   ```
2. [vercel.com/new](https://vercel.com/new) → **Add New Project** → import
   the `terra` GitHub repo. Vercel auto-detects Next.js; no build config
   needed.
3. Project → **Storage** tab → **Create Database** → Postgres (Neon-backed).
   This sets `POSTGRES_URL` in your project's environment variables for you.
4. Project → **Settings → Environment Variables** → add:
   - `AUTH_SECRET` (and `NEXTAUTH_SECRET` with the same value)
   - `NEXTAUTH_URL` → your production URL, e.g. `https://terra-yourname.vercel.app`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
5. Add the production callback URL
   (`https://<your-domain>/api/auth/callback/google`) to the Google OAuth
   client from step 2 above.
6. Push to `main` → Vercel builds and deploys automatically. No manual
   deploy command needed after this point.
7. Custom domain (optional): **Settings → Domains** → add your domain →
   follow the CNAME/A record instructions Vercel shows for your DNS
   provider.

Run the schema against the production database once, from your machine:

```bash
vercel env pull .env.local   # syncs POSTGRES_URL etc. from the Vercel project
npm run db:push
```

## Project structure

See `lib/types.ts` for the shared domain types and `lib/db/schema.ts` for the
Drizzle schema. The avatar's core logic lives in `lib/avatarEngine.ts`
(Phase 4) — a pure function, deliberately kept separate from all 3D
rendering code so the fitness logic can be tuned without touching Three.js.
