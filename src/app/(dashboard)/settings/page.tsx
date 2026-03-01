import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <>
      <DashboardHeader title="Settings" />
      <div className="flex-1 space-y-6 p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="sports">Sport Profiles</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Weight, height, date of birth, experience level, weekly hours,
                  goal type, and timezone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Platform Connections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Strava</p>
                    <p className="text-sm text-muted-foreground">
                      Sync activities from Strava
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Not connected
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Garmin</p>
                    <p className="text-sm text-muted-foreground">
                      Activities + health data (HRV, sleep, resting HR)
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Coming soon
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Wahoo</p>
                    <p className="text-sm text-muted-foreground">
                      Cycling activity sync
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Coming soon
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sports">
            <Card>
              <CardHeader>
                <CardTitle>Sport Profiles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Per-sport thresholds: FTP (cycling), threshold pace (running),
                  CSS (swimming). Auto-detected from your data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription via Stripe Customer Portal.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
