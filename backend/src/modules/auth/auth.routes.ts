import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/async-handler.js";
import { login } from "./auth.service.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const result = await login(payload.email, payload.password);

    return res.status(200).json(result);
  })
);

export const authRouter = router;
