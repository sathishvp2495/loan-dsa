import { LeadStage, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { normalizePhone } from "../../utils/phone.js";
import { env } from "../../config/env.js";
import { sendWhatsappTemplate, sendWhatsappText } from "../whatsapp/whatsapp.service.js";

type CreatePublicLeadInput = {
  fullName: string;
  phone: string;
  whatsappPhone?: string;
  city: string;
  loanType: any;
  employmentType: any;
  monthlyIncome: number;
  requestedAmount: number;
  source: any;
  whatsappOptIn: boolean;
  notes?: string;
};

type UpdateStageInput = {
  leadId: string;
  stage: LeadStage;
  reason?: string;
  changedById?: string;
};

const MAX_REFERENCE_GENERATION_ATTEMPTS = 5;

function buildLoanIdPrefix(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `LN-${year}-${month}-`;
}

async function generateLoanId(tx: Prisma.TransactionClient, date: Date = new Date()) {
  const prefix = buildLoanIdPrefix(date);

  const latestLeadInMonth = await tx.lead.findFirst({
    where: {
      referenceCode: {
        startsWith: prefix
      }
    },
    orderBy: {
      referenceCode: "desc"
    },
    select: {
      referenceCode: true
    }
  });

  const currentSequence = latestLeadInMonth?.referenceCode.slice(prefix.length) ?? "";
  const nextSequence =
    /^\d+$/.test(currentSequence) && Number.parseInt(currentSequence, 10) > 0
      ? Number.parseInt(currentSequence, 10) + 1
      : 1;

  return `${prefix}${String(nextSequence).padStart(3, "0")}`;
}

function isReferenceCodeUniqueError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const targets = Array.isArray(error.meta?.target)
    ? error.meta.target.map(String)
    : [String(error.meta?.target ?? "")];

  return targets.some((target) => target.toLowerCase().includes("referencecode"));
}

export async function createPublicLead(input: CreatePublicLeadInput, assignedAgentId?: string) {
  const phone = normalizePhone(input.phone);
  const whatsappPhone = normalizePhone(input.whatsappPhone) ?? phone;

  if (!phone) {
    throw new ApiError(400, "Valid phone number is required");
  }

  let lead: Awaited<ReturnType<typeof prisma.lead.create>> | null = null;

  for (let attempt = 1; attempt <= MAX_REFERENCE_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      lead = await prisma.$transaction(async (tx) => {
        const referenceCode = await generateLoanId(tx);

        const createdLead = await tx.lead.create({
          data: {
            referenceCode,
            fullName: input.fullName,
            phone,
            whatsappPhone,
            city: input.city,
            loanType: input.loanType,
            employmentType: input.employmentType,
            monthlyIncome: input.monthlyIncome,
            requestedAmount: input.requestedAmount,
            source: input.source,
            whatsappOptIn: input.whatsappOptIn,
            assignedAgentId
          }
        });

        await tx.leadStatusHistory.create({
          data: {
            leadId: createdLead.id,
            nextStage: "NEW_LEAD",
            reason: "Lead created"
          }
        });

        if (input.notes) {
          await tx.leadNote.create({
            data: {
              leadId: createdLead.id,
              body: input.notes,
              systemGenerated: false
            }
          });
        }

        return createdLead;
      });

      break;
    } catch (error) {
      if (attempt < MAX_REFERENCE_GENERATION_ATTEMPTS && isReferenceCodeUniqueError(error)) {
        continue;
      }

      throw error;
    }
  }

  if (!lead) {
    throw new ApiError(500, "Unable to generate loan ID");
  }

  if (lead.whatsappOptIn && env.TWILIO_WHATSAPP_LEAD_TEMPLATE_SID) {
    const result = await sendWhatsappTemplate({
      to: lead.whatsappPhone ?? lead.phone,
      templateSid: env.TWILIO_WHATSAPP_LEAD_TEMPLATE_SID,
      templateVariables: {
        "1": lead.fullName,
        "2": lead.referenceCode,
        "3": lead.loanType
      }
    });

    await prisma.customerMessage.create({
      data: {
        leadId: lead.id,
        direction: "OUTBOUND",
        channel: "WHATSAPP",
        providerMessageId: "sid" in result ? result.sid : null,
        templateName: env.TWILIO_WHATSAPP_LEAD_TEMPLATE_SID,
        body: result.skipped ? "Lead template skipped because WhatsApp is not configured" : "Lead received template sent",
        status: "status" in result ? result.status : "skipped",
        fromIdentity: env.TWILIO_WHATSAPP_FROM ?? null,
        toIdentity: lead.whatsappPhone ?? lead.phone,
        payload: result as Prisma.InputJsonValue
      }
    });
  }

  return lead;
}

export async function listLeads(filters: {
  stage?: LeadStage;
  search?: string;
  assignedAgentId?: string;
}) {
  return prisma.lead.findMany({
    where: {
      stage: filters.stage,
      assignedAgentId: filters.assignedAgentId,
      ...(filters.search
        ? {
            OR: [
              { fullName: { contains: filters.search, mode: "insensitive" } },
              { phone: { contains: filters.search } },
              { city: { contains: filters.search, mode: "insensitive" } },
              { referenceCode: { contains: filters.search, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      assignedAgent: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      },
      commission: true
    }
  });
}

export async function getLeadById(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedAgent: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      },
      notes: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      },
      statusHistory: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          changedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true
            }
          }
        }
      },
      commission: true,
      messages: {
        orderBy: {
          createdAt: "desc"
        },
        take: 20
      }
    }
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  return lead;
}

export async function updateLeadStage(input: UpdateStageInput) {
  const currentLead = await prisma.lead.findUnique({
    where: { id: input.leadId }
  });

  if (!currentLead) {
    throw new ApiError(404, "Lead not found");
  }

  const updatedLead = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.update({
      where: { id: input.leadId },
      data: {
        stage: input.stage,
        lastContactedAt:
          input.stage === "CONTACT_ATTEMPTED" || input.stage === "CONTACTED"
            ? new Date()
            : currentLead.lastContactedAt
      }
    });

    await tx.leadStatusHistory.create({
      data: {
        leadId: input.leadId,
        previousStage: currentLead.stage,
        nextStage: input.stage,
        changedById: input.changedById,
        reason: input.reason
      }
    });

    return lead;
  });

  if (updatedLead.whatsappOptIn && env.TWILIO_WHATSAPP_STATUS_TEMPLATE_SID) {
    const result = await sendWhatsappTemplate({
      to: updatedLead.whatsappPhone ?? updatedLead.phone,
      templateSid: env.TWILIO_WHATSAPP_STATUS_TEMPLATE_SID,
      templateVariables: {
        "1": updatedLead.fullName,
        "2": updatedLead.referenceCode,
        "3": input.stage
      }
    });

    await prisma.customerMessage.create({
      data: {
        leadId: updatedLead.id,
        direction: "OUTBOUND",
        channel: "WHATSAPP",
        providerMessageId: "sid" in result ? result.sid : null,
        templateName: env.TWILIO_WHATSAPP_STATUS_TEMPLATE_SID,
        body: result.skipped ? "Status template skipped because WhatsApp is not configured" : `Stage update template sent: ${input.stage}`,
        status: "status" in result ? result.status : "skipped",
        fromIdentity: env.TWILIO_WHATSAPP_FROM ?? null,
        toIdentity: updatedLead.whatsappPhone ?? updatedLead.phone,
        payload: result as Prisma.InputJsonValue
      }
    });
  }

  return getLeadById(updatedLead.id);
}

export async function assignLead(leadId: string, assignedAgentId: string | null, changedById?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  const assignedUser = assignedAgentId
    ? await prisma.user.findUnique({
        where: { id: assignedAgentId }
      })
    : null;

  if (assignedAgentId && !assignedUser) {
    throw new ApiError(404, "Agent not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: {
        assignedAgentId
      }
    });

    await tx.leadNote.create({
      data: {
        leadId,
        userId: changedById,
        body: assignedAgentId
          ? `Lead assigned to ${assignedUser?.fullName ?? "agent"}`
          : "Lead assignment cleared",
        systemGenerated: true
      }
    });
  });

  return getLeadById(leadId);
}

export async function addLeadNote(leadId: string, body: string, userId?: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  await prisma.leadNote.create({
    data: {
      leadId,
      userId,
      body
    }
  });

  return getLeadById(leadId);
}

export async function upsertCommission(
  leadId: string,
  input: {
    lenderName: string;
    disbursedAmount: number;
    payoutPercent: number;
    addOnPercent?: number;
    partnerSharePercent?: number;
  }
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  const payoutPercent = Number(input.payoutPercent);
  const lenderName = input.lenderName.trim();
  const addOnPercent = Number(
    input.addOnPercent ?? input.partnerSharePercent ?? env.ADD_ON_PERCENT ?? env.PARTNER_SHARE_PERCENT
  );
  const totalCommission = Number(((input.disbursedAmount * payoutPercent) / 100).toFixed(2));
  const addOnAmount = Number(((input.disbursedAmount * addOnPercent) / 100).toFixed(2));
  const overallAmount = Number((totalCommission + addOnAmount).toFixed(2));

  await prisma.commission.upsert({
    where: { leadId },
    update: {
      lenderName,
      disbursedAmount: input.disbursedAmount,
      payoutPercent,
      totalCommission,
      partnerSharePercent: addOnPercent,
      partnerShareAmount: overallAmount
    },
    create: {
      leadId,
      lenderName,
      disbursedAmount: input.disbursedAmount,
      payoutPercent,
      totalCommission,
      partnerSharePercent: addOnPercent,
      partnerShareAmount: overallAmount
    }
  });

  return getLeadById(leadId);
}

export async function sendManualWhatsappMessage(
  leadId: string,
  payload: { body?: string; templateSid?: string; templateVariables?: Record<string, string> }
) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new ApiError(404, "Lead not found");
  }

  const to = lead.whatsappPhone ?? lead.phone;

  const result = payload.templateSid
    ? await sendWhatsappTemplate({
        to,
        templateSid: payload.templateSid,
        templateVariables: payload.templateVariables
      })
    : await sendWhatsappText({
        to,
        body: payload.body as string
      });

  await prisma.customerMessage.create({
    data: {
      leadId,
      direction: "OUTBOUND",
      channel: "WHATSAPP",
      providerMessageId: "sid" in result ? result.sid : null,
      templateName: payload.templateSid,
      body: payload.body ?? `Template message sent: ${payload.templateSid}`,
      status: "status" in result ? result.status : "skipped",
      fromIdentity: env.TWILIO_WHATSAPP_FROM ?? null,
      toIdentity: to,
      payload: result as Prisma.InputJsonValue
    }
  });

  return {
    leadId,
    result
  };
}
