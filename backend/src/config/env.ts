import { z } from "zod";
import { logger } from "../lib/logger.js";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.string().default("6450"),
  DB_NAME: z.string().default("line_chat_app"),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  NEON_BD_URL: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(parsed.error);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim(),
).filter(Boolean);
