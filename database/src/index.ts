import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";

const { Pool } = pg;

export * from "./schema/index";

let pool: pg.Pool | null = null;

export function getDbPool(connectionString?: string) {
  if (!pool) {
    const conn = connectionString || process.env.DATABASE_URL;
    pool = new Pool({
      connectionString: conn,
    });
  }
  return pool;
}

export function createDbClient(connectionString?: string) {
  const p = getDbPool(connectionString);
  return drizzle(p, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
