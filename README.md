# DecryptMe

A CTF platform built with **Next.js 16** (App Router), **React 19**, **Tailwind CSS v4**, and **PostgreSQL via Supabase**.

## Requirements

- Node.js 20.9 or newer
- A PostgreSQL/Supabase database with the DecryptMe tables already created (see the database notes below)
- A Supabase project for browser auth (Google sign-in, email verification, password reset) and private file storage

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables. Copy `.env.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.example .env.local
   ```

   Next.js automatically loads `.env.local` from the project root. `server/db.js` also loads `server/.env` for the standalone API server (`npm run server`); both files are gitignored. Use one local config location and never commit real values.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run Oxlint |
| `npm run server` | Run the optional standalone Express API on port 3001 (not used by Vercel) |

## Structure

- `app/` - Next.js App Router pages, layouts, and route handlers.
  - `app/(app)/` - dashboard, challenges, leaderboard, profile, and admin console.
  - `app/login/` - sign-in page.
  - `app/api/[...path]/` - catch-all route handler that mounts the Express API in `server/app.js`.
- `src/views/` - page components (Dashboard, Challenges, Leaderboard, Profile, admin console).
- `src/components/` - shared UI, navigation bridge, and presence heartbeat.
- `src/lib/api.js` - client fetch helper (JWT from `localStorage`).
- `server/` - Express application, middleware, routes, and PostgreSQL pool.
- `public/` - static assets, including legacy challenge images under `public/assets/`.

## Authentication

The app keeps the SPA auth model: log in through `POST /api/auth/login`, store the JWT in `localStorage` as `auth_token`, and send it as an `Authorization: Bearer <token>` header. The authenticated layout (`src/components/AppShell.jsx`) redirects to `/login` when no token is present. Google sign-in, email verification, and password reset use the Supabase browser client configured by `NEXT_PUBLIC_SUPABASE_*`.

## Deploying to Vercel

1. Push this repository to GitHub. Make sure all source files are committed and that no `.env` file is included.
2. In Vercel, choose **Add New... > Project** and import the repository. Vercel detects Next.js automatically:
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: leave the default (`.next`)
   - No `vercel.json` is needed. App Router handles clean URLs and page refreshes automatically.
3. In **Project Settings > Environment Variables**, add the variables listed in `.env.example`. At minimum:

   | Variable | Scope | Notes |
   | --- | --- | --- |
   | `DATABASE_URL` (or `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) | Server | Use the Supabase **transaction pooler** connection string for serverless. |
   | `JWT_SECRET` | Server | Long random value; changes to it invalidate existing sessions. |
   | `SUPABASE_URL` | Server | Project URL. |
   | `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) | Server | Secret key, never prefixed with `NEXT_PUBLIC_`. |
   | `SUPABASE_BUCKET` | Server | Defaults to `Files`. |
   | `NEXT_PUBLIC_SUPABASE_URL` | Browser | Also set at build time (Vercel applies variables to builds). |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser | Publishable/anon key; safe to expose. |

   Optional: `JWT_EXPIRES_IN`, `DB_SSL`, `DB_POOL_MAX`, `SUPABASE_SIGNED_URL_TTL`, `AUTH_RATE_WINDOW_MS`, `AUTH_RATE_MAX`.

4. In Supabase, allow your production domain and callback URLs:
   - Site URL: `https://<your-domain>`
   - Redirect URLs: `https://<your-domain>/auth/callback` and `https://<your-domain>/reset-password`
   - Ensure the private storage bucket referenced by `SUPABASE_BUCKET` exists.
5. Deploy. Check `/api/health` on the deployed domain: it returns `{"status":"ok","db":"connected"}` when the database connection works.

`NEXT_PUBLIC_*` values are inlined at build time, so set them before building/deploying and redeploy after changing them. Non-public secrets are read at runtime by the Node.js route handlers.

## Database notes

The runtime uses **PostgreSQL** (`pg` in `server/db.js`) with Supabase Auth and Storage. `database/schema.sql`, `database/admin_features.sql`, and `database/seed.sql` are legacy **MySQL** scripts from before the migration; they are not compatible with PostgreSQL and are not run by the app. Do not execute them against a Supabase database. `database/supabase_bio.sql` is PostgreSQL and applies profile bio rules. The seeded legacy images are available under `public/assets/`.

## Limitations to be aware of

- The auth rate limiter uses an in-memory map, so limits are per serverless instance rather than shared across all users.
- Presence and the signed-URL cache are also per-instance; this does not affect correctness.
- CORS currently allows any origin. The API authenticates with a bearer token rather than cookies, but you can restrict it in `server/app.js` if you need a strict origin allowlist.
