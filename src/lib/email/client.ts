import { Resend } from "resend";

// Lazy init — Resend throws if API key is missing at construction time
export const resend: Resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : (null as unknown as Resend);

export const FROM_EMAIL =
  process.env.EMAIL_FROM ?? "PainCave <noreply@paincave.io>";
