import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";

type TokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "12h"
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
