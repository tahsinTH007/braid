import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { UnauthorizedError } from "../lib/errors.js";

export function requireAuthApi(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);

  if (!auth.userId) {
    return next(
      new UnauthorizedError("You must be signed in to access this resource."),
    );
  }

  return next();
}
