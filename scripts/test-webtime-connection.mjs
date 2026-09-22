// scripts/test-webtime-connection.js
import fs from 'fs';
import path from 'path';
import sql from 'mssql';

// Minimal .env(.local) loader: KEY=VALUE per line, '#'-comments only when not
// inside quotes, optional single/double quotes around the value. Values
// already set in process.env win (doesn't override real env vars).
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

// Never print the real value — just enough to spot copy-paste damage
// (stray ';', quotes, whitespace) without revealing the secret itself.
function mask(label, value) {
  const leading = /^\s/.test(value);
  const trailing = /\s$/.test(value);
  const suspicious = /[;"'\\]/.exec(value);
  const flags = [];
  if (leading) flags.push('has LEADING whitespace');
  if (trailing) flags.push('has TRAILING whitespace');
  if (suspicious)
    flags.push(`contains "${suspicious[0]}" — often a copy-paste artifact`);

  console.log(
    `${label}: length ${value.length}, starts "${value[0]}", ends "${value[value.length - 1]}"` +
      (flags.length ? `  ⚠️  ${flags.join('; ')}` : '')
  );
}

async function main() {
  const rawHost = required('WEBTIME_DB_HOST');
  const port = Number(process.env.WEBTIME_DB_PORT || 1433);
  const database = required('WEBTIME_DB_NAME');
  const user = required('WEBTIME_DB_USER');
  const password = required('WEBTIME_DB_PASSWORD');
  const encrypt = process.env.WEBTIME_DB_ENCRYPT !== 'false';

  // Split "host\instance" the same way SSMS's "Server name" box does, in case
  // WEBTIME_DB_HOST was given without the instance part.
  let serverHost = rawHost;
  let instanceName = process.env.WEBTIME_DB_INSTANCE;
  if (rawHost.includes('\\')) {
    const parts = rawHost.split('\\');
    serverHost = parts[0];
    instanceName = parts[1];
  }

  console.log('--- Loaded config (all values masked) ---');
  mask('host', serverHost);
  if (instanceName) mask('instance', instanceName);
  console.log('port:', port, Number.isInteger(port) ? '' : '⚠️  not a number');
  mask('database', database);
  mask('user', user);
  mask('password', password);
  console.log('encrypt:', encrypt);
  console.log('-------------------------------------------');

  const pool = new sql.ConnectionPool({
    server: serverHost,
    port,
    database,
    user,
    password,
    options: {
      encrypt,
      trustServerCertificate: true,
      enableArithAbort: true,
      ...(instanceName ? { instanceName } : {}),
    },
    connectionTimeout: 10_000,
  });

  try {
    await pool.connect();
    console.log('✅ Connected successfully.');

    const who = await pool
      .request()
      .query('SELECT SYSTEM_USER AS whoami, DB_NAME() AS db, @@SERVERNAME AS server_name');
    console.log('Connected as:', who.recordset[0]);

    // Never returns real data — the condition can't match anyone.
    const probe = await pool
      .request()
      .query(
        "SELECT COUNT(*) AS n FROM cyberhrm.dbo.PNT_Person WHERE PersonCode = '__connection_test__'"
      );
    console.log('Query against PNT_Person succeeded, rows:', probe.recordset[0].n);
  } catch (err) {
    console.error('❌ Connection or query failed:');
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.close().catch(() => {});
  }
}

main();
