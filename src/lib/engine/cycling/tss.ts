/**
 * Training Stress Score (TSS) — Coggan
 *
 * TSS = (duration_seconds × NP × IF) / (FTP × 3600) × 100
 *
 * Where:
 * - NP = Normalized Power
 * - IF = Intensity Factor = NP / FTP
 * - FTP = Functional Threshold Power
 *
 * Simplified: TSS = (duration_seconds / 3600) × IF² × 100
 *
 * Reference: Coggan, A.R. & Allen, H. Training and Racing with a Power Meter (2010).
 */

import {
  calculateNormalizedPower,
  calculateIntensityFactor,
} from "./normalized-power";

export type TSSResult = {
  tss: number;
  normalizedPower: number;
  intensityFactor: number;
};

/**
 * Calculate TSS from power stream data.
 * @param powerStream - Second-by-second power values in watts
 * @param ftp - Functional Threshold Power in watts
 * @returns TSS result with NP and IF, or null if insufficient data
 */
export function calculateTSS(
  powerStream: number[],
  ftp: number
): TSSResult | null {
  if (ftp <= 0) return null;

  const np = calculateNormalizedPower(powerStream);
  if (np === null) return null;

  const intensityFactor = calculateIntensityFactor(np, ftp);
  const durationSeconds = powerStream.length;
  const durationHours = durationSeconds / 3600;

  // TSS = duration_hours × IF² × 100
  const tss = durationHours * intensityFactor ** 2 * 100;

  return {
    tss: Math.round(tss * 10) / 10,
    normalizedPower: np,
    intensityFactor: Math.round(intensityFactor * 1000) / 1000,
  };
}

/**
 * Estimate TSS from average power (less accurate than NP-based).
 * Used when only summary data is available.
 */
export function estimateTSSFromAvgPower(
  avgPower: number,
  durationSeconds: number,
  ftp: number
): number {
  if (ftp <= 0) return 0;
  const intensityFactor = avgPower / ftp;
  const durationHours = durationSeconds / 3600;
  return Math.round(durationHours * intensityFactor ** 2 * 100 * 10) / 10;
}

/**
 * Estimate FTP from a maximal 20-minute effort.
 * FTP ≈ 20min best average power × 0.95
 *
 * @param powerStream - Power data from a 20-minute effort
 * @returns Estimated FTP in watts
 */
export function estimateFTPFrom20Min(powerStream: number[]): number | null {
  if (powerStream.length < 20 * 60) return null;

  // Find best 20-minute window
  const windowSize = 20 * 60;
  let maxAvg = 0;
  let windowSum = 0;

  for (let i = 0; i < powerStream.length; i++) {
    windowSum += powerStream[i];
    if (i >= windowSize) {
      windowSum -= powerStream[i - windowSize];
    }
    if (i >= windowSize - 1) {
      const avg = windowSum / windowSize;
      if (avg > maxAvg) maxAvg = avg;
    }
  }

  if (maxAvg === 0) return null;

  // FTP = 95% of 20-minute power
  return Math.round(maxAvg * 0.95);
}
