import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { db } from "@/lib/db";
import { athleteProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Check onboarding status (skip if already on onboarding page)
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  if (!pathname.includes("/onboarding")) {
    const [profile] = await db
      .select({ onboardingCompleted: athleteProfiles.onboardingCompleted })
      .from(athleteProfiles)
      .where(eq(athleteProfiles.userId, session.user.id!))
      .limit(1);

    if (!profile?.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
