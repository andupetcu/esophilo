import { Pool, QueryResult } from "pg";

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5000,
    });
  }
  return _pool;
}

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  return getPool().query(text, params);
}

export async function safeQuery(text: string, params?: unknown[]): Promise<QueryResult | null> {
  try {
    return await getPool().query(text, params);
  } catch {
    return null;
  }
}

export default getPool;
