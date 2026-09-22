-- prisma/import-users.sql
--
-- Bulk-create users so nobody has to type them into the admin screen.
-- Run in SSMS / Azure Data Studio against the app database. Safe to re-run:
-- rows that already exist (same username) are skipped, never overwritten.
--
-- Passwords are random + unusable on purpose (people log in with their AD
-- password; name / email / department are refreshed from AD on first login,
-- and an existing row keeps the role set here). Anyone who needs a LOCAL
-- password must be given one from the admin screen afterwards.
--
-- Pick ONE of the two options below.

SET NOCOUNT ON;

-- ============================================================================
-- OPTION A — copy everything from the legacy table (TV_USERNAME)
-- Role is derived from the old DEPARTMENT the same way the app does at
-- provisioning (src/server/auth/role-mapping.ts). Review the result and fix
-- roles by hand afterwards if needed.
-- ============================================================================

-- 1) departments that don't exist yet
INSERT INTO dbo.Department (name, isApproverDept, isAdminDept, isActive, createdAt, updatedAt)
SELECT DISTINCT LTRIM(RTRIM(t.DEPARTMENT)), 0, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()
FROM dbo.TV_USERNAME t
WHERE t.DEPARTMENT IS NOT NULL
  AND LTRIM(RTRIM(t.DEPARTMENT)) NOT IN (N'', N'Unknown', N'N''Unknown''')
  AND NOT EXISTS (SELECT 1 FROM dbo.Department d WHERE d.name = LTRIM(RTRIM(t.DEPARTMENT)));

-- 2) users
INSERT INTO dbo.[User] (username, password, name, email, role, departmentId, isActive, createdAt)
SELECT
  t.USERNAME,
  CONVERT(nvarchar(255), NEWID()),                 -- unusable random password
  t.NAME,
  NULLIF(LTRIM(RTRIM(t.EMAIL)), ''),
  CASE
    WHEN LOWER(LTRIM(RTRIM(t.DEPARTMENT))) IN (N'mis', N'mis department', N'it mis') THEN 'ADMIN'
    WHEN LOWER(LTRIM(RTRIM(t.DEPARTMENT))) IN (
      N'supply chain department', N'vice president', N'acoec', N'adv. coec',
      N'md', N'md scm', N'md prd', N'md qc', N'md acc', N'md mkt') THEN 'APPROVER'
    ELSE 'USER'
  END,
  d.id,
  COALESCE(t.IS_ACTIVE, 1),
  SYSUTCDATETIME()
FROM dbo.TV_USERNAME t
LEFT JOIN dbo.Department d ON d.name = LTRIM(RTRIM(t.DEPARTMENT))
WHERE t.DELETED_AT IS NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.[User] u WHERE u.username = t.USERNAME);

-- ============================================================================
-- OPTION B — type a list once (e.g. paste from Excel), role set per row.
-- Uncomment this block and edit the VALUES. Department may be NULL: it is
-- filled from AD on the person's first login.
-- ============================================================================
/*
DECLARE @new TABLE (username nvarchar(255), name nvarchar(255), email varchar(255),
                    role varchar(20), department nvarchar(255));

INSERT INTO @new (username, name, email, role, department) VALUES
  (N'somchai.j', N'สมชาย ใจดี',   'somchai.j@snc.co.th', 'APPROVER', NULL),
  (N'somying.k', N'สมหญิง คงมั่น', 'somying.k@snc.co.th', 'APPROVER', N'Supply Chain Department'),
  (N'anan.p',    N'อนันต์ ปัญญา',  'anan.p@snc.co.th',    'USER',     NULL);

INSERT INTO dbo.Department (name, isApproverDept, isAdminDept, isActive, createdAt, updatedAt)
SELECT DISTINCT n.department, 0, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()
FROM @new n
WHERE n.department IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.Department d WHERE d.name = n.department);

INSERT INTO dbo.[User] (username, password, name, email, role, departmentId, isActive, createdAt)
SELECT n.username, CONVERT(nvarchar(255), NEWID()), n.name, n.email, n.role, d.id, 1, SYSUTCDATETIME()
FROM @new n
LEFT JOIN dbo.Department d ON d.name = n.department
WHERE NOT EXISTS (SELECT 1 FROM dbo.[User] u WHERE u.username = n.username);
*/

-- Check the result
SELECT u.id, u.username, u.name, u.email, u.role, d.name AS department, u.isActive
FROM dbo.[User] u
LEFT JOIN dbo.Department d ON d.id = u.departmentId
ORDER BY u.id DESC;
