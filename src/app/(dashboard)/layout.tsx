import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth/admin";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { MaxHrPrompt } from "@/components/dashboard/max-hr-prompt";
import { TimezoneSync } from "@/components/dashboard/timezone-sync";
import { db } from "@/lib/db";
import { athleteProfiles, activities } from "@/lib/db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";

async function getMaxHrMismatch(userId: string) {
  const [profile] = await db
    .select({ maxHr: athleteProfiles.maxHr })
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);

  if (!profile?.maxHr) return null;

  const [highest] = await db
    .select({
      maxHr: sql<number>`MAX(${activities.maxHr})`,
      date: sql<string>`MAX(CASE WHEN ${activities.maxHr} = (SELECT MAX(max_hr) FROM activities WHERE user_id = ${userId}) THEN ${activities.startedAt}::text END)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        isNotNull(activities.maxHr),
        sql`${activities.maxHr} > ${profile.maxHr}`
      )
    );

  if (!highest?.maxHr) return null;

  return {
    currentMaxHr: profile.maxHr,
    recordedMaxHr: highest.maxHr,
    date: highest.date ? new Date(highest.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "recent ride",
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const admin = isAdminEmail(session.user.email);
  const userId = session.user.id!;

  const [hrMismatch, profile] = await Promise.all([
    getMaxHrMismatch(userId),
    db
      .select({ timezone: athleteProfiles.timezone })
      .from(athleteProfiles)
      .where(eq(athleteProfiles.userId, userId))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  async function updateMaxHr(newMaxHr: number) {
    "use server";
    await db
      .update(athleteProfiles)
      .set({ maxHr: newMaxHr, updatedAt: new Date() })
      .where(eq(athleteProfiles.userId, userId));
  }

  async function updateTimezone(tz: string) {
    "use server";
    await db
      .update(athleteProfiles)
      .set({ timezone: tz, updatedAt: new Date() })
      .where(eq(athleteProfiles.userId, userId));
  }

  return (
    <SidebarProvider>
      <DashboardSidebar isAdmin={admin} />
      <SidebarInset>
        <TimezoneSync
          currentTimezone={profile?.timezone ?? null}
          updateAction={updateTimezone}
        />
        {hrMismatch && (
          <MaxHrPrompt
            currentMaxHr={hrMismatch.currentMaxHr}
            recordedMaxHr={hrMismatch.recordedMaxHr}
            activityDate={hrMismatch.date}
            updateAction={updateMaxHr}
          />
        )}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
