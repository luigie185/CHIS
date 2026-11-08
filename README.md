# RHU Health Information System

Next.js + Postgres rebuild of the RHU health records system. See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the full plan.

**Status:** Phase F1 (UI foundation) done: app shell, shared components, demo data, demo accounts. Screens are being built on demo data first, then connected to the database (see plan §3.4 and §14).

## Run locally

Requirements: Node 22+ and pnpm 10 (`corepack enable`). **No Docker or Postgres install needed**: local dev uses [PGlite](https://pglite.dev), a full Postgres that runs inside Node and stores data in `./.data/pglite`.

```bash
pnpm install
cp .env.example .env        # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm db:setup               # create tables + seed barangays, lab tests, vaccines, first admin
pnpm dev                    # starts the local database and the app → http://localhost:3000
```

Open http://localhost:3000/login. In development the login page shows **demo account buttons** (admin, doctor, nurse, midwife, encoder) so you can switch roles in one click. Or sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` (default `admin@rhu.local` / `ChangeMe123!`). Demo accounts need `SEED_DEMO_ACCOUNTS=true` in `.env` before `pnpm db:setup`.

Patient and clinical screens use **generated demo data** (a "Demo data" badge shows in the header). It resets when the dev server restarts. Logins and roles are real.

After pulling new migrations, stop `pnpm dev` and run `pnpm db:setup` again (safe to re-run). `pnpm db:reset` deletes the local database.

To use a real Postgres instead (e.g. a Neon branch), set `DATABASE_URL` in `.env`, then run `pnpm db:migrate && pnpm db:seed` and `pnpm dev:next`.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Local database (PGlite on port 5433) + Next.js dev server |
| `pnpm dev:next` | Next.js only (when `DATABASE_URL` points to your own Postgres) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint / TypeScript / Vitest |
| `pnpm db:setup` | Migrate + seed the local PGlite database (run with `pnpm dev` stopped) |
| `pnpm db:reset` | Delete the local database |
| `pnpm db:generate` | Create a SQL migration from schema changes in `src/db/schema` |
| `pnpm db:migrate` / `pnpm db:seed` | Migrate / seed the database the app is connected to (`DATABASE_URL`, or the local server while `pnpm dev` runs) |
| `pnpm db:studio` | Browse the database in Drizzle Studio (while `pnpm dev` runs) |

## Layout

```
src/
  proxy.ts               # guests → /login (Next 16 renamed middleware to proxy)
  db/schema/             # Drizzle tables, one file per module
  lib/auth/              # Better Auth config, session helpers, permission matrix
  app/(public)/          # landing + service pages
  app/(auth)/login       # login page (+ demo account buttons in dev)
  app/(app)/             # signed-in area with sidebar: /admin, /doctor, /dashboard, /patients, /ui-kit
  components/ui/         # shadcn/ui components (vendored)
  components/            # shared: data-table, page-header, status-badge, forms/, layout/
  lib/nav.ts             # sidebar items per role
  mocks/                 # demo data store (frontend phases only; imported by src/server only)
  server/<module>/       # queries/actions — mock now, database in Part B
  app/api/auth/[...all]  # Better Auth handler
scripts/seed.ts          # lookups + first admin
scripts/local-db.ts      # PGlite setup / serve / reset
drizzle/                 # generated migrations (commit these)
```

Server code checks access with `requireUser()`, `requireRole(...)`, or `requirePermission("patient:write")` from `src/lib/auth/session.ts`. Wrong role → 403 page.

## Notes vs. the plan
- DB driver is `pg` (node-postgres) instead of `@neondatabase/serverless`, so the same code works against the local PGlite server and Neon. Use Neon's pooled URL for `DATABASE_URL`.
- Local dev uses PGlite instead of Docker. It is real Postgres, so the schema and migrations are the same as production.
- Public sign-up is disabled; admins will create staff accounts (Phase 1).
