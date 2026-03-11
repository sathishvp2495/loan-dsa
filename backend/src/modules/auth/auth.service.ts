import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { signAccessToken } from "../../utils/auth.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase()
    }
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  };
}
