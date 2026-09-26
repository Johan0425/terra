# Terra

A 3D digital twin of your fitness progress. Your avatar's posture, aura, and
mood shift with your real sleep, activity, and training consistency — synced
from Google Fit or logged manually.

**Live:** https://terra-theta-eosin.vercel.app
**Repo:** https://github.com/Johan0425/terra

## Status: Phase 5 of 5 — feature-complete

| Phase | Scope | Status |
|---|---|---|
| 1 | Next.js + Tailwind + Auth.js (Google login) + DB schema + shared types | ✅ done |
| 2 | 3D scene: GLB avatar, OrbitControls, three-point lighting | ✅ done |
| 3 | Animation State Machine (idle / energized / fatigued / leveling-up) | ✅ done |
| 4 | `avatarEngine.ts` + Google Fit sync + dashboard HUD + history timeline | ✅ done |
| 5 | Public landing page + milestones/share cards + demo seed data | ✅ done |

### Phase 5 notes — landing page, milestones, seed data

- `app/page.tsx` + `components/landing/Hero.tsx` — public landing page with
  the 3D avatar (in a hardcoded "energized" demo state, no login needed) as
  the hero centerpiece, a 3-step explainer, placeholder testimonials
  (`// TODO: Johan` — swap for real ones), and a `GlitchButton` CTA
  (`components/ui/GlitchButton.tsx`) reused for both landing CTAs.
- `components/dashboard/MilestoneModal.tsx` + `ShareCard.tsx` — when
  `avatarEngine` flags a `triggeredMilestone` (from a real sync or manual
  log), `DashboardActions.tsx` shows the full-screen "Milestone Unlocked"
  sequence. `ShareCard` renders a real downloadable PNG via `html-to-image`
  — not a mock. The avatar's own leveling-up animation plays underneath
  automatically, since it's driven by the same `moodState` the server just
  computed.
- `scripts/seed.ts` (`npm run db:seed`) — inserts a `demo-user-terra` user
  and walks 30 days of realistic synthetic metrics through the *real*
  `processDailyMetrics` pipeline (same code path as a live sync), so the
  seeded snapshots/milestones are exactly what real usage would produce: a
  mixed start, a 14-day streak (crossing the 3/7/14-day milestones), a rest
  day, and a shorter closing streak. Re-running it wipes and regenerates
  that user's data, so it's safe to run again. `demo-user-terra` has no
  real Google account to sign in with — to view the seeded dashboard for a
  demo/portfolio recording, temporarily point `app/dashboard/page.tsx`'s
  `userId` at `"demo-user-terra"` instead of `session.user.id`.

### Phase 4 notes — real data pipeline

- `lib/avatarEngine.ts` — pure function, no DB/network imports. Scores
  activity/sleep/consistency against `TARGETS`, weights them per
  `userGoal` (`GOAL_WEIGHTS`), derives `strengthTier` from streak length,
  and flags a milestone the day a streak first crosses 3/7/14/30/60/100
  days. Tune `TARGETS`/`GOAL_WEIGHTS`/thresholds freely — nothing else
  depends on their values.
- `lib/googleFit/client.ts` — real calls to the Google Fit REST API
  (`dataset:aggregate` for steps/calories, `sessions` for sleep + workout
  detection), with automatic access-token refresh using the stored
  `refresh_token`. **Requires the Fitness API enabled** in Google Cloud
  Console (see setup steps above) and, for anyone who signed in before this
  phase, signing out and back in to grant the new scopes.
- `lib/processDailyMetrics.ts` — shared by both `/api/sync/google-fit` and
  `/api/manual-log`: computes the streak, runs the engine, upserts the
  `daily_snapshot`, updates the user's streak fields, and writes a
  `milestone` row when one unlocks.
- Dashboard (`app/dashboard/page.tsx`) is now a real Server Component: reads
  today's snapshot + last 30 days from Postgres, renders the HUD stat bars,
  the avatar (driven by real `moodState`/`energyLevel`), the sync button,
  the manual-log fallback, and the timeline. Settings lets you change
  `goal`, which reweights the engine immediately.
- The milestone-unlock **celebration UI** (full-screen sequence, modal,
  share card) is Phase 5 — the engine already flags `triggeredMilestone`
  and the DB row gets written; only the "watch it happen" UI is deferred.

### Phase 3 notes — state machine + particle aura

`AnimationStateMachine.tsx` maps TERRA's 4 `MoodState`s onto the placeholder
rig's clips (`neutral`→Idle, `energized`→Running, `fatigued`→Sitting,
`leveling-up`→Dance), always crossfading (`fadeIn`/`fadeOut(0.3)`) rather than
cutting. `leveling-up` plays once (`LoopOnce`) and settles back to Idle when
the clip finishes. `ParticleAura.tsx` is a single `InstancedMesh` (160 max
particles) whose active count, speed, and drift direction (rise/fall/ambient)
react to `energyLevel` and `moodState`; color always matches the rim light.

The dashboard currently shows a manual state switcher
(Fatigued/Neutral/Energized/Leveling&nbsp;Up buttons in `AvatarSection.tsx`)
to QA the transitions — Phase 4 deletes that switcher and drives
`moodState`/`energyLevel` from `avatarEngine.ts`'s real output instead.

Note: the placeholder rig's `Sitting`/`Standing` clips are authored as
single-pose holds (0-duration), so those two states read mostly through the
particle aura rather than a dramatic pose change — expected for this
placeholder, not a bug. A custom model with more expressive clips (per the
Phase 2 notes above) will make the pose difference more visible too.

### Phase 2 notes — the placeholder model

`public/models/character.glb` is **not** a Mixamo export — Mixamo requires an
interactive Adobe-account browser session with no public API, so an agent
can't fetch one. It's `RobotExpressive.glb`, the CC0-licensed rigged
placeholder from the three.js examples repo (credit: Tomás Laulhé /
Don McCurdy), run through:

```bash
npx gltf-transform optimize assets-src/RobotExpressive.raw.glb public/models/character.glb \
  --compress draco --flatten false --join false --instance false --simplify false
npx gltfjsx public/models/character.glb --types --keepnames
```

(`--flatten`/`--join`/`--simplify` are off because this rig uses bone-parented
rigid meshes rather than full skin weighting — the default `optimize` preset
collapses that hierarchy.) Result: 182KB, well under the 2MB budget, with 14
named AnimationClips (`Idle`, `Running`, `Sitting`, `Dance`, …) that Phase 3's
state machine maps onto TERRA's 4 states.

**To swap in your own model:** export a rigged humanoid (Mixamo or otherwise)
with clips named to match `AnimationStateMachine.tsx`'s mapping, run it
through the same two commands, drop it at the same path, and recompute
`AVATAR_SCALE_CORRECTION` in `components/avatar/AvatarModel.tsx` — the
placeholder's raw export bakes in a non-1:1 bone-space scale, so that
constant will differ per model. See that file's top comment for how it was
derived (`gltf-transform inspect` gives the authoritative bbox; don't trust a
runtime `Box3` reading taken before the scene's matrices have settled).

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
5. **Required for Sync Data to work:** **APIs & Services → Library** →
   search "Fitness API" → Enable. Not needed just to log in, only for the
   Google Fit sync (`/api/sync/google-fit`).

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
