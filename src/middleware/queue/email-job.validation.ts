import type { SendEmailJobPayload } from '../types/email.types';

const EMAIL_TEMPLATE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
const EMAIL_RECIPIENT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 25;
const MAX_SUBJECT_LENGTH = 200;
const MAX_CONTEXT_BYTES = 16 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidRecipient(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const email = value.trim();
  return (
    email.length > 0 &&
    email.length <= 254 &&
    EMAIL_RECIPIENT_PATTERN.test(email)
  );
}

function hasSafeContextSize(context: unknown): boolean {
  if (context === undefined) {
    return true;
  }

  if (!isRecord(context)) {
    return false;
  }

  try {
    return (
      Buffer.byteLength(JSON.stringify(context), 'utf8') <= MAX_CONTEXT_BYTES
    );
  } catch {
    return false;
  }
}

function hasValidRecipients(to: unknown): boolean {
  if (typeof to === 'string') {
    return isValidRecipient(to);
  }

  if (!Array.isArray(to) || to.length === 0 || to.length > MAX_RECIPIENTS) {
    return false;
  }

  return to.every((recipient) => isValidRecipient(recipient));
}

export function isValidSendEmailJobPayload(
  payload: unknown,
): payload is SendEmailJobPayload {
  if (!isRecord(payload)) {
    return false;
  }

  const subject =
    typeof payload.subject === 'string' ? payload.subject.trim() : undefined;
  const template =
    typeof payload.template === 'string' ? payload.template.trim() : undefined;

  if (!hasValidRecipients(payload.to)) {
    return false;
  }

  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    return false;
  }

  if (!template || !EMAIL_TEMPLATE_PATTERN.test(template)) {
    return false;
  }

  return hasSafeContextSize(payload.context);
}
