import { describe, it, expect } from "vitest";
import { calculateNGP } from "../running/normalized-graded-pace";
import { calculateRTSS } from "../running/rtss";
import { getRunningPaceZones, getRunningZone } from "../running/zones";

describe("Normalized Graded Pace", () => {
  it("returns pace close to actual on flat terrain", () => {
    // Flat at ~3.7 m/s (4:30/km)
    const speed = Array(1800).fill(1000 / 270);
    const grade = Array(1800).fill(0);
    const ngp = calculateNGP(speed, grade);
    expect(ngp).not.toBeNull();
    expect(ngp!).toBeGreaterThan(260);
    expect(ngp!).toBeLessThan(280);
  });

  it("NGP is faster than actual pace uphill", () => {
    const speed = Array(1800).fill(1000 / 300);
    const grade = Array(1800).fill(5);
    const ngp = calculateNGP(speed, grade);
    expect(ngp).not.toBeNull();
    expect(ngp!).toBeLessThan(300);
  });
});

describe("rTSS", () => {
  it("calculates rTSS from speed stream", () => {
    // Constant speed at threshold for 1hr
    const thresholdPace = 270; // 4:30/km
    const speed = Array(3600).fill(1000 / thresholdPace);
    const result = calculateRTSS(speed, thresholdPace);
    expect(result).not.toBeNull();
    expect(result!.rtss).toBeGreaterThan(80);
    expect(result!.rtss).toBeLessThan(120);
  });
});

describe("Running Pace Zones", () => {
  it("generates 6 zones", () => {
    const zones = getRunningPaceZones(270);
    expect(zones).toHaveLength(6);
  });

  it("classifies threshold pace as zone 4", () => {
    expect(getRunningZone(270, 270)).toBe("4");
  });

  it("classifies easy pace as zone 1", () => {
    expect(getRunningZone(360, 270)).toBe("1");
  });
});
