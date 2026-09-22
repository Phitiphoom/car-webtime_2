-- prisma/replace-departments.sql
--
-- Replace the Department table's contents with the official list (from
-- SNC-SAP.EmployeeAll). Run in SSMS against the APP database.
--
-- What it does, in order:
--   1. adds every listed department that isn't there yet
--   2. old rows that are the same name written differently (extra/odd spaces,
--      e.g. 'QA&QC PIPE  M-IDL') -> users / trips / drivers are re-pointed to
--      the listed row, then the old row is deleted
--   3. deletes old departments that are NOT in the list AND that nothing
--      references
--   4. lists old departments NOT in the list that are still in use (users,
--      trips or drivers point at them) — these are NOT deleted, because Trip
--      requires a department; decide per row what they should become
--
-- SAFE BY DEFAULT: @DryRun = 1 shows what would happen and rolls everything
-- back. Read the output, then set @DryRun = 0 and run again.

SET NOCOUNT ON;
DECLARE @DryRun bit = 1;

DECLARE @new TABLE (name nvarchar(255));
INSERT INTO @new (name) VALUES
 (N'ACC&FIN'), (N'ACC&FIN M-ADMIN'), (N'ADVISOR'), (N'Analysis and Planning'),
 (N'Assembly B-7 D-DL'), (N'Assembly B-7 M-DL'), (N'Assistant Operation'), (N'ATM'),
 (N'B10_BEND'), (N'B1F1 D-DL'), (N'B1F1 M-DL'), (N'B1F10_SHEET METAL'),
 (N'B1F4 TURRET PUNCH'), (N'B1F4_BENDING'), (N'B1F4_Laser&Turret'), (N'B1F4_MINIBOX'),
 (N'B1F4_PACKING'), (N'B1F4_PAINT'), (N'B1F4_PRESS'), (N'B1F4_QA&QC'), (N'B1F4_SUPPORT'),
 (N'B1F5_ASSY'), (N'B1F5_BENDING'), (N'B1F5_HYDRAULIC'), (N'B1F5_LASER'),
 (N'B1F5_PACKING'), (N'B1F5_PUNCHING'), (N'B1F5_QC'), (N'B1F5_SUPPORT'),
 (N'B1F8_BEND'), (N'B1F8_PACK MCP'), (N'B1F8_PACKING'), (N'B1F8_PUNCH'), (N'B1F8_QC'),
 (N'B1F8_SPOT'), (N'B1F8_SUPPORT'), (N'B1F8_WELDING'), (N'B1F9_QC'),
 (N'B1F9_SHEET METAL'), (N'B1F9F10_SUPPORT'),
 (N'B3'), (N'B3 DIE MAINTANANCE'), (N'B3_HYDRAULIC'), (N'B3_LOUVER'), (N'B3_MOLD MT'),
 (N'B3_NACHI'), (N'B3_PACK DAI'), (N'B3_PACK ELT'), (N'B3_PACK MCP'), (N'B3_PAINT'),
 (N'B3_PLANNING'), (N'B3_PROGRESSIVE'), (N'B3_QC'), (N'B3_SPOT'), (N'B3_SUPERVIOSR'),
 (N'B3_TANDEM 1'), (N'B3_TANDEM 2'), (N'B3_TAPPING'),
 (N'BENDING'), (N'Board DCS'), (N'BOI'), (N'BOI M-ADMIN'), (N'BRAZING'), (N'Brazing DT'),
 (N'BU1'), (N'BU5'), (N'BURING'), (N'C.S&A.MANAGMENT'), (N'CADDY'), (N'CENTER'),
 (N'Chief Operator'), (N'CLUB HOUSE'), (N'CLUBHOUSE'), (N'Condenser M-DL'), (N'CUTTING'),
 (N'D AUTO LATHE'),
 (N'DL.ASSEMBLY'), (N'DL.Automation Engineer'), (N'DL.Blanking'), (N'DL.CNC'),
 (N'DL.COMPART'), (N'DL.EIWH'), (N'DL.ENAMAL'), (N'DL.INJECTION'),
 (N'DL.INJECTION PLASTIC'), (N'DL.PRESS'), (N'DL.ROBOT'), (N'DL.SPOTS'),
 (N'DL.SUPPLY CHAIN SAWHA'), (N'DL.TANDEM'), (N'DL.TURRET SSMA'), (N'DL.WELDING'),
 (N'Electrical Engineer'), (N'ENGINEER'), (N'ENGINEER D-IDL'), (N'ENGINEER M-IDL'),
 (N'Environment'), (N'EV PROJECT M-DL'), (N'Field Greb Crane D-DL'), (N'Field Operator'),
 (N'Food & Beverage'), (N'FORMING'), (N'FREEZER M-DL'), (N'FRONT HOTEL'),
 (N'GA D-ADMIN'), (N'GA M-ADMIN'), (N'GOLF OPERATION'), (N'HEAT EXCHANGER'),
 (N'Heat Exchanger D-DL'), (N'Heat Exchanger M-DL'), (N'HOTEL MANAGEMENT'),
 (N'Housekeeping'), (N'HR M-ADMIN'), (N'HR&CSR'), (N'HRD'), (N'IA M-ADMIN'),
 (N'IDL. Business Developement'), (N'IDL.FINANCE&ACCOUN'), (N'IDL.HR'),
 (N'IDL.INDUSTRIALIZATION'), (N'IDL.IT'), (N'IDL.MAINTENANCE'),
 (N'IDL.PROCESS ENGINEER SAWHA'), (N'IDL.PRODUCTION'), (N'IDL.QUALITY'), (N'IDL.R&D'),
 (N'IDL.SUPPLY CHAIN SAWHA'), (N'INDUSTRIAL ESTATE'), (N'IT'), (N'IT M-ADMIN'),
 (N'LINE A'), (N'LINE B'), (N'LINE C1'), (N'LINE D1'), (N'LINE D2'), (N'LINE E'),
 (N'LINE H'), (N'Loader Operator D-DL'), (N'MAINTENANCE'), (N'MAINTENANCE D-DL'),
 (N'MANAGEMENT'), (N'MANAGEMENT - CENTER'), (N'MANAGEMENT - OEM'),
 (N'Management Hisense M-DL'), (N'Management TOOLBOX M-DL'), (N'MARKETING'),
 (N'MARKETING PD M-DL'), (N'Mechanical Department'), (N'MIS'), (N'MUFFLER'),
 (N'NEW MODEL'), (N'ODM MIDORI D-DL'), (N'ODM MIDORI M-DL'), (N'PACKING'),
 (N'Packing DT'), (N'PE&ROBOT'), (N'PIPE D-DL'), (N'PIPE KIT D-DL'), (N'PIPE KIT M-DL'),
 (N'PIPE M-DL'), (N'PLANNING'), (N'POWDER COATING'), (N'PPSO M-IDL'),
 (N'PRD_QUALITY CONTROL'), (N'Production Engineer'), (N'Production Mini MD'),
 (N'Production Supervisor'), (N'PROJECT น.ศ.'),
 (N'QA'), (N'QA&QC'), (N'QA&QC LINE'), (N'QA&QC M-IDL'),
 (N'QC'), (N'QC-DCC'), (N'Q-Grate'), (N'RECEPTION'), (N'Retrofit & Robot M-DL'),
 (N'RPHG'), (N'SAFETY'), (N'SAHP'), (N'SAHP M'), (N'SAITARN WATER'), (N'SCM'),
 (N'SCM M-ADMIN'), (N'SHEET METAL'), (N'Sheet Metal B7 D-DL'), (N'Sheet Metal B7 M-DL'),
 (N'Silk&Assy'), (N'SPRINING'), (N'STORE'), (N'STORE FG'), (N'STORE RM'),
 (N'STORE SAHP'), (N'STORE SHEET'), (N'SUB IRM'), (N'SUB TNK'), (N'SUPPORT'),
 (N'Toolbox - B11 M-DL'), (N'Toolbox - B9 D-DL'), (N'Toolbox - B9 M-DL'),
 (N'Toolbox - Team1 D-DL'), (N'Toolbox - Team1 M-DL'), (N'Toolbox - Team2 D-DL'),
 (N'Toolbox D-DL'), (N'Toolbox M-DL'),
 (N'ช่างปรับฉีด'), (N'ซ่อมบำรุง'), (N'ซิลค์สกรีน'), (N'เติมวัตถุดิบ'), (N'ที่ปรึกษา'),
 (N'ที่ปรึกษา SECURITY'), (N'ผู้รับเหมา'), (N'ผู้รับเหมา B1F5'), (N'ผู้รับเหมา FG'),
 (N'ผู้รับเหมา HEAT'), (N'ผู้รับเหมา PIPE'),
 (N'ผู้รับเหมา Shandong East Power Electric'), (N'ผู้รับเหมา TOOLBOX M-DL'),
 (N'ผู้รับเหมาขับรถส่งของ'), (N'พ่อบ้าน-แม่บ้าน'), (N'แม่บ้าน'), (N'โม่'), (N'ลากงาน'),
 (N'สโตร์สินค้า'), (N'สำนักเลขา');

-- The same names, but as they'd appear once spacing is normalised (used to find
-- old rows that only differ by odd/double spaces).
DECLARE @norm TABLE (id int, name nvarchar(255), norm nvarchar(255));
INSERT INTO @norm (id, name, norm)
SELECT d.id, d.name,
       LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(d.name,
         NCHAR(160), N' '), NCHAR(9), N' '),
         N'  ', N' ' + NCHAR(7)), NCHAR(7) + N' ', N''), NCHAR(7), N''), NCHAR(13), N'')))
FROM dbo.Department d;

BEGIN TRAN;

-- 1) add the missing ones -----------------------------------------------------
INSERT INTO dbo.Department (name, isApproverDept, isAdminDept, isActive, createdAt, updatedAt)
SELECT DISTINCT n.name, 0, 0, 1, SYSUTCDATETIME(), SYSUTCDATETIME()
FROM @new n
WHERE NOT EXISTS (SELECT 1 FROM dbo.Department d WHERE d.name = n.name)
  AND NOT EXISTS (SELECT 1 FROM @norm x WHERE x.norm = n.name);
PRINT CONCAT('1) added: ', @@ROWCOUNT);

-- 2) old rows that are the same name written differently -> re-point + delete --
-- (keep = the row whose name is exactly the listed one, or the first of them)
DECLARE @map TABLE (oldId int PRIMARY KEY, newId int);
INSERT INTO @map (oldId, newId)
SELECT x.id, k.id
FROM @norm x
JOIN @new n ON n.name = x.norm
CROSS APPLY (
  SELECT TOP 1 d.id FROM dbo.Department d
  WHERE d.name = n.name
  ORDER BY d.id
) k
WHERE x.id <> k.id;

-- If the listed spelling doesn't exist as a row yet (only the odd-spaced one
-- does), rename that row to the listed spelling instead of orphaning it.
UPDATE d SET d.name = n.name, d.updatedAt = SYSUTCDATETIME()
FROM dbo.Department d
JOIN @norm x ON x.id = d.id
JOIN @new n ON n.name = x.norm
WHERE d.name <> n.name
  AND NOT EXISTS (SELECT 1 FROM dbo.Department e WHERE e.name = n.name);

UPDATE u SET u.departmentId = m.newId FROM dbo.[User] u JOIN @map m ON m.oldId = u.departmentId;
PRINT CONCAT('2) users re-pointed: ', @@ROWCOUNT);
UPDATE t SET t.departmentId = m.newId FROM dbo.Trip t JOIN @map m ON m.oldId = t.departmentId;
PRINT CONCAT('2) trips re-pointed: ', @@ROWCOUNT);
UPDATE r SET r.departmentId = m.newId FROM dbo.DriverDetail r JOIN @map m ON m.oldId = r.departmentId;
PRINT CONCAT('2) drivers re-pointed: ', @@ROWCOUNT);
DELETE d FROM dbo.Department d JOIN @map m ON m.oldId = d.id;
PRINT CONCAT('2) duplicate rows removed: ', @@ROWCOUNT);

-- 2b) placeholder departments ('-', 'Unknown', ...) are not real departments.
-- Users on them get NO department for now; the real one is filled from AD the
-- first time they sign in. (Trips can't be cleared like this — Trip requires a
-- department — so a placeholder still used by a trip is left alone and shows
-- up in step 4.)
UPDATE u SET u.departmentId = NULL
FROM dbo.[User] u
JOIN dbo.Department d ON d.id = u.departmentId
WHERE LTRIM(RTRIM(d.name)) IN (N'-', N'Unknown', N'default', N'N''Unknown''')
  AND NOT EXISTS (SELECT 1 FROM @new n WHERE n.name = d.name);
PRINT CONCAT('2b) users moved off placeholder departments: ', @@ROWCOUNT);

-- 3) delete old departments that are not in the list and are unused -----------
DELETE d
FROM dbo.Department d
WHERE NOT EXISTS (SELECT 1 FROM @new n WHERE n.name = d.name)
  AND NOT EXISTS (SELECT 1 FROM dbo.[User]       u WHERE u.departmentId = d.id)
  AND NOT EXISTS (SELECT 1 FROM dbo.Trip         t WHERE t.departmentId = d.id)
  AND NOT EXISTS (SELECT 1 FROM dbo.DriverDetail r WHERE r.departmentId = d.id);
PRINT CONCAT('3) unused old departments deleted: ', @@ROWCOUNT);

-- 4) NOT in the list but still in use: kept, needs a decision ------------------
SELECT d.id, d.name AS [not in list — still in use],
       (SELECT COUNT(*) FROM dbo.[User]       u WHERE u.departmentId = d.id) AS users,
       (SELECT COUNT(*) FROM dbo.Trip         t WHERE t.departmentId = d.id) AS trips,
       (SELECT COUNT(*) FROM dbo.DriverDetail r WHERE r.departmentId = d.id) AS drivers
FROM dbo.Department d
WHERE NOT EXISTS (SELECT 1 FROM @new n WHERE n.name = d.name)
ORDER BY d.name;

SELECT COUNT(*) AS [departments after] FROM dbo.Department;

IF @DryRun = 1
BEGIN
  ROLLBACK;
  PRINT '*** DRY RUN — everything rolled back. Set @DryRun = 0 to apply. ***';
END
ELSE
BEGIN
  COMMIT;
  PRINT 'Applied.';
END
