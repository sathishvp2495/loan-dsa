import twilio from "twilio";
import { env } from "../../config/env.js";
import { normalizePhone } from "../../utils/phone.js";

type TemplateInput = {
  to: string;
  templateSid: string;
  templateVariables?: Record<string, string>;
};

type TextInput = {
  to: string;
  body: string;
};

const isConfigured = Boolean(
  env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM
);

const client =
  isConfigured && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
    ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
    : null;

export function whatsappEnabled() {
  return Boolean(client && env.TWILIO_WHATSAPP_FROM);
}

export async function sendWhatsappTemplate(input: TemplateInput) {
  if (!client || !env.TWILIO_WHATSAPP_FROM) {
    return {
      skipped: true,
      reason: "Twilio WhatsApp is not configured"
    };
  }

  const message = await client.messages.create({
    from: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${normalizePhone(input.to)}`,
    contentSid: input.templateSid,
    contentVariables: JSON.stringify(input.templateVariables ?? {}),
    statusCallback: env.TWILIO_STATUS_CALLBACK_URL || undefined
  });

  return {
    skipped: false,
    sid: message.sid,
    status: message.status ?? "queued"
  };
}

export async function sendWhatsappText(input: TextInput) {
  if (!client || !env.TWILIO_WHATSAPP_FROM) {
    return {
      skipped: true,
      reason: "Twilio WhatsApp is not configured"
    };
  }

  const message = await client.messages.create({
    from: `whatsapp:${env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${normalizePhone(input.to)}`,
    body: input.body,
    statusCallback: env.TWILIO_STATUS_CALLBACK_URL || undefined
  });

  return {
    skipped: false,
    sid: message.sid,
    status: message.status ?? "queued"
  };
}
