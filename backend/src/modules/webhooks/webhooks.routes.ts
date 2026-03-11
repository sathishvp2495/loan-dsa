import { Router, urlencoded } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { normalizePhone } from "../../utils/phone.js";
import { asyncHandler } from "../../utils/async-handler.js";

const router = Router();

router.post(
  "/whatsapp",
  urlencoded({ extended: false }),
  asyncHandler(async (req, res) => {
    const payload = req.body as Record<string, string>;
    const from = normalizePhone(payload.From?.replace("whatsapp:", ""));
    const to = normalizePhone(payload.To?.replace("whatsapp:", ""));
    const body = payload.Body ?? "";
    const providerMessageId = payload.MessageSid ?? null;

    const lead = from
      ? await prisma.lead.findFirst({
          where: {
            OR: [{ phone: from }, { whatsappPhone: from }]
          }
        })
      : null;

    await prisma.customerMessage.create({
      data: {
        leadId: lead?.id,
        direction: "INBOUND",
        channel: "WHATSAPP",
        providerMessageId,
        body,
        status: "received",
        fromIdentity: from,
        toIdentity: to,
        payload: payload as Prisma.InputJsonValue
      }
    });

    if (lead && body) {
      await prisma.leadNote.create({
        data: {
          leadId: lead.id,
          body: `WhatsApp inbound from customer: ${body}`,
          systemGenerated: true
        }
      });
    }

    res.type("text/xml");
    return res.send("<Response></Response>");
  })
);

router.post(
  "/status",
  urlencoded({ extended: false }),
  asyncHandler(async (req, res) => {
    const payload = req.body as Record<string, string>;
    const providerMessageId = payload.MessageSid ?? null;
    const status = payload.MessageStatus ?? "unknown";

    if (providerMessageId) {
      const existing = await prisma.customerMessage.findFirst({
        where: {
          providerMessageId
        }
      });

      if (existing) {
        await prisma.customerMessage.update({
          where: { id: existing.id },
          data: {
            status,
            payload: payload as Prisma.InputJsonValue
          }
        });
      } else {
        await prisma.customerMessage.create({
          data: {
            direction: "OUTBOUND",
            channel: "WHATSAPP",
            providerMessageId,
            status,
            fromIdentity: payload.From?.replace("whatsapp:", ""),
            toIdentity: payload.To?.replace("whatsapp:", ""),
            payload: payload as Prisma.InputJsonValue
          }
        });
      }
    }

    return res.status(200).json({ received: true });
  })
);

export const webhooksRouter = router;
