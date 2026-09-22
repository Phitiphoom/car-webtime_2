import sql from 'mssql';
import { env } from '@/env';
import { logger } from '@/lib/logger';

export interface WebtimeUser {
  personCode: string;
  name: string;
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function config(): sql.config {
  return {
    server: env.WEBTIME_DB_HOST,
    port: env.WEBTIME_DB_PORT,
    database: env.WEBTIME_DB_NAME,
    user: env.WEBTIME_DB_USER,
    password: env.WEBTIME_DB_PASSWORD,
    options: {
      encrypt: env.WEBTIME_DB_ENCRYPT,
      trustServerCertificate: true,
    },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
  };
}

async function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config()).connect().catch((err) => {
      poolPromise = null; // let the next call retry instead of caching a dead connection
      throw err;
    });
  }
  return poolPromise;
}

export class WebtimeService {
  static async authenticate(
    username: string,
    password: string
  ): Promise<WebtimeUser | null> {
    if (!username || !password) return null;

    if (env.BYPASS_WEBTIME) {
      logger.warn(
        'BYPASS_WEBTIME is active — accepting any credentials (dev only)'
      );
      return { personCode: username, name: username };
    }

    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input('username', sql.VarChar, username)
        .input('password', sql.VarChar, password).query(`
          SELECT A.PersonCode AS personCode, A.FnameT + ' ' + A.LnameT AS name
          FROM cyberhrm.dbo.PNT_Person AS A
          LEFT OUTER JOIN cyberhrm.dbo.ADM_UserPws AS B ON A.PERSONID = B.PERSONID
          WHERE A.ChkDeletePerson = 1 AND A.ResignStatus = 1
            AND A.PersonCode = @username
            AND B.Pws COLLATE THAI_CS_AS = @password
        `);

      const row = result.recordset[0] as
        | { personCode: string; name: string | null }
        | undefined;
      if (!row) return null;

      return { personCode: row.personCode, name: (row.name ?? '').trim() };
    } catch (err) {
      logger.error({ err }, 'Webtime authentication query failed');
      return null;
    }
  }
}
