-- prisma/compare-users.sql
--
-- READ-ONLY comparison of the OLD user table (TV_USERNAME) against the NEW
-- one (User). Doesn't change anything — just four report queries. Run in
-- SSMS against the app database (matched by username, case-insensitive,
-- spacing-normalized the same way replace-departments.sql did).
--
-- Result sets, in order:
--   1) Summary counts
--   2) Old-only  — in TV_USERNAME but never made it into User (not migrated)
--   3) New-only  — in User but not in TV_USERNAME (created directly in the new
--                  system: by an admin, Excel import, or first Webtime login)
--   4) Matched   — exists in both; shows old vs new name/email/active/department
--                  side by side and flags anything that differs

SET NOCOUNT ON;

DECLARE @norm TABLE (username_norm nvarchar(255));

-- Normalize a username the same way for both sides: trim + collapse odd
-- whitespace + compare case-insensitively.
IF OBJECT_ID('tempdb..#old') IS NOT NULL DROP TABLE #old;
IF OBJECT_ID('tempdb..#new') IS NOT NULL DROP TABLE #new;

SELECT
  t.ID,
  LTRIM(RTRIM(t.USERNAME)) AS username,
  t.NAME AS name,
  NULLIF(LTRIM(RTRIM(t.EMAIL)), N'') AS email,
  COALESCE(t.IS_ACTIVE, 1) AS isActive,
  NULLIF(LTRIM(RTRIM(t.DEPARTMENT)), N'') AS department,
  t.DELETED_AT
INTO #old
FROM dbo.TV_USERNAME t;

SELECT
  u.id,
  u.username,
  u.name,
  u.email,
  u.role,
  u.isActive,
  d.name AS department,
  u.deletedAt
INTO #new
FROM dbo.[User] u
LEFT JOIN dbo.Department d ON d.id = u.departmentId;

-- 1) summary -------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM #old) AS old_total,
  (SELECT COUNT(*) FROM #old WHERE DELETED_AT IS NULL) AS old_not_deleted,
  (SELECT COUNT(*) FROM #new) AS new_total,
  (SELECT COUNT(*) FROM #new WHERE deletedAt IS NULL) AS new_not_deleted,
  (SELECT COUNT(*) FROM #old o
     WHERE EXISTS (SELECT 1 FROM #new n WHERE n.username COLLATE Latin1_General_100_CI_AS = o.username COLLATE Latin1_General_100_CI_AS)
  ) AS matched_by_username;

-- 2) old-only: never migrated ---------------------------------------------
SELECT
  o.ID, o.username, o.name, o.email, o.department,
  o.isActive AS old_isActive,
  CASE WHEN o.DELETED_AT IS NOT NULL THEN 1 ELSE 0 END AS old_deleted
FROM #old o
WHERE NOT EXISTS (
  SELECT 1 FROM #new n
  WHERE n.username COLLATE Latin1_General_100_CI_AS = o.username COLLATE Latin1_General_100_CI_AS
)
ORDER BY o.username;

-- 3) new-only: created directly in the new system --------------------------
SELECT
  n.id, n.username, n.name, n.email, n.role, n.department,
  n.isActive AS new_isActive,
  CASE WHEN n.deletedAt IS NOT NULL THEN 1 ELSE 0 END AS new_deleted
FROM #new n
WHERE NOT EXISTS (
  SELECT 1 FROM #old o
  WHERE o.username COLLATE Latin1_General_100_CI_AS = n.username COLLATE Latin1_General_100_CI_AS
)
ORDER BY n.username;

-- 4) matched: side-by-side, flag differences --------------------------------
SELECT
  o.username,
  o.name  AS old_name,        n.name  AS new_name,
  o.email AS old_email,       n.email AS new_email,
  o.department AS old_department, n.department AS new_department,
  o.isActive AS old_isActive, n.isActive AS new_isActive,
  n.role AS new_role,
  CASE WHEN o.name  <> n.name  OR (o.name  IS NULL) <> (n.name  IS NULL) THEN 1 ELSE 0 END AS name_differs,
  CASE WHEN ISNULL(o.email, N'') <> ISNULL(n.email, N'') THEN 1 ELSE 0 END AS email_differs,
  CASE WHEN o.isActive <> n.isActive THEN 1 ELSE 0 END AS active_differs
FROM #old o
JOIN #new n ON n.username COLLATE Latin1_General_100_CI_AS = o.username COLLATE Latin1_General_100_CI_AS
ORDER BY
  CASE WHEN o.name <> n.name OR ISNULL(o.email, N'') <> ISNULL(n.email, N'') OR o.isActive <> n.isActive THEN 0 ELSE 1 END,
  o.username;

DROP TABLE #old;
DROP TABLE #new;
