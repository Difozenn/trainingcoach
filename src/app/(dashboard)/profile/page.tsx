import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  getFitnessTimeline,
  getUserPeakPowers,
  getAthleteProfile,
} from "@/lib/data/queries";
import { getUserPlan } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/dashboard/upgrade-prompt";
import { ProfileTabs } from "./profile-tabs";

const PROFILE_WINDOW_DAYS = 42; // 6 weeks — fixed window for rider profile

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; days?: string; pp?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getUserPlan(session.user.id);
  if (plan === "free") return <UpgradePrompt feature="Profile" />;

  const params = await searchParams;
  const days = Number(params.days) || 90;
  const curveDays = Number(params.pp) || 90; // power curve filter (default 90d)
  const defaultTab = params.tab === "power" ? "power" : "fitness";

  const [timeline, profilePeaks, allTimePeaks, curvePeaks, athleteProfile] =
    await Promise.all([
      getFitnessTimeline(session.user.id, days),
      getUserPeakPowers(session.user.id, PROFILE_WINDOW_DAYS), // always 6 weeks
      getUserPeakPowers(session.user.id),                       // all-time
      getUserPeakPowers(session.user.id, curveDays),            // user-selected range
      getAthleteProfile(session.user.id),
    ]);

  return (
    <>
      <DashboardHeader title="Profile" />
      <div className="flex-1 space-y-6 p-6">
        <Suspense>
          <ProfileTabs
            defaultTab={defaultTab}
            timeline={timeline}
            days={days}
            profilePeaks={profilePeaks}
            allTimePeaks={allTimePeaks}
            curvePeaks={curvePeaks}
            curveDays={curveDays}
            weightKg={athleteProfile?.weightKg ?? null}
          />
        </Suspense>
      </div>
    </>
  );
}
