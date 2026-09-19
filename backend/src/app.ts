import express, { type RequestHandler } from "express";
import cors from "cors";
import helmetPkg from "helmet";
import type { HelmetOptions } from "helmet";
import { clerkMiddleware } from "@clerk/express";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { corsOrigins } from "./config/env.js";
import path from "node:path";

// helmet's CJS type declarations (index.d.cts) describe an ES-style
// `export default`, but its runtime is `module.exports = helmet`. Some
// TS resolutions (Vercel's build) therefore type the default import as
// the non-callable exports object. Unwrap at runtime and give it an
// explicit callable type that doesn't depend on how the import resolved.
type HelmetFn = (options?: Readonly<HelmetOptions>) => RequestHandler;

const helmet: HelmetFn = (() => {
  const mod = helmetPkg as unknown;
  if (typeof mod === "function") return mod as HelmetFn;
  return (mod as { default: HelmetFn }).default;
})();

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
