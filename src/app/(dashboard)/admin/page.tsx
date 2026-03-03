import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/admin";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminOverviewTab } from "./overview-tab";
import { AdminUsersTab } from "./users-tab";
import { AdminJobLogsTab } from "./job-logs-tab";
import { AdminSystemTab } from "./system-tab";
import {
  getAdminOverview,
  getAdminUsers,
  getAdminJobLogs,
  getJobLogFilterOptions,
  getStreamBackfillProgress,
} from "@/lib/data/admin-queries";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/dashboard");

  const [overview, users, logs, logFilters, streamProgress] = await Promise.all(
    [
      getAdminOverview(),
      getAdminUsers(),
      getAdminJobLogs({ limit: 50 }),
      getJobLogFilterOptions(),
      getStreamBackfillProgress(),
    ]
  );

  return (
    <>
      <DashboardHeader title="Admin" />
      <div className="flex-1 space-y-6 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="logs">Job Logs</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab data={overview} />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTab users={users} />
          </TabsContent>
          <TabsContent value="logs">
            <AdminJobLogsTab
              logs={logs as unknown as Array<{
                id: string;
                level: string;
                functionName: string;
                stepName: string | null;
                message: string;
                createdAt: string | Date;
              }>}
              filters={logFilters}
            />
          </TabsContent>
          <TabsContent value="system">
            <AdminSystemTab progress={streamProgress} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
