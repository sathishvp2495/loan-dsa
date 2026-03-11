import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/auth.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new ApiError(401, "Unauthorized"));
  }

  const token = authorization.replace("Bearer ", "").trim();

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }

    return next();
  };
}
