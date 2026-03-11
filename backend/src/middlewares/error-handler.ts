import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";
import { logger } from "../config/logger.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details ?? null
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: error.issues[0]?.message ?? "Validation error",
      details: error.flatten()
    });
  }

  logger.error(error);
  return res.status(500).json({
    message: "Internal server error"
  });
}
