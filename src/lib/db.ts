import { Pool, QueryResult } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
});

export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  return pool.query(text, params);
}

export async function safeQuery(text: string, params?: unknown[]): Promise<QueryResult | null> {
  try {
    return await pool.query(text, params);
  } catch {
    return null;
  }
}

export default pool;
