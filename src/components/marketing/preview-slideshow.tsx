"use client";

import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Dumbbell,
  Apple,
  Heart,
} from "lucide-react";
import {
  DashboardHeroPreview,
  FitnessChartPreview,
  WorkoutPlanPreview,
  NutritionPreview,
  HealthPreview,
} from "@/components/marketing/previews";

const SLIDE_DURATION = 6000;

const slides = [
  { label: "Overview", Icon: LayoutDashboard, Component: DashboardHeroPreview },
  { label: "Fitness", Icon: TrendingUp, Component: FitnessChartPreview },
  { label: "Coaching", Icon: Dumbbell, Component: WorkoutPlanPreview },
  { label: "Nutrition", Icon: Apple, Component: NutritionPreview },
  { label: "Health", Icon: Heart, Component: HealthPreview },
];

export function PreviewSlideshow() {
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback((index: number) => {
    setActive(index);
    setAnimKey((k) => k + 1);
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setActive((prev) => {
      const next = (prev + 1) % slides.length;
      setAnimKey((k) => k + 1);
      return next;
    });
  }, []);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Tab buttons with progress bars */}
      <div className="mb-6 flex justify-center gap-1">
        {slides.map((s, i) => (
          <button
            key={s.label}
            onClick={() => goTo(i)}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors ${
              i === active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <s.Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{s.label}</span>
            {/* Progress track */}
            <span className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-muted/30">
              {i === active && (
                <span
                  key={animKey}
                  className="block h-full rounded-full bg-primary"
                  style={{
                    animation: `slideProgress ${SLIDE_DURATION}ms linear forwards`,
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                  onAnimationEnd={handleAnimationEnd}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Slides — stacked via CSS grid, crossfade with opacity */}
      <div className="relative">
        <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
          {slides.map((s, i) => (
            <div
              key={s.label}
              className={`transition-all duration-500 ${
                i === active
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              aria-hidden={i !== active}
            >
              <s.Component />
            </div>
          ))}
        </div>
        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  );
}
