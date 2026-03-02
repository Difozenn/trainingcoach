/**
 * Email Templates — Plain HTML
 *
 * Transactional emails for Paincave:
 * - Welcome (on registration)
 * - Weekly training summary (Monday morning)
 * - Overtraining alert (TSB < -30 + declining HRV)
 */

// ── Welcome Email ───────────────────────────────────────────────────

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Welcome to Paincave",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to Paincave${name ? `, ${name}` : ""}</h1>
  <p style="font-size: 16px; line-height: 1.6; color: #444;">
    Your training coach is ready. Here's how to get started:
  </p>
  <ol style="font-size: 15px; line-height: 1.8; color: #444;">
    <li><strong>Connect Strava</strong> — We'll import your history and auto-detect your thresholds (FTP, threshold pace, CSS)</li>
    <li><strong>Check your dashboard</strong> — See your Fitness Timeline (CTL/ATL/TSB) and training zones</li>
    <li><strong>Get your weekly plan</strong> — Every Sunday, we generate a workout pool for the week ahead</li>
  </ol>
  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    Every recommendation is backed by peer-reviewed research. We'll explain the <em>why</em> behind every workout.
  </p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.paincave.io"}"
     style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 12px;">
    Go to Dashboard
  </a>
  <p style="font-size: 13px; color: #888; margin-top: 32px;">
    Paincave provides training and nutrition recommendations based on exercise science research.
    This is not medical or dietary advice.
  </p>
</body>
</html>`,
  };
}

// ── Weekly Summary Email ────────────────────────────────────────────

export type WeeklySummaryData = {
  name: string;
  weekTss: { total: number; cycling: number; running: number; swimming: number };
  targetTss: number | null;
  ctl: number;
  atl: number;
  tsb: number;
  activityCount: number;
  totalDurationMinutes: number;
  upcomingWorkouts: string[];
  coachingNote: string;
};

export function weeklySummaryEmail(data: WeeklySummaryData): {
  subject: string;
  html: string;
} {
  const adherence = data.targetTss
    ? Math.round((data.weekTss.total / data.targetTss) * 100)
    : null;

  const tsbLabel =
    data.tsb > 5
      ? "Fresh"
      : data.tsb > -10
        ? "Neutral"
        : data.tsb > -25
          ? "Absorbing training"
          : "Fatigued";

  const hours = Math.floor(data.totalDurationMinutes / 60);
  const mins = data.totalDurationMinutes % 60;

  return {
    subject: `Week in review: ${Math.round(data.weekTss.total)} TSS across ${data.activityCount} activities`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="font-size: 22px; margin-bottom: 4px;">Weekly Training Summary</h1>
  <p style="font-size: 14px; color: #888; margin-top: 0;">Hi ${data.name || "there"},</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 12px; background: #f8f9fa; border-radius: 8px 0 0 0; text-align: center;">
        <div style="font-size: 24px; font-weight: 700;">${Math.round(data.weekTss.total)}</div>
        <div style="font-size: 12px; color: #666;">Total TSS</div>
      </td>
      <td style="padding: 12px; background: #f8f9fa; text-align: center;">
        <div style="font-size: 24px; font-weight: 700;">${data.activityCount}</div>
        <div style="font-size: 12px; color: #666;">Activities</div>
      </td>
      <td style="padding: 12px; background: #f8f9fa; text-align: center;">
        <div style="font-size: 24px; font-weight: 700;">${hours}h${mins > 0 ? ` ${mins}m` : ""}</div>
        <div style="font-size: 12px; color: #666;">Duration</div>
      </td>
      <td style="padding: 12px; background: #f8f9fa; border-radius: 0 8px 0 0; text-align: center;">
        <div style="font-size: 24px; font-weight: 700;">${Math.round(data.tsb)}</div>
        <div style="font-size: 12px; color: #666;">Form (TSB)</div>
      </td>
    </tr>
  </table>

  ${data.weekTss.cycling > 0 || data.weekTss.running > 0 || data.weekTss.swimming > 0 ? `
  <p style="font-size: 14px; color: #666;">
    ${data.weekTss.cycling > 0 ? `Cycling: ${Math.round(data.weekTss.cycling)} TSS` : ""}
    ${data.weekTss.cycling > 0 && data.weekTss.running > 0 ? " · " : ""}
    ${data.weekTss.running > 0 ? `Running: ${Math.round(data.weekTss.running)} TSS` : ""}
    ${(data.weekTss.cycling > 0 || data.weekTss.running > 0) && data.weekTss.swimming > 0 ? " · " : ""}
    ${data.weekTss.swimming > 0 ? `Swimming: ${Math.round(data.weekTss.swimming)} TSS` : ""}
  </p>` : ""}

  ${adherence !== null ? `
  <p style="font-size: 14px;">
    <strong>Adherence:</strong> ${adherence}% of target (${Math.round(data.targetTss!)} TSS)
  </p>` : ""}

  <div style="background: #f0f4ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
    <p style="font-size: 14px; margin: 0; color: #1a1a1a;">
      <strong>Form: ${tsbLabel}</strong> (TSB: ${Math.round(data.tsb)}) ·
      Fitness: ${Math.round(data.ctl)} CTL ·
      Fatigue: ${Math.round(data.atl)} ATL
    </p>
    ${data.coachingNote ? `<p style="font-size: 14px; margin: 8px 0 0; color: #444;">${data.coachingNote}</p>` : ""}
  </div>

  ${data.upcomingWorkouts.length > 0 ? `
  <h2 style="font-size: 16px; margin-bottom: 8px;">This Week's Workouts</h2>
  <ul style="font-size: 14px; line-height: 1.8; color: #444;">
    ${data.upcomingWorkouts.map((w) => `<li>${w}</li>`).join("")}
  </ul>` : ""}

  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.paincave.io"}"
     style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
    Open Dashboard
  </a>

  <p style="font-size: 12px; color: #888; margin-top: 32px;">
    Paincave · <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.paincave.io"}/settings" style="color: #888;">Manage email preferences</a>
  </p>
</body>
</html>`,
  };
}

// ── Overtraining Alert ──────────────────────────────────────────────

export function overtrainingAlertEmail(
  name: string,
  tsb: number,
  ctl: number,
  note: string
): { subject: string; html: string } {
  return {
    subject: "Recovery recommended — your body is signaling fatigue",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="font-size: 22px; color: #dc2626; margin-bottom: 8px;">Recovery Recommended</h1>
  <p style="font-size: 15px; color: #444;">Hi ${name || "there"},</p>

  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
    <p style="font-size: 15px; margin: 0; color: #1a1a1a;">
      Your form (TSB) is <strong>${Math.round(tsb)}</strong> — well below the -30 threshold that indicates significant accumulated fatigue.
    </p>
    <p style="font-size: 14px; margin: 8px 0 0; color: #444;">${note}</p>
  </div>

  <h2 style="font-size: 16px;">What to do</h2>
  <ul style="font-size: 14px; line-height: 1.8; color: #444;">
    <li>Take 1-2 complete rest days or very easy active recovery</li>
    <li>Prioritize sleep (8+ hours)</li>
    <li>Keep nutrition high — now is not the time to restrict calories</li>
    <li>Monitor how you feel before returning to hard training</li>
  </ul>

  <p style="font-size: 14px; color: #444;">
    Current fitness (CTL): <strong>${Math.round(ctl)}</strong>. The training you've done isn't lost — your body just needs time to absorb it.
    A few easy days now will help you come back stronger.
  </p>

  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.paincave.io"}/fitness"
     style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
    View Fitness Timeline
  </a>

  <p style="font-size: 12px; color: #888; margin-top: 32px;">
    Paincave · This is not medical advice. If you feel unwell, consult a healthcare professional.
  </p>
</body>
</html>`,
  };
}
