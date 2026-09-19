import "dotenv/config";
import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

export const pool = new Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,

  max: 10, // max connections
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// 🔥 Catch unexpected pool errors
pool.on("error", (err) => {
  logger.error("Unexpected Postgres pool error", err);
  process.exit(1);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function assertDataBaseConnection() {
  try {
    await pool.query("SELECT 1;");
    logger.info("Connected to Postgres");
  } catch (error) {
    logger.error("Failed to connect to Postgres", error);
    throw error;
  }
}
