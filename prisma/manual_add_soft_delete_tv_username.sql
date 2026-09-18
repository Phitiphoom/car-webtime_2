-- Adds soft-delete columns to TV_USERNAME.
-- Run manually against the target database (not managed via `prisma migrate`).

-- WITH VALUES backfills existing rows with 1; without it, a nullable column's
-- default only applies to future inserts and every existing user would end up
-- NULL (which fails the `IS_ACTIVE: true` filters added in the app code).
ALTER TABLE TV_USERNAME
  ADD IS_ACTIVE BIT NULL CONSTRAINT DF_TV_USERNAME_IS_ACTIVE DEFAULT (1) WITH VALUES;

ALTER TABLE TV_USERNAME
  ADD DELETED_AT DATETIME NULL;
