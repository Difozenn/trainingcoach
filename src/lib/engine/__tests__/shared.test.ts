import { describe, it, expect } from "vitest";
import { calculateFatigueModel } from "../shared/fatigue-model";
import { calculateTRIMP } from "../shared/trimp";
import { getHrZones } from "../shared/hr-zones";

describe("Fatigue Model (CTL/ATL/TSB)", () => {
  it("CTL uses 42-day time constant", () => {
    const result = calculateFatigueModel([{ date: "2026-01-01", totalTss: 100 }]);
    expect(result[0].ctl).toBeCloseTo(2.38, 1);
  });

  it("ATL uses 7-day time constant", () => {
    const result = calculateFatigueModel([{ date: "2026-01-01", totalTss: 100 }]);
    expect(result[0].atl).toBeCloseTo(14.29, 1);
  });

  it("TSB = CTL - ATL", () => {
    const result = calculateFatigueModel([{ date: "2026-01-01", totalTss: 100 }]);
    expect(result[0].tsb).toBeCloseTo(result[0].ctl - result[0].atl, 2);
  });

  it("rest day reduces both CTL and ATL", () => {
    const result = calculateFatigueModel([{ date: "2026-01-01", totalTss: 0 }], 50, 70);
    expect(result[0].ctl).toBeLessThan(50);
    expect(result[0].atl).toBeLessThan(70);
  });

  it("ATL decays faster than CTL on rest days", () => {
    const result = calculateFatigueModel([{ date: "2026-01-01", totalTss: 0 }], 50, 70);
    expect(70 - result[0].atl).toBeGreaterThan(50 - result[0].ctl);
  });
});

describe("TRIMP", () => {
  it("calculates exponential TRIMP", () => {
    // Signature: (avgHr, durationMinutes, restingHr, maxHr, sex)
    const trimp = calculateTRIMP(150, 60, 50, 190, "male");
    expect(trimp).toBeGreaterThan(50);
    expect(trimp).toBeLessThan(200);
  });

  it("higher HR = higher TRIMP", () => {
    const low = calculateTRIMP(130, 60, 50, 190, "male");
    const high = calculateTRIMP(170, 60, 50, 190, "male");
    expect(high).toBeGreaterThan(low);
  });
});

describe("HR Zones", () => {
  it("generates 5 zones", () => {
    const zones = getHrZones(190);
    expect(zones).toHaveLength(5);
  });
});
