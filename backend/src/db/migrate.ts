import path from "node:path";
import fs from "node:fs";
import { logger } from "../lib/logger.js";
import { query } from "./db.js";

const migrateDir = path.resolve(process.cwd(), "src", "migrations");

async function runMigrations() {
  logger.info(`Looking for migrations in ${migrateDir}`);

  const files = fs
    .readdirSync(migrateDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    logger.info(`No migrations found`);
    return;
  }

  for (const file of files) {
    const fullPath = path.join(migrateDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");

    logger.info(`Running migrations`);

    await query(sql);

    logger.info(`Finished Migrations`);
  }
}

runMigrations()
  .then(() => {
    logger.info("All migrations run successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Migrations failed ${(err as Error).message}`);
    process.exit(1);
  });
