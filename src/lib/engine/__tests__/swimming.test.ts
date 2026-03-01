import { describe, it, expect } from "vitest";
import { calculateCSSFromTest, calculateSwimmingIF } from "../swimming/css";
import { calculateSTSS } from "../swimming/stss";
import { getSwimmingZones, getSwimZone } from "../swimming/zones";

describe("Critical Swim Speed", () => {
  it("calculates CSS from 400m and 200m test times", () => {
    // CSS speed = 200 / (T400 - T200) = 200/200 = 1.0 m/s → 100 s/100m
    const css = calculateCSSFromTest(360, 160);
    expect(css).not.toBeNull();
    expect(css!).toBeGreaterThan(0);
  });
});

describe("sTSS (IF cubed)", () => {
  it("calculates sTSS for swim at CSS", () => {
    // 1km in ~17min at CSS 100s/100m
    const result = calculateSTSS(1000, 1000, 100);
    expect(result).not.toBeNull();
    expect(result!.stss).toBeGreaterThan(0);
  });
});

describe("Swimming Zones (5-zone CSS)", () => {
  it("generates 5 zones", () => {
    const zones = getSwimmingZones(95);
    expect(zones).toHaveLength(5);
  });

  it("classifies easy pace as zone 1 or 2", () => {
    const zone = getSwimZone(120, 95);
    expect([1, 2]).toContain(zone);
  });
});
