import express from "express";
import corsPkg from "cors";
import helmetPkg from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { corsOrigins } from "./config/env.js";
import path from "node:path";

// Some build pipelines (Vercel's TS check among them) resolve these
// packages' CJS default export as a namespace object instead of the
// callable function, even though esModuleInterop makes it work locally.
// Unwrap defensively so it works either way.
const cors = ((corsPkg as unknown as { default?: typeof corsPkg }).default ??
  corsPkg) as typeof corsPkg;
const helmet = ((helmetPkg as unknown as { default?: typeof helmetPkg })
  .default ?? helmetPkg) as typeof helmetPkg;

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads")),
  );
  app.use(clerkMiddleware());

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
