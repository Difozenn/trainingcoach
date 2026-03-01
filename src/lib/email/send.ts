/**
 * Email sending functions using Resend.
 */

import { resend, FROM_EMAIL } from "./client";
import {
  welcomeEmail,
  weeklySummaryEmail,
  overtrainingAlertEmail,
  type WeeklySummaryData,
} from "./templates";

export async function sendWelcomeEmail(to: string, name: string) {
  const { subject, html } = welcomeEmail(name);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendWeeklySummaryEmail(
  to: string,
  data: WeeklySummaryData
) {
  const { subject, html } = weeklySummaryEmail(data);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendOvertrainingAlert(
  to: string,
  name: string,
  tsb: number,
  ctl: number,
  note: string
) {
  const { subject, html } = overtrainingAlertEmail(name, tsb, ctl, note);
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
