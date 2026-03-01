import { describe, it, expect } from "vitest";
import { calculateNormalizedPower, calculateIntensityFactor } from "../cycling/normalized-power";
import { calculateTSS, estimateFTPFrom20Min } from "../cycling/tss";
import { getCyclingPowerZones } from "../cycling/zones";

describe("Normalized Power", () => {
  it("calculates NP from constant power as approximately that power", () => {
    const power = Array(3600).fill(200);
    const np = calculateNormalizedPower(power);
    expect(np).toBeCloseTo(200, 0);
  });

  it("calculates NP higher than avg for variable power", () => {
    const power = Array(3600).fill(0).map((_, i) => (i % 60 < 30 ? 100 : 300));
    const np = calculateNormalizedPower(power);
    expect(np).toBeGreaterThan(200);
    expect(np).toBeLessThan(300);
  });

  it("returns null for insufficient data", () => {
    expect(calculateNormalizedPower([])).toBeNull();
  });

  it("calculates IF correctly", () => {
    expect(calculateIntensityFactor(200, 250)).toBeCloseTo(0.8, 2);
    expect(calculateIntensityFactor(250, 250)).toBeCloseTo(1.0, 2);
  });
});

describe("TSS", () => {
  it("calculates TSS for 1hr at FTP ≈ 100", () => {
    // Constant power at FTP for 1 hour → TSS ≈ 100
    const stream = Array(3600).fill(250);
    const result = calculateTSS(stream, 250);
    expect(result).not.toBeNull();
    expect(result!.tss).toBeCloseTo(100, -1); // within 10
  });

  it("calculates TSS for 1hr at 75% FTP ≈ 56", () => {
    const stream = Array(3600).fill(187);
    const result = calculateTSS(stream, 250);
    expect(result).not.toBeNull();
    expect(result!.tss).toBeGreaterThan(40);
    expect(result!.tss).toBeLessThan(70);
  });

  it("estimates FTP from 20min power stream (×0.95)", () => {
    const stream = Array(1200).fill(300);
    expect(estimateFTPFrom20Min(stream)).toBe(285);
  });
});

describe("Cycling Power Zones (Coggan 7-zone)", () => {
  it("generates 7 zones from FTP", () => {
    const zones = getCyclingPowerZones(250);
    expect(zones).toHaveLength(7);
    expect(zones[0].zone).toBe(1);
    expect(zones[6].zone).toBe(7);
  });
});
