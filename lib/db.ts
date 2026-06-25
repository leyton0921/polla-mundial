import { Pool } from "pg"

// Single shared connection pool for the whole app.
const globalForDb = globalThis as unknown as { pool?: Pool }

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export async function query<T = any>(
  text: string,
  params: any[] = [],
): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}
