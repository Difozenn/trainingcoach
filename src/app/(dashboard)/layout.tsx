import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth/admin";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const admin = isAdminEmail(session.user.email);

  return (
    <SidebarProvider>
      <DashboardSidebar isAdmin={admin} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
