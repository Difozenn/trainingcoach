/**
 * FTP Rolling Decay Model
 *
 * FTP decays exponentially when not reinforced by hard efforts.
 * τ (tau) = 90 days — after 90 days of no breakthrough, FTP decays to ~37% of the gap.
 *
 * Effective FTP = lastFTP × exp(-daysSince / τ)
 *
 * A "breakthrough" occurs when NP × 0.95 > effectiveFTP, updating the FTP anchor.
 */

const DEFAULT_TAU = 90; // days — decay time constant
const FTP_FLOOR_RATIO = 0.6; // FTP won't decay below 60% of peak

export type FTPTimelineEntry = {
  date: Date;
  ftp: number;
  isBreakthrough: boolean;
  activityId?: string;
};

/**
 * Apply exponential decay to FTP.
 * @param lastFtp - Last confirmed FTP in watts
 * @param lastFtpDate - Date of last FTP measurement
 * @param currentDate - Date to calculate effective FTP for
 * @param tau - Decay time constant in days (default 90)
 * @returns Effective FTP after decay, floored at 60% of lastFtp
 */
export function getEffectiveFTP(
  lastFtp: number,
  lastFtpDate: Date,
  currentDate: Date,
  tau: number = DEFAULT_TAU
): number {
  const daysSince =
    (currentDate.getTime() - lastFtpDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince <= 0) return lastFtp;

  const decayed = lastFtp * Math.exp(-daysSince / tau);
  const floor = lastFtp * FTP_FLOOR_RATIO;

  return Math.round(Math.max(decayed, floor));
}

/**
 * Detect if an activity represents an FTP breakthrough.
 * @param np - Normalized Power from the activity
 * @param effectiveFtp - Current effective FTP (after decay)
 * @returns New FTP if breakthrough, null otherwise
 */
export function detectFTPFromActivity(
  np: number,
  effectiveFtp: number
): number | null {
  const candidateFtp = Math.round(np * 0.95);
  if (candidateFtp > effectiveFtp) {
    return candidateFtp;
  }
  return null;
}

/**
 * Build a chronological FTP timeline from activities.
 * Processes activities oldest-first, applying decay between activities
 * and detecting breakthroughs.
 *
 * @param activities - Array of { date, np, activityId } sorted chronologically
 * @param initialFtp - Starting FTP (0 if unknown)
 * @param initialFtpDate - Date of initial FTP
 * @param tau - Decay time constant
 * @returns Timeline of FTP values with breakthrough markers
 */
export function buildFTPTimeline(
  activities: { date: Date; np: number; activityId?: string }[],
  initialFtp: number = 0,
  initialFtpDate?: Date,
  tau: number = DEFAULT_TAU
): FTPTimelineEntry[] {
  const timeline: FTPTimelineEntry[] = [];
  let currentFtp = initialFtp;
  let currentFtpDate = initialFtpDate ?? (activities[0]?.date ?? new Date());

  for (const activity of activities) {
    if (currentFtp === 0) {
      // First activity with power — bootstrap FTP
      const candidateFtp = Math.round(activity.np * 0.95);
      if (candidateFtp > 0) {
        currentFtp = candidateFtp;
        currentFtpDate = activity.date;
        timeline.push({
          date: activity.date,
          ftp: currentFtp,
          isBreakthrough: true,
          activityId: activity.activityId,
        });
      }
      continue;
    }

    // Apply decay from last FTP date to this activity
    const effectiveFtp = getEffectiveFTP(
      currentFtp,
      currentFtpDate,
      activity.date,
      tau
    );

    // Check for breakthrough
    const newFtp = detectFTPFromActivity(activity.np, effectiveFtp);
    if (newFtp) {
      currentFtp = newFtp;
      currentFtpDate = activity.date;
      timeline.push({
        date: activity.date,
        ftp: currentFtp,
        isBreakthrough: true,
        activityId: activity.activityId,
      });
    } else {
      // Record the decayed FTP at this point
      timeline.push({
        date: activity.date,
        ftp: effectiveFtp,
        isBreakthrough: false,
        activityId: activity.activityId,
      });
    }
  }

  return timeline;
}

/**
 * Get the effective FTP for a specific date given a threshold history.
 * Finds the most recent threshold before the date and applies decay.
 */
export function getFTPForDate(
  thresholdHistory: { value: number; detectedAt: Date }[],
  date: Date,
  tau: number = DEFAULT_TAU
): number {
  // Sort descending by date
  const sorted = [...thresholdHistory].sort(
    (a, b) => b.detectedAt.getTime() - a.detectedAt.getTime()
  );

  // Find most recent threshold before or on this date
  const threshold = sorted.find((t) => t.detectedAt <= date);
  if (!threshold) {
    // No threshold before this date — use earliest available
    const earliest = sorted[sorted.length - 1];
    return earliest ? getEffectiveFTP(earliest.value, earliest.detectedAt, date, tau) : 0;
  }

  return getEffectiveFTP(threshold.value, threshold.detectedAt, date, tau);
}
