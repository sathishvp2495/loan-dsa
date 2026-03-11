import { EmploymentType, LeadSource, LeadStage, LoanType } from "@prisma/client";
import { z } from "zod";

const optionalPhoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(10, "Please enter at least 10 digits").max(20).optional()
);

export const publicLeadSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(10).max(20),
  whatsappPhone: optionalPhoneSchema,
  city: z.string().min(2).max(80),
  loanType: z.nativeEnum(LoanType),
  employmentType: z.nativeEnum(EmploymentType),
  monthlyIncome: z.coerce.number().int().min(0),
  requestedAmount: z.coerce.number().int().positive(),
  source: z.nativeEnum(LeadSource).optional().default("WEBSITE"),
  whatsappOptIn: z.boolean().optional().default(false),
  notes: z.string().max(1000).optional()
});

export const internalLeadSchema = publicLeadSchema.extend({
  assignedAgentId: z.string().uuid().optional()
});

export const leadListQuerySchema = z.object({
  stage: z.nativeEnum(LeadStage).optional(),
  search: z.string().optional(),
  assignedAgentId: z.string().uuid().optional()
});

export const updateStageSchema = z.object({
  stage: z.nativeEnum(LeadStage),
  reason: z.string().max(500).optional()
});

export const assignLeadSchema = z.object({
  assignedAgentId: z.string().uuid().nullable()
});

export const addNoteSchema = z.object({
  body: z.string().min(1).max(2000)
});

export const commissionSchema = z.object({
  lenderName: z.string().trim().min(1, "Please fill lender name").max(120),
  disbursedAmount: z.coerce.number().int().positive(),
  payoutPercent: z.coerce.number().positive().max(100),
  addOnPercent: z.coerce.number().min(0).max(100).optional(),
  partnerSharePercent: z.coerce.number().min(0).max(100).optional()
});

export const whatsappSendSchema = z.object({
  body: z.string().min(1).max(1000).optional(),
  templateSid: z.string().min(5).optional(),
  templateVariables: z.record(z.string()).optional()
}).refine((value) => value.body || value.templateSid, {
  message: "Either body or templateSid is required"
});
