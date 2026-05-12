# MAP Test Management System

Adaptive testing platform modeled after the NWEA MAP Growth assessment. Mixes English (Reading & Language Usage) and Mathematics items in a single session and scores students on the RIT (Rasch Unit) scale.

Built with React + TypeScript + Vite, Tailwind CSS, Supabase (Postgres + Auth + RLS), TanStack Query, Zustand, Recharts, and the Google Gemini API (admin-only, client-side).

---

## Architecture summary

- **Frontend** — React 19, Vite, Tailwind v4, TanStack Query, Zustand, React Router 6, Recharts, Sonner, KaTeX
- **Backend** — Supabase Postgres only (no Edge Functions). Adaptive engine lives in PL/pgSQL functions invoked via `supabase.rpc(...)`
- **Auth** — Supabase email/password with auto-profile trigger and three roles (student / teacher / admin)
- **Adaptive Engine** — Step size 8→2 across 40 items, interleaved Math/English, ±5 RIT search radius, final score = avg of last 10 per subject
- **AI Drafting** — Gemini called from the admin browser; AES-GCM-encrypted key in `user_settings`; all output enters the `question_drafts` queue and never auto-promotes

---

## Setup

### 1. Configure Supabase

Already targeted at: `https://kuldyyziziqjhuuwjijb.supabase.co`

Open the project in the Supabase dashboard → SQL Editor and run the migrations **in order**:

1. `supabase/migrations/001_initial_schema.sql` — tables, enums, indexes
2. `supabase/migrations/002_rls_policies.sql` — Row-Level Security
3. `supabase/migrations/003_functions.sql` — adaptive engine RPCs + triggers
4. `supabase/migrations/004_seed_questions.sql` — 50+ Math / 50+ English starter items

Alternatively, install the Supabase CLI and run:

```bash
supabase link --project-ref kuldyyziziqjhuuwjijb
supabase db push
```

### 2. Environment

`.env.local` is already populated with the project URL and anon key. Reference is in `.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

The `service_role` key is **never** used by the frontend — keep it server-only.

### 3. Install & run

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # production bundle
```

### 4. First admin

Sign up at `/signup` with role `admin`. The `on_auth_user_created` trigger creates a matching `profiles` row automatically.

### 5. Gemini key (admin only)

Go to **/settings** → AI provider settings → paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) → **Test connection** → **Save key**. The key is encrypted via AES-GCM with a key derived from the admin's user-id before it touches the database.

---

## Routes

| Path | Roles | Purpose |
|---|---|---|
| `/login`, `/signup` | public | Supabase Auth |
| `/dashboard` | all | Recent sessions, quick start |
| `/test/setup` | student | Grade-level confirmation |
| `/test/:sessionId` | student | Full-screen adaptive test |
| `/results/:sessionId` | student, teacher, admin | Final RIT, SEM band, strand breakdown |
| `/progress` | student | RIT growth over time |
| `/students` | teacher, admin | Roster with latest scores |
| `/reports` | teacher, admin | Aggregated histograms + CSV export |
| `/admin/questions` | admin | CRUD, filter, CSV import, recalibrate |
| `/admin/generator` | admin | Gemini batch generation → drafts |
| `/admin/drafts` | admin | Approve / edit / reject drafts |
| `/settings` | all | Profile + (admin) Gemini key |

---

## Critical guarantees

- All comments in code are in English
- No Supabase Edge Functions — backend logic is SQL/RPC only
- The Gemini API key only runs in admin browsers and never reaches student clients
- RLS is on for every table; helper `current_user_role()` is `SECURITY DEFINER` to avoid recursion
- Student answers route through `submit_answer` RPC which validates session ownership
- No back-button in the test — adaptive items are non-reviewable by design
- AI questions land in `question_drafts` with `review_status='pending'` until an admin approves them via `approve_draft(...)`
- `recalibrate_question` ignores items with <30 attempts (statistical floor)

---

## RIT scale reference

| Grade | English | Math |
|---|---|---|
| K | 142 | 140 |
| 1 | 160 | 162 |
| 2 | 174 | 177 |
| 3 | 188 | 190 |
| 4 | 198 | 201 |
| 5 | 206 | 210 |
| 6 | 211 | 215 |
| 7 | 214 | 219 |
| 8 | 217 | 222 |
| 9 | 220 | 226 |
| 10 | 223 | 229 |
| 11 | 224 | 230 |
| 12 | 225 | 231 |

SEM displayed as ±3 (confidence band).

---

## File map

```
src/
├── components/
│   ├── ui/                  # button, card, input, dialog, table, tabs, etc.
│   ├── app-layout.tsx       # Top nav + role-aware menu
│   ├── error-boundary.tsx
│   └── protected-route.tsx
├── pages/
│   ├── login.tsx, signup.tsx
│   ├── dashboard.tsx
│   ├── test-setup.tsx, test-active.tsx
│   ├── results.tsx, progress.tsx
│   ├── students.tsx, reports.tsx
│   ├── settings.tsx
│   └── admin/
│       ├── questions.tsx    # CRUD + CSV
│       ├── generator.tsx    # Gemini batch
│       └── drafts.tsx       # Review queue
├── features/
│   ├── test/question-renderer.tsx   # KaTeX + plain-text mixer
│   └── admin/
│       ├── gemini-generator.ts      # Gemini call + Zod schema
│       └── api-key.ts               # AES-GCM helpers
├── lib/
│   ├── supabase.ts
│   ├── rit.ts               # Norms + percentile estimator
│   └── utils.ts             # cn, grade labels, strand labels
├── hooks/use-auth.ts
├── store/
│   ├── auth.ts              # Zustand session/profile cache
│   └── test-session.ts      # Active test ephemeral state
├── types/database.ts
└── App.tsx                  # Routes + providers
supabase/
└── migrations/              # 001..004 SQL files
```

---

## Deployment

- Frontend → Vercel: connect repo, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in project env vars, build command `npm run build`, output `dist`.
- Supabase → already hosted.

---

## Troubleshooting

- **Insert into `profiles` fails after signup** — the `on_auth_user_created` trigger creates the row. If you create users via the dashboard before running `003_functions.sql`, manually `INSERT INTO profiles (...)`.
- **`get_next_question` returns nothing** — the question bank around that RIT is empty. The function auto-expands its search radius up to ±50 before giving up; if even that fails, generate more items via `/admin/generator`.
- **AI generator says "API key required"** — open `/settings` and save a Gemini key first.
- **Recalibration produces no change** — items need ≥30 attempts before they become eligible.
