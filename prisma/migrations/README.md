# Migration strategy for the rebuild

**Schema notes confirmed against `npx prisma generate` on this connector:**
SQL Server has no native enum type, so Prisma's `enum` isn't usable here —
`role`/`status`/`action` are plain `VarChar` columns validated at the app
layer instead (`src/server/shared/enums.ts`). SQL Server also doesn't support
`onDelete: Restrict` as a referential action (Prisma only allows `Cascade`,
`NoAction`, `SetNull`, `SetDefault` on this connector) — `NoAction` is used
everywhere the target schema wanted "block the delete if referenced," which
is SQL Server's actual default FK behavior. `schema.prisma` in this repo
already reflects both fixes and generates cleanly; this note exists so a
future migration attempt doesn't have to rediscover it.

No `prisma/migrations` history exists in the old codebase — schema changes were
applied by hand-running `prisma/manual_add_soft_delete_tv_username.sql`
directly against the database. This directory starts Prisma Migrate history
from scratch, in two stages. **These commands need a real `DATABASE_URL`
pointed at a copy of the current production database and must be run from a
machine that has that access — they were not run as part of writing this
schema.**

## Stage 1 — baseline the CURRENT (old) schema

Do this against a **copy** of production first, never the live database
directly, so a mistake here is free to redo.

1. Check out the old `prisma/schema.prisma` (the one with `TRAVEL_DETAIL`,
   `TV_USERNAME`, etc. — i.e. `git show <commit-before-this-rewrite>:prisma/schema.prisma`).
2. `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_baseline/migration.sql`
   creates a migration that reproduces the current DB shape from nothing.
3. `npx prisma migrate resolve --applied 0_baseline` marks it applied **without
   running it** (the tables already exist) — see
   https://www.prisma.io/docs/orm/prisma-migrate/getting-started/add-prisma-migrate-to-a-project
4. Confirm `npx prisma migrate status` reports the database as up to date.

## Stage 2 — migrate to the new (target) schema in this repo

Once Stage 1 gives you a clean baseline to diff against:

1. Copy the target `prisma/schema.prisma` from this rewrite into place.
2. `npx prisma migrate dev --name rebuild_target_schema --create-only` to
   generate the migration SQL without applying it, so it can be reviewed and
   hand-edited first.
3. **Review and edit the generated SQL before applying.** Known issues to
   check for on SQL Server specifically:
   - `TripItem.tripId` and `TripDriver.tripId` are both `onDelete: Cascade`
     from `Trip`. SQL Server rejects multiple cascade paths that converge on
     the same table (error 1785). These two are independent children of
     `Trip` with no further convergence, so it _should_ be fine, but verify
     against the actual generated DDL — if SQL Server rejects it, drop to
     `NoAction` on one FK and perform that cascade in the application
     transaction instead (see `TripService` in the rebuild plan).
   - Renaming `TRAVEL_DETAIL` → `Trip`, `TID` → `id`, `CARBARND` → the new
     `carBrandId` FK, etc. is a **data migration**, not just a DDL rename —
     the generated migration will want to drop and recreate columns because
     the _type_ is changing (string → FK int). Do not run the raw generated
     SQL as-is; it needs a hand-written data-backfill migration that:
     1. Creates the new tables (`Department`, `CarBrand`, `ApprovalToken`).
     2. Seeds `Department` from the current `APPROVER_DEPARTMENTS`/
        `DEPARTMENT_ALIAS` sets in `src/lib/auth-middleware.ts`, plus a
        distinct scan of existing `TV_USERNAME.DEPARTMENT` /
        `TRAVEL_DETAIL.DEPARTMENT` values for anything not already covered.
     3. Seeds `CarBrand` from a distinct scan of `TRAVEL_DETAIL.CARBARND`
        and `CAR_DETAIL.BRAND`.
     4. Adds the new FK columns alongside the old string columns, backfills
        them by joining on name, THEN drops the old string columns — never
        drop-and-recreate in one step against real data.
     5. Backfills `User.role` from department via the same mapping logic as
        the old `mapRole()`, defaulting anything unmapped to `USER` (not
        `ADMIN` — this is the fix for the old LDAP `'MIS'`-fallback
        privilege-escalation bug).
     6. Normalizes the three different status casings
        (`'Pending'/'Approve'/'Rejected'`, `'approve'/'reject'`,
        `'approved'/'rejected'`) into the new `TripStatus` enum values before
        the column type changes.
     7. Cleans up orphaned `TripItem`/`TripDriver` rows (old nullable `TID`
        pointing at a deleted/missing trip) before making `tripId`
        non-nullable — decide case by case whether to re-attach or discard,
        per the "Remaining Open Items" section of the rebuild plan.
     8. Exports `TRAVEL_DETAIL_BACKUP` to a file/archive table, then drops it.
   - Test the full migration against a **restored copy of real production
     data**, not just clean synthetic seed data — the messy shapes (mixed
     casing, orphans) only show up there.
4. Only after it's been run clean against a staging copy should it be applied
   to production, during the Phase 4 cutover window in the rebuild plan.
