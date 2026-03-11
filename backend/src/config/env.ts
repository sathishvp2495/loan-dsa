import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ADMIN_SEED_EMAIL: z.string().email().default("admin@loandsa.local"),
  ADMIN_SEED_PASSWORD: z.string().min(8).default("Admin@12345"),
  AGENT_SEED_EMAIL: z.string().email().default("agent@loandsa.local"),
  AGENT_SEED_PASSWORD: z.string().min(8).default("Agent@12345"),
  ADD_ON_PERCENT: z.coerce.number().min(0).max(100).optional(),
  PARTNER_SHARE_PERCENT: z.coerce.number().min(0).max(100).default(40),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  TWILIO_STATUS_CALLBACK_URL: z.string().optional(),
  TWILIO_WHATSAPP_LEAD_TEMPLATE_SID: z.string().optional(),
  TWILIO_WHATSAPP_STATUS_TEMPLATE_SID: z.string().optional()
});

export const env = envSchema.parse(process.env);
