-- prisma/check-departments.sql
--
-- READ-ONLY. Compares the departments actually used in the old data against the
-- official list (from SAP), WITHOUT needing access to the SNC-SAP database.
-- Run the whole file in SSMS on the TRAVEL_DETAIL database.
--   "NOT IN LIST"      = value that doesn't match any official department
--   "spacing differs"  = same name but with extra / odd spaces

SET NOCOUNT ON;

IF OBJECT_ID('tempdb..#sap') IS NOT NULL DROP TABLE #sap;
CREATE TABLE #sap (name nvarchar(255) COLLATE DATABASE_DEFAULT NOT NULL);
INSERT INTO #sap (name) VALUES
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

-- 1) Departments used by old trips
SELECT
  t.[DEPARTMENT]                                        AS raw_value,
  x.dept                                          AS cleaned,
  COUNT(*)                                        AS trips,
  CASE WHEN s.name IS NULL THEN N'NOT IN LIST' ELSE N'ok' END          AS vs_list,
  CASE WHEN DATALENGTH(t.[DEPARTMENT]) <> DATALENGTH(x.dept)
       THEN N'spacing differs' ELSE N'' END                            AS spacing
FROM [TRAVEL_DETAIL].[dbo].[TRAVEL_DETAIL] t
CROSS APPLY (SELECT LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.[DEPARTMENT], NCHAR(160), N' '), NCHAR(9), N' '), N'  ', N' ' + NCHAR(7)), NCHAR(7) + N' ', N''), NCHAR(7), N''))) AS dept) x
LEFT JOIN #sap s ON s.name = x.dept COLLATE DATABASE_DEFAULT
GROUP BY t.[DEPARTMENT], x.dept, s.name
ORDER BY (CASE WHEN s.name IS NULL THEN 0 ELSE 1 END), COUNT(*) DESC;


-- 2) Departments of old users
SELECT
  t.[DEPARTMENT]                                        AS raw_value,
  x.dept                                          AS cleaned,
  COUNT(*)                                        AS users,
  CASE WHEN s.name IS NULL THEN N'NOT IN LIST' ELSE N'ok' END          AS vs_list,
  CASE WHEN DATALENGTH(t.[DEPARTMENT]) <> DATALENGTH(x.dept)
       THEN N'spacing differs' ELSE N'' END                            AS spacing
FROM [TRAVEL_DETAIL].[dbo].[TV_USERNAME] t
CROSS APPLY (SELECT LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(t.[DEPARTMENT], NCHAR(160), N' '), NCHAR(9), N' '), N'  ', N' ' + NCHAR(7)), NCHAR(7) + N' ', N''), NCHAR(7), N''))) AS dept) x
LEFT JOIN #sap s ON s.name = x.dept COLLATE DATABASE_DEFAULT
WHERE t.[DELETED_AT] IS NULL
GROUP BY t.[DEPARTMENT], x.dept, s.name
ORDER BY (CASE WHEN s.name IS NULL THEN 0 ELSE 1 END), COUNT(*) DESC;

-- 3) Department table in the new schema, with how many rows use each
SELECT d.id, d.name,
       CASE WHEN s.name IS NULL THEN N'NOT IN LIST' ELSE N'ok' END AS vs_list,
       (SELECT COUNT(*) FROM [TRAVEL_DETAIL].[dbo].[User]         u WHERE u.departmentId = d.id) AS users,
       (SELECT COUNT(*) FROM [TRAVEL_DETAIL].[dbo].[Trip]         t WHERE t.departmentId = d.id) AS trips,
       (SELECT COUNT(*) FROM [TRAVEL_DETAIL].[dbo].[DriverDetail] r WHERE r.departmentId = d.id) AS drivers
FROM [TRAVEL_DETAIL].[dbo].[Department] d
LEFT JOIN #sap s ON s.name = d.name COLLATE DATABASE_DEFAULT
ORDER BY (CASE WHEN s.name IS NULL THEN 0 ELSE 1 END), d.name;

DROP TABLE #sap;
