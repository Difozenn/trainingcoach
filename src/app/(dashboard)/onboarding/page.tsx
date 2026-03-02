"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "sports" | "basics" | "goals" | "connect";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("sports");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [sports, setSports] = useState<string[]>([]);
  const [weightKg, setWeightKg] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("8");
  const [experience, setExperience] = useState("intermediate");
  const [goalType, setGoalType] = useState("fitness_gain");

  function toggleSport(sport: string) {
    setSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  async function handleComplete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sports,
          weightKg: weightKg ? Number(weightKg) : null,
          weeklyHoursAvailable: Number(weeklyHours),
          experienceLevel: experience,
          goalType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {step === "sports" && "What sports do you train?"}
            {step === "basics" && "Quick details"}
            {step === "goals" && "What's your goal?"}
            {step === "connect" && "Connect your data"}
          </CardTitle>
          <CardDescription>
            {step === "sports" && "Select all that apply. We'll set up sport-specific zones and metrics."}
            {step === "basics" && "Helps us calculate nutrition targets and training zones."}
            {step === "goals" && "This shapes how we build your training plan."}
            {step === "connect" && "Sync your activities to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Sports selection */}
          {step === "sports" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "cycling", label: "Cycling", emoji: "\ud83d\udeb4" },
                  { id: "running", label: "Running", emoji: "\ud83c\udfc3" },
                  { id: "swimming", label: "Swimming", emoji: "\ud83c\udfca" },
                ].map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => toggleSport(sport.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      sports.includes(sport.id)
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="text-3xl">{sport.emoji}</span>
                    <span className="text-sm font-medium">{sport.label}</span>
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={sports.length === 0}
                onClick={() => setStep("basics")}
              >
                Continue
              </Button>
            </>
          )}

          {/* Step 2: Basic info */}
          {step === "basics" && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for nutrition targets. Optional.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Weekly training hours available</Label>
                  <Select value={weeklyHours} onValueChange={setWeeklyHours}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="10">10 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="15">15 hours</SelectItem>
                      <SelectItem value="20">20+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience level</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                      <SelectItem value="advanced">Advanced (3-5 years)</SelectItem>
                      <SelectItem value="elite">Elite (5+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("sports")}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep("goals")}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Goals */}
          {step === "goals" && (
            <>
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    id: "fitness_gain",
                    label: "Improve fitness",
                    desc: "Progressive training to build fitness over time. No specific event target.",
                  },
                  {
                    id: "event",
                    label: "Train for an event",
                    desc: "Periodized plan working backward from your race date with taper.",
                  },
                ].map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setGoalType(goal.id)}
                    className={`flex flex-col gap-1 rounded-lg border-2 p-4 text-left transition-colors ${
                      goalType === goal.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="font-medium">{goal.label}</span>
                    <span className="text-sm text-muted-foreground">{goal.desc}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("basics")}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep("connect")}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Connect + Complete */}
          {step === "connect" && (
            <>
              <div className="space-y-4">
                <a
                  href="/api/strava/connect"
                  className="flex items-center gap-3 rounded-lg border-2 border-muted p-4 hover:border-orange-500 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-orange-500 text-white font-bold text-sm">
                    S
                  </div>
                  <div>
                    <p className="font-medium">Connect Strava</p>
                    <p className="text-sm text-muted-foreground">
                      Sync activities, auto-detect thresholds
                    </p>
                  </div>
                </a>

                <p className="text-sm text-muted-foreground text-center">
                  We'll import your history and auto-detect your FTP, threshold pace, and CSS.
                  No manual entry needed.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("goals")}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleComplete} disabled={loading}>
                  {loading ? "Setting up..." : "Finish setup"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You can connect Strava later from Settings.
              </p>
            </>
          )}

          {/* Step indicators */}
          <div className="flex justify-center gap-2 pt-2">
            {(["sports", "basics", "goals", "connect"] as Step[]).map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  s === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
