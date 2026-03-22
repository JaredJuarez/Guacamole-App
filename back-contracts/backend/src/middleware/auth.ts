import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error.js";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: number;
    email: string;
    role: string;
  };
};

export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing bearer token"));
    return;
  }

  const payload = verifyAccessToken(header.slice("Bearer ".length));
  req.auth = {
    userId: Number(payload.sub),
    email: payload.email,
    role: payload.role
  };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }

    if (!roles.includes(req.auth.role)) {
      next(new HttpError(403, "Forbidden"));
      return;
    }

    next();
  };
}

