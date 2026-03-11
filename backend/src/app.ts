import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { docsRouter } from "./modules/docs/docs.routes.js";
import { leadsRouter } from "./modules/leads/leads.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { webhooksRouter } from "./modules/webhooks/webhooks.routes.js";
import { notFoundMiddleware } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";

export const app = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((item) => item.trim()),
    credentials: true
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (_req, res) => {
  return res.json({
    status: "ok",
    environment: env.NODE_ENV
  });
});

app.use("/api/v1/webhooks/twilio", webhooksRouter);
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/docs", docsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/leads", leadsRouter);
app.use("/api/v1/users", usersRouter);

app.use(notFoundMiddleware);
app.use(errorHandler);
