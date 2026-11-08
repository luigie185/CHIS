# RHU Health Information System

Next.js + Postgres rebuild of the RHU health records system. See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the full plan.

**Status:** Phase 0 (setup): auth with roles, base schema, seed, landing/login/role home pages.

## Run locally

Requirements: Node 22+, pnpm 10 (`corepack enable`), and Postgres 16 (Docker or a local install).

```bash
pnpm install
cp .env.example .env        # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d        # starts Postgres on localhost:5432 (skip if you have your own)
pnpm db:migrate             # create tables
pnpm db:seed                # barangays, lab tests, vaccines, first admin
pnpm dev                    # http://localhost:3000
```

Log in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env` (default `admin@rhu.local` / `ChangeMe123!`). Change it before using real data.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint / TypeScript / Vitest |
| `pnpm db:generate` | Create a SQL migration from schema changes in `src/db/schema` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Seed lookups + admin (safe to re-run) |
| `pnpm db:studio` | Browse the database in Drizzle Studio |

## Layout

```
src/
  proxy.ts               # guests → /login (Next 16 renamed middleware to proxy)
  db/schema/             # Drizzle tables, one file per module
  lib/auth/              # Better Auth config, session helpers, permission matrix
  app/(auth)/login       # login page
  app/(app)/             # signed-in area: /admin, /doctor, /dashboard
  app/api/auth/[...all]  # Better Auth handler
scripts/seed.ts
drizzle/                 # generated migrations (commit these)
```

Server code checks access with `requireUser()`, `requireRole(...)`, or `requirePermission("patient:write")` from `src/lib/auth/session.ts`. Wrong role → 403 page.

## Notes vs. the plan
- DB driver is `postgres` (postgres.js) instead of `@neondatabase/serverless`, so the same code works against local Postgres and Neon. Use Neon's pooled URL for `DATABASE_URL`.
- Public sign-up is disabled; admins will create staff accounts (Phase 1).
