// scripts/inspect-webtime-schema.js
//
// Read-only: lists the COLUMN NAMES (and types) of the Webtime tables our
// login query touches, so we can see what data is actually available beyond
// PersonCode/name. Prints schema metadata only — never row data, so it's
// safe to paste the output back.
import fs from 'fs';
import path from 'path';
import sql from 'mssql';

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const quoted = /^"(.*)"$/.exec(value) || /^'(.*)'$/.exec(value);
    if (quoted) {
      value = quoted[1];
    } else {
      const hash = value.indexOf('#');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadDotEnv(path.join(process.cwd(), '.env.local'));
loadDotEnv(path.join(process.cwd(), '.env'));

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing ${name} — is .env.local loaded?`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const rawHost = required('WEBTIME_DB_HOST');
  const port = Number(process.env.WEBTIME_DB_PORT || 1433);
  const database = required('WEBTIME_DB_NAME');
  const user = required('WEBTIME_DB_USER');
  const password = required('WEBTIME_DB_PASSWORD');
  const encrypt = process.env.WEBTIME_DB_ENCRYPT !== 'false';

  let serverHost = rawHost;
  let instanceName = process.env.WEBTIME_DB_INSTANCE;
  if (rawHost.includes('\\')) {
    [serverHost, instanceName] = rawHost.split('\\');
  }

  const pool = new sql.ConnectionPool({
    server: serverHost,
    port,
    database,
    user,
    password,
    options: {
      encrypt,
      trustServerCertificate: true,
      ...(instanceName ? { instanceName } : {}),
    },
    connectionTimeout: 10_000,
  });

  await pool.connect();

  for (const table of ['PNT_Person', 'ADM_UserPws']) {
    console.log(`\n=== cyberhrm.dbo.${table} ===`);
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM cyberhrm.INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = '${table}'
      ORDER BY ORDINAL_POSITION
    `);
    if (result.recordset.length === 0) {
      console.log('  (no columns found — table name or permissions issue?)');
      continue;
    }
    for (const col of result.recordset) {
      const len = col.CHARACTER_MAXIMUM_LENGTH
        ? `(${col.CHARACTER_MAXIMUM_LENGTH})`
        : '';
      console.log(
        `  ${col.COLUMN_NAME}: ${col.DATA_TYPE}${len} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`
      );
    }
  }

  await pool.close();
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exitCode = 1;
});
