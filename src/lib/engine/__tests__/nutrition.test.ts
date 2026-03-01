import { describe, it, expect } from "vitest";
import {
  calculateDailyMacros,
  getTrainingDayType,
} from "../nutrition/daily-macros";
import { calculateFuelingPlan } from "../nutrition/ride-fueling";
import { calculateRecoveryNutrition } from "../nutrition/recovery-nutrition";
import { calculateHydration } from "../nutrition/hydration";

// ============ DAILY MACROS ============

describe("Training Day Type Classification", () => {
  it("classifies 0 TSS as rest", () => {
    expect(getTrainingDayType(0)).toBe("rest");
  });

  it("classifies low TSS as easy", () => {
    expect(getTrainingDayType(40)).toBe("easy");
  });

  it("classifies moderate TSS as endurance", () => {
    expect(getTrainingDayType(100)).toBe("endurance");
  });

  it("classifies high TSS as hard", () => {
    expect(getTrainingDayType(200)).toBe("hard");
  });

  it("classifies very high TSS as race", () => {
    expect(getTrainingDayType(300)).toBe("race");
  });
});

describe("Daily Macro Targets", () => {
  const weight = 70; // kg

  it("rest day: 3-4g/kg carbs", () => {
    const macros = calculateDailyMacros(weight, "rest");
    expect(macros.carbsPerKg).toBeGreaterThanOrEqual(3);
    expect(macros.carbsPerKg).toBeLessThanOrEqual(4);
    expect(macros.carbsGrams).toBe(Math.round(weight * macros.carbsPerKg));
  });

  it("hard day: 8-10g/kg carbs", () => {
    const macros = calculateDailyMacros(weight, "hard");
    expect(macros.carbsPerKg).toBeGreaterThanOrEqual(8);
    expect(macros.carbsPerKg).toBeLessThanOrEqual(10);
  });

  it("race day: 10-12g/kg carbs", () => {
    const macros = calculateDailyMacros(weight, "race");
    expect(macros.carbsPerKg).toBeGreaterThanOrEqual(10);
    expect(macros.carbsPerKg).toBeLessThanOrEqual(12);
  });

  it("protein is 1.6-2.0g/kg for all day types", () => {
    for (const dayType of ["rest", "easy", "endurance", "hard", "race"] as const) {
      const macros = calculateDailyMacros(weight, dayType);
      expect(macros.proteinPerKg).toBeGreaterThanOrEqual(1.6);
      expect(macros.proteinPerKg).toBeLessThanOrEqual(2.0);
    }
  });

  it("total calories = 4×carbs + 4×protein + 9×fat", () => {
    const macros = calculateDailyMacros(weight, "endurance");
    const expected =
      macros.carbsGrams * 4 + macros.proteinGrams * 4 + macros.fatGrams * 9;
    expect(macros.totalCalories).toBe(expected);
  });

  it("70kg cyclist hard day produces ~3000+ calories", () => {
    const macros = calculateDailyMacros(weight, "hard");
    expect(macros.totalCalories).toBeGreaterThan(3000);
  });

  it("includes plain-English explanation", () => {
    const macros = calculateDailyMacros(weight, "rest");
    expect(macros.explanation).toContain("carbs");
    expect(macros.explanation).toContain("protein");
  });

  it("carb loading: 7-10g/kg carbs", () => {
    const macros = calculateDailyMacros(weight, "carb_load");
    expect(macros.carbsPerKg).toBeGreaterThanOrEqual(7);
    expect(macros.carbsPerKg).toBeLessThanOrEqual(10);
  });
});

// ============ RIDE FUELING ============

describe("Ride/Run Fueling Plan", () => {
  it("< 1hr: minimal carbs", () => {
    const plan = calculateFuelingPlan(45, "moderate");
    expect(plan.carbsPerHour).toBe(0);
  });

  it("< 1hr race: some carbs", () => {
    const plan = calculateFuelingPlan(45, "race");
    expect(plan.carbsPerHour).toBe(30);
  });

  it("1-2.5hr moderate: 60g/hr", () => {
    const plan = calculateFuelingPlan(120, "moderate");
    expect(plan.carbsPerHour).toBe(60);
  });

  it("2.5-3hr hard: 90g/hr with glucose:fructose ratio", () => {
    const plan = calculateFuelingPlan(160, "hard");
    expect(plan.carbsPerHour).toBe(90);
    expect(plan.glucoseFructoseRatio).toContain("1:0.8");
  });

  it("3hr+ gut-trained race: up to 120g/hr", () => {
    const plan = calculateFuelingPlan(240, "race", true);
    expect(plan.carbsPerHour).toBe(120);
    expect(plan.glucoseFructoseRatio).toContain("1:0.8");
  });

  it("3hr+ non-gut-trained: 90g/hr", () => {
    const plan = calculateFuelingPlan(240, "moderate", false);
    expect(plan.carbsPerHour).toBe(90);
  });

  it("total carbs = carbs/hr × duration hours", () => {
    const plan = calculateFuelingPlan(120, "moderate");
    expect(plan.totalCarbsGrams).toBe(
      Math.round(plan.carbsPerHour * (120 / 60))
    );
  });

  it("timing guide has entries every 20 minutes", () => {
    const plan = calculateFuelingPlan(120);
    expect(plan.timingGuide.length).toBe(6); // 20, 40, 60, 80, 100, 120
    expect(plan.timingGuide[0].minuteMark).toBe(20);
  });

  it("includes hydration and sodium recommendations", () => {
    const plan = calculateFuelingPlan(120);
    expect(plan.hydrationMlPerHour).toBeGreaterThan(0);
    expect(plan.sodiumMgPerHour).toBeGreaterThan(0);
  });
});

// ============ RECOVERY NUTRITION ============

describe("Recovery Nutrition", () => {
  it("easy session: lower carbs", () => {
    const recovery = calculateRecoveryNutrition(70, 45, 30);
    expect(recovery.carbsGrams).toBe(Math.round(70 * 0.5));
  });

  it("moderate session: 1.0g/kg carbs", () => {
    const recovery = calculateRecoveryNutrition(70, 90, 80);
    expect(recovery.carbsGrams).toBe(Math.round(70 * 1.0));
  });

  it("hard session: 1.2g/kg carbs", () => {
    const recovery = calculateRecoveryNutrition(70, 120, 200);
    expect(recovery.carbsGrams).toBe(Math.round(70 * 1.2));
  });

  it("high TSS: higher protein (0.5g/kg)", () => {
    const recovery = calculateRecoveryNutrition(70, 120, 150);
    expect(recovery.proteinGrams).toBe(Math.round(70 * 0.5));
  });

  it("low TSS: standard protein (0.4g/kg)", () => {
    const recovery = calculateRecoveryNutrition(70, 90, 80);
    expect(recovery.proteinGrams).toBe(Math.round(70 * 0.4));
  });

  it("recovery window is 120 minutes", () => {
    const recovery = calculateRecoveryNutrition(70, 60, 50);
    expect(recovery.windowMinutes).toBe(120);
  });

  it("includes explanation", () => {
    const recovery = calculateRecoveryNutrition(70, 60, 50);
    expect(recovery.explanation.length).toBeGreaterThan(0);
  });
});

// ============ HYDRATION ============

describe("Hydration Plan", () => {
  it("default conditions: ~700ml/hr", () => {
    const hydration = calculateHydration(120);
    expect(hydration.fluidPerHourMl).toBe(700);
  });

  it("hot conditions (>30°C): 1000ml/hr", () => {
    const hydration = calculateHydration(120, { temperatureCelsius: 35 });
    expect(hydration.fluidPerHourMl).toBe(1000);
  });

  it("warm conditions (25-30°C): 900ml/hr", () => {
    const hydration = calculateHydration(120, { temperatureCelsius: 27 });
    expect(hydration.fluidPerHourMl).toBe(900);
  });

  it("cold conditions (<10°C): 500ml/hr", () => {
    const hydration = calculateHydration(120, { temperatureCelsius: 5 });
    expect(hydration.fluidPerHourMl).toBe(500);
  });

  it("high humidity adds 15%", () => {
    const normal = calculateHydration(120, { temperatureCelsius: 20 });
    const humid = calculateHydration(120, {
      temperatureCelsius: 20,
      humidityPercent: 80,
    });
    expect(humid.fluidPerHourMl).toBe(Math.round(normal.fluidPerHourMl * 1.15));
  });

  it("total fluid = fluid/hr × duration hours", () => {
    const hydration = calculateHydration(120);
    expect(hydration.totalFluidMl).toBe(
      Math.round(hydration.fluidPerHourMl * 2)
    );
  });

  it("sodium increases in hot conditions", () => {
    const normal = calculateHydration(120, { temperatureCelsius: 20 });
    const hot = calculateHydration(120, { temperatureCelsius: 30 });
    expect(hot.sodiumPerHourMg).toBeGreaterThan(normal.sodiumPerHourMg);
  });

  it("includes explanation", () => {
    const hydration = calculateHydration(60);
    expect(hydration.explanation).toContain("ml");
  });
});
