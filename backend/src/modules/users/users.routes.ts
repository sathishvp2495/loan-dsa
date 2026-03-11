import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router = Router();

router.get(
  "/agents",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const agents = await prisma.user.findMany({
      where: {
        role: {
          in: ["AGENT", "OPERATIONS"]
        },
        isActive: true
      },
      orderBy: {
        fullName: "asc"
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true
      }
    });

    return res.json({ agents });
  })
);

export const usersRouter = router;
