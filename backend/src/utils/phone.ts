export function normalizePhone(value?: string | null) {
  if (!value) return undefined;

  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;

  if (value.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}
