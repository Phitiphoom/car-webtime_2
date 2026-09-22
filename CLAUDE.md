# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rebuild in progress

This codebase went through a full rewrite (see the approved plan for context if you have access to it). **Backend (Phase 1) and frontend (Phase 2) are both done** — every API route, service, Prisma schema, page, and component have been rewritten against the new domain model, and the project compiles/lints clean (`npx tsc --noEmit`, `npm run lint`). Phase 3 (migrating the legacy trips) was DROPPED again, for good — the old `TRAVEL_DETAIL` data has no reliable key back to real people/departments (old usernames/names don't match SAP `EMP_Code` or anything else usable), so guessing at it would just create confidently-wrong records. Old trips stay read-only on `/legacy-trips` instead (see below); everything going forward uses the new system only. Not yet done: the cross-cutting testing/logging polish in the plan's section 5 beyond what's already in place.

**Frontend architecture**: React Query (`@tanstack/react-query`) for all data fetching (`src/hooks/queries/*`), react-hook-form + zodResolver for forms (schemas imported straight from `src/server/*/*.schema.ts` — they're pure Zod, safe client-side), a shared sidebar shell (`src/components/layout/AppShell.tsx`) on every authenticated page, and one unified trip-creation form (`src/components/trip-form/*` + `src/hooks/useTripForm.ts`) replacing the old forked `EditTrip/`/`LogUsage/` trees. Trip *editing* is intentionally narrower than trip creation — see the comment in `TripForm.tsx`: the old "full edit" UI (route/car/driver) was never actually wired to the backend (the old `PUT /api/trips/[id]` silently ignored those fields), so `/trips/[id]/edit` only exposes what's genuinely editable (purpose, approval-target email) rather than reviving a UI that discarded its own inputs.

Auth is now cookie-based end to end: `POST /api/auth/login` sets an httpOnly cookie (`src/server/auth/guards.ts`'s `SESSION_COOKIE_NAME`), the client never touches the token directly, `GET /api/auth/me` bootstraps session state client-side, and `POST /api/auth/logout` clears the cookie. `src/lib/api.ts` is the one fetch wrapper every hook uses (`credentials: 'include'`, no more manual `Authorization` header building).

## Development Commands

- `npm run dev` - Start development server (`next dev`, default port 3000; no port override is set in scripts — set `PORT` env var to change it)
- `npm run build` - Build the application for production
- `npm start` - Start production server (`next start`)
- `npm run lint` - Run ESLint for code quality checks
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without making changes

There is no test script and no test framework (jest/vitest/playwright, etc.) in this repo yet — introducing one (Vitest, scoped to `src/server/**` business logic first) is part of the still-unstarted cross-cutting work. No `db:migrate`/`db:seed` scripts either; run Prisma CLI commands directly. `npx prisma generate` works without a live DB connection; `npx prisma migrate dev`/`db push` need a real `DATABASE_URL` and have **not** been run against production — see `prisma/migrations/README.md` before doing so.

## Architecture Overview

Next.js 15 (App Router) + TypeScript car booking/travel management system: SQL Server via Prisma, React 19 + Tailwind + shadcn/ui, JWT + Webtime (TigerSoft HR) auth.

### Backend layering

Route handlers under `src/app/api/**/route.ts` are thin: guard → validate → call a service. Business logic lives in `src/server/<domain>/`, not in route handlers:

```
src/server/
  auth/             # guards.ts (requireAuth/requireRole), approval-token.ts
  users/            # the single user-management domain (see below)
  reference-data/   # departments, car brands, cars, drivers, approvers
  trips/            # trip.schema.ts / trip.service.ts / trip.mapper.ts
  stats/            # car-usage.schema.ts / car-usage.service.ts
  shared/enums.ts   # Role / TripStatus / ApprovalAction — see "No native enums" below
```

- **`src/server/auth/guards.ts`** — `requireAuth(request)` / `requireRole(request, ['ADMIN', ...])` is the *only* way a route handler should authenticate. Every route calls one of these first; there is no unguarded route left. `src/lib/auth-middleware.ts` still exports `verifyJwtMiddleware()` as a thin backward-compatible wrapper around these guards, used by any route not yet migrated to call guards.ts directly.
- **User management is one domain now.** The old code had three overlapping implementations (`/api/users*` with zero auth, `/api/auth/users`, and `AuthService.createUser`). All of it is now `/api/admin/users` + `/api/admin/users/[id]`, gated `requireRole(['ADMIN'])`, backed by `src/server/users/user.service.ts`.
- **Trip domain** (`src/server/trips/`): `TripService.create()` wraps trip + items + drivers in `prisma.$transaction`. `TripService.setApprovalStatus()` is the *single* approve/reject code path, used by both the authenticated in-app action (`PUT /api/trips/[id]` with a `status` field, gated `requireRole(['APPROVER','ADMIN'])`) and the public email-link flow (`GET /api/trips/approve?token=`) — the old code had two divergent paths, one with no role check at all.
- **Multiple approvers**: a trip has N `TripApprover` rows (`Trip.approveEmail` is deprecated/unused). **Any one approver settles the trip, first decision wins** — `setApprovalStatus` does an atomic `updateMany where status=PENDING` (0 rows → 409 with who decided), consumes the email token in the same transaction, and invalidates every other outstanding link for the trip. APPROVER role users may only decide trips they are listed on; ADMIN can decide any.
- **Departments come ONLY from the official SAP list** (`Department` table, ~225 rows, imported with `prisma/replace-departments.sql`). Nothing creates a department implicitly any more: login (Webtime or local password) does NOT read or write the department, and trip / user / driver creation and the Excel import all call `DepartmentService.requireByName()` (400 if the name isn't in the list). Every UI that picks a department uses `src/components/shared/DepartmentCombobox.tsx`. The trip's department is a required field chosen on the trip form, not derived from the user.
- **Legacy trips are NOT migrated** (see decision above). `/legacy-trips` ("Log เก่า") shows the pre-rebuild `TRAVEL_DETAIL` rows read-only, exactly as originally typed, with a banner warning the data may be inaccurate — via raw SELECTs in `src/server/legacy/legacy-trip.service.ts` (the legacy models are `@@ignore`, so Prisma Client can't reach them — don't add write paths there). `/trips` ("Log ปัจจุบัน") is the real, current data going forward.
- **Email approval tokens** (`src/server/auth/approval-token.ts`): signed, expiring, single-use JWTs (tracked in the `ApprovalToken` table), replacing the old unsigned `base64(tripId:action)` token that anyone could forge.

### Database Schema

Prisma schema (`prisma/schema.prisma`) was redesigned from scratch — table/column names, models, and relations all changed from the original. Current (active) models: `User` (was `TV_USERNAME`), `Trip` (was `TRAVEL_DETAIL`), `TripItem` (was `TRAVEL_DETAIL_ITEMS`, now non-nullable `tripId`), `TripDriver` (was `TRAVEL_DRIVERS`, `driverId` is now a real FK instead of a copied name string), `Department` and `CarBrand` (new real lookup tables — the old code derived these via `distinct()` scans and dummy placeholder rows), `CarDetail` (was `CAR_DETAIL`), `DriverDetail` (was `DRIVER_DETAIL`), `ApprovalToken` (new).

**`Trip.carId` → `CarDetail`, not `CarBrand`.** A trip books a specific vehicle (with its own plate number), not just a brand — this was changed after the initial rebuild shipped, when it became clear the first pass (`Trip.carBrandId` → `CarBrand`) just replicated the old app's behavior of only ever recording a brand string with no link to the actual fleet. `CarBrand` is now purely "what brand is this `CarDetail` row" — it's no longer referenced from `Trip` at all. `TripDTO.car` carries `{ id, brand, model, plateNumber }` (via `trip.mapper.ts` joining through `CarDetail.brand`). The trip list's `carBrand` filter still works by joining `car.brand.name` for reporting across every car of a brand, even though creation now targets one specific car.

The old tables (`TV_USERNAME`, `TRAVEL_DETAIL`, `TRAVEL_DETAIL_ITEMS`, `TRAVEL_DRIVERS`, `CAR_DETAIL`, `DRIVER_DETAIL`) still exist in the live database with real data and are declared in the schema too, but marked `@@ignore` (no generated Prisma Client methods — app code cannot read or write them). They're declared purely so `prisma db push`/`migrate` never propose dropping them; **do not remove these blocks** without first exporting/archiving the underlying tables per `prisma/migrations/README.md`. `TRAVEL_DETAIL_BACKUP` is the one exception — it was already unused (`@@ignore`d in the pre-rebuild schema too) and was dropped from the schema entirely (decision: export-then-drop, not carried forward as a legacy block).

**No native enums**: SQL Server's Prisma connector doesn't support `enum`, so `role`/`status`/`action` are plain `VarChar` columns validated against `src/server/shared/enums.ts` (`Role`, `TripStatus`, `ApprovalAction` — Zod-backed). Always import the type/schema from there rather than hardcoding a string literal.

**No native `Restrict`**: this connector also rejects `onDelete: Restrict` — the schema uses `NoAction` everywhere it means "block the delete if referenced," which is SQL Server's default FK behavior anyway.

**Migrations**: `prisma/migrations/README.md` documents the baseline + cutover strategy (there's no Prisma Migrate history from the old schema, and moving to the new one is a data migration, not an in-place rename — read that file before running anything against a real database).

### Authentication & Authorization

- **Accounts can come from two paths**: manual (admin on `/admin/users`, or the Excel import — `src/server/users/user.service.ts`), or **auto-provisioned on first successful Webtime login** (`AuthService.tryWebtimeAuthentication`, mirrors the old LDAP auto-provisioning): `username` = the employee's Webtime `PersonCode`, `name` from `PNT_Person`, `role` always defaults to `USER` (never `ADMIN`/`APPROVER`), `departmentId` is left unset (departments come ONLY from the official SAP list — never from Webtime — an admin assigns one afterward). An existing account's `role`/`department` are never re-derived or overwritten at login time; only `name` is refreshed from Webtime on each login.
- `src/middleware.ts` (Edge, page-gating for `/dashboard`, `/log-usage`, `/trips`, `/admin`; skips `/api/*`) and the API guards now read the *same* trusted role claim straight from the JWT — no more split-brain between what the page middleware trusted and what the API re-derived.
- JWT/approval-token secrets are validated at boot by `src/env.ts` (Zod) — the process refuses to start if `JWT_SECRET`, `JWT_REFRESH_SECRET`, or `APPROVAL_TOKEN_SECRET` are unset/too short, instead of silently falling back to a hardcoded default like the old code did.
- **Login sources**: `src/services/auth-service.ts` tries a locally-stored bcrypt password first, then Webtime (`src/services/webtime-service.ts`, a separate SQL Server reached via `mssql`, matching `PersonCode`/`Pws` in `cyberhrm.dbo.PNT_Person`/`ADM_UserPws`). This replaces the old LDAP/AD path entirely — `src/services/ldap-service.ts` and `src/server/auth/role-mapping.ts` (department→role auto-mapping, only meaningful for LDAP auto-provisioning) have been deleted, and `ldapjs` is no longer a dependency.
- Webtime compares its stored password as **plain text** (`COLLATE THAI_CS_AS`) — a property of the upstream HR system, not something this app introduces. The connection runs with `encrypt: true` so the password isn't sent in the clear over the network.

### Path Aliases

- `@/*` maps to `./src/*`

### UI Components

Uses shadcn/ui with Radix UI primitives, Tailwind CSS, Lucide React icons, Framer Motion — this part is unchanged, but the components themselves need rebuilding in Phase 2 against the new API shapes and the approved visual direction.

### Environment Configuration

Validated at process boot by `src/env.ts` — see that file for the exact required set and constraints (min lengths, URL format, etc.). No `.env.example` exists yet; `.env`/`.env.local` are gitignored. Broadly: `DATABASE_URL`; `JWT_SECRET`/`JWT_REFRESH_SECRET`/`APPROVAL_TOKEN_SECRET` (all required, min 32 chars, no fallback); `WEBTIME_DB_HOST`/`WEBTIME_DB_NAME`/`WEBTIME_DB_USER`/`WEBTIME_DB_PASSWORD` (+ optional `WEBTIME_DB_PORT`, default 1433, and `BYPASS_WEBTIME=true` for local dev); `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_USER`/`EMAIL_PASSWORD`/`EMAIL_FROM`; `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_API_BASE_URL`; optional `LOG_LEVEL`.

### Development Notes

- **UI style ("Paper Ledger")**: read `docs/ui-style.md` before building or restyling any page/component — tokens, shapes, stamp, sidebar/header tabs, and the Tailwind v3-only syntax pitfall (`max-h-(--x)` generates no CSS here).

- Prettier configuration: single quotes, 80 char width, 2 spaces
- Structured logging via `src/lib/logger.ts` (pino, redacts PII) — prefer this over `console.log` in code you touch, especially anywhere near auth
- Uses Zod for schema validation — one `*.schema.ts` per domain under `src/server/`, imported both server-side (route handlers) and client-side (react-hook-form's `zodResolver`) so there's one definition of each shape, not two
- Email notifications via nodemailer (`src/services/email-service.ts`), now driven off the `TripDTO` shape from `src/server/trips/trip.mapper.ts`, not raw Prisma rows
- React Query (`@tanstack/react-query`) is the data-fetching layer client-side — see `src/hooks/queries/*`. `react-toastify` is still a dependency but toasts are done via `sonner` (`src/components/ui/sonner.tsx`, mounted in `layout.tsx`) — prefer `sonner`'s `toast()` for new code
- Print functionality (`window.print()` on the trip detail page) uses plain browser print, not `react-to-print` — that package is still a dependency but unused by the current pages
- Toast notifications: use `sonner`, not `react-toastify`, for anything new
- Charts and data visualization via recharts
