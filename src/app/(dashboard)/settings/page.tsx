import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getAthleteProfile,
  getSportProfiles,
  getConnection,
  getSubscription,
} from "@/lib/data/queries";
import { updateProfile, updateSportProfile } from "./actions";
import { formatPace, formatPacePer100m } from "@/lib/data/helpers";
import { UpgradeButton, ManageSubscriptionButton } from "@/components/dashboard/billing-buttons";
import { AccountActions } from "@/components/dashboard/account-actions";
import { SubmitButton } from "@/components/dashboard/submit-button";
import { CalendarSubscribe } from "@/components/dashboard/calendar-subscribe";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string; billing?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const params = await searchParams;

  const [profile, sports, stravaConn, garminConn, wahooConn, subscription] =
    await Promise.all([
      getAthleteProfile(userId),
      getSportProfiles(userId),
      getConnection(userId, "strava"),
      getConnection(userId, "garmin"),
      getConnection(userId, "wahoo"),
      getSubscription(userId),
    ]);

  const cycling = sports.find((s) => s.sport === "cycling");
  const running = sports.find((s) => s.sport === "running");
  const swimming = sports.find((s) => s.sport === "swimming");

  return (
    <>
      <DashboardHeader title="Settings" />
      <div className="flex-1 space-y-6 p-6">
        {/* Flash messages */}
        {params.connected && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            {params.connected === "strava" && "Strava connected successfully! Your activities will start syncing."}
            {params.connected === "garmin" && "Garmin connected successfully! Activities and health data will start syncing."}
            {params.connected === "wahoo" && "Wahoo connected successfully! Your workouts will start syncing."}
          </div>
        )}
        {params.error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
            {params.error === "strava_denied"
              ? "Strava connection was denied."
              : params.error === "strava_failed"
                ? "Failed to connect Strava. Please try again."
                : params.error === "garmin_denied"
                  ? "Garmin connection was denied."
                  : params.error === "garmin_failed"
                    ? "Failed to connect Garmin. Please try again."
                    : params.error === "garmin_expired"
                      ? "Garmin connection timed out. Please try again."
                      : params.error === "wahoo_denied"
                        ? "Wahoo connection was denied."
                        : params.error === "wahoo_failed"
                          ? "Failed to connect Wahoo. Please try again."
                          : "An error occurred."}
          </div>
        )}
        {params.billing === "success" && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            Subscribed to Pro! You now have access to all features.
          </div>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="sports">Sport Profiles</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="data">Data &amp; Privacy</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Athlete Profile</CardTitle>
                <CardDescription>
                  Basic info for calculating nutrition targets and training
                  zones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={updateProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="weightKg">Weight (kg)</Label>
                      <Input
                        id="weightKg"
                        name="weightKg"
                        type="number"
                        step="0.1"
                        defaultValue={profile?.weightKg ?? ""}
                        placeholder="70"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heightCm">Height (cm)</Label>
                      <Input
                        id="heightCm"
                        name="heightCm"
                        type="number"
                        defaultValue={profile?.heightCm ?? ""}
                        placeholder="175"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sex">Sex</Label>
                      <select
                        id="sex"
                        name="sex"
                        defaultValue={profile?.sex ?? ""}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Not set</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        defaultValue={profile?.dateOfBirth ? profile.dateOfBirth.toISOString().split("T")[0] : ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxHr">Max Heart Rate</Label>
                      <Input
                        id="maxHr"
                        name="maxHr"
                        type="number"
                        defaultValue={profile?.maxHr ?? ""}
                        placeholder="190"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restingHr">Resting Heart Rate</Label>
                      <Input
                        id="restingHr"
                        name="restingHr"
                        type="number"
                        defaultValue={profile?.restingHr ?? ""}
                        placeholder="55"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weeklyHoursAvailable">
                        Weekly Hours Available
                      </Label>
                      <Input
                        id="weeklyHoursAvailable"
                        name="weeklyHoursAvailable"
                        type="number"
                        step="0.5"
                        defaultValue={profile?.weeklyHoursAvailable ?? ""}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <select
                        id="experienceLevel"
                        name="experienceLevel"
                        defaultValue={profile?.experienceLevel ?? "intermediate"}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goalType">Goal Type</Label>
                      <select
                        id="goalType"
                        name="goalType"
                        defaultValue={profile?.goalType ?? "fitness_gain"}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      >
                        <option value="fitness_gain">Fitness Gain</option>
                        <option value="event">Event Training</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        name="timezone"
                        defaultValue={profile?.timezone ?? "UTC"}
                        placeholder="America/New_York"
                      />
                    </div>
                  </div>
                  <SubmitButton>Save Profile</SubmitButton>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Platform Connections</CardTitle>
                <CardDescription>
                  Connect your training platforms to sync activities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strava */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Strava</p>
                    <p className="text-sm text-muted-foreground">
                      Sync cycling, running, and swimming activities
                    </p>
                    {stravaConn?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last synced:{" "}
                        {stravaConn.lastSyncAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {stravaConn ? (
                    <form action="/api/strava/disconnect" method="POST">
                      <Badge variant="outline" className="mr-2 text-green-600">
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm" type="submit">
                        Disconnect
                      </Button>
                    </form>
                  ) : (
                    <a href="/api/strava/connect">
                      <Button size="sm">Connect</Button>
                    </a>
                  )}
                </div>

                {/* Garmin */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Garmin</p>
                    <p className="text-sm text-muted-foreground">
                      Activities + health data (HRV, sleep, resting HR)
                    </p>
                    {garminConn?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last synced:{" "}
                        {garminConn.lastSyncAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {garminConn ? (
                    <form action="/api/garmin/disconnect" method="POST">
                      <Badge variant="outline" className="mr-2 text-green-600">
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm" type="submit">
                        Disconnect
                      </Button>
                    </form>
                  ) : (
                    <a href="/api/garmin/connect">
                      <Button size="sm">Connect</Button>
                    </a>
                  )}
                </div>

                {/* Wahoo */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Wahoo</p>
                    <p className="text-sm text-muted-foreground">
                      Cycling activity sync
                    </p>
                    {wahooConn?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last synced:{" "}
                        {wahooConn.lastSyncAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {wahooConn ? (
                    <form action="/api/wahoo/disconnect" method="POST">
                      <Badge variant="outline" className="mr-2 text-green-600">
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm" type="submit">
                        Disconnect
                      </Button>
                    </form>
                  ) : (
                    <a href="/api/wahoo/connect">
                      <Button size="sm">Connect</Button>
                    </a>
                  )}
                </div>

                {/* Calendar subscription */}
                <div className="border-t pt-4">
                  <CalendarSubscribe />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sport Profiles Tab */}
          <TabsContent value="sports">
            <div className="space-y-6">
              {/* Cycling */}
              <Card>
                <CardHeader>
                  <CardTitle>Cycling</CardTitle>
                  <CardDescription>
                    FTP auto-detected from your best 20-minute power (&times;
                    0.95). Override manually if needed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={updateSportProfile} className="space-y-4">
                    <input type="hidden" name="sport" value="cycling" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="ftp">FTP (watts)</Label>
                        <Input
                          id="ftp"
                          name="ftp"
                          type="number"
                          defaultValue={cycling?.ftp ?? ""}
                          placeholder="250"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cycling-lthr">LTHR (bpm)</Label>
                        <Input
                          id="cycling-lthr"
                          name="lthr"
                          type="number"
                          defaultValue={cycling?.lthr ?? ""}
                          placeholder="165"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cycling-maxhr">Max HR (bpm)</Label>
                        <Input
                          id="cycling-maxhr"
                          name="sportMaxHr"
                          type="number"
                          defaultValue={cycling?.sportMaxHr ?? ""}
                          placeholder="185"
                        />
                      </div>
                    </div>
                    <SubmitButton>Save Cycling</SubmitButton>
                  </form>
                </CardContent>
              </Card>

              {/* Running */}
              <Card>
                <CardHeader>
                  <CardTitle>Running</CardTitle>
                  <CardDescription>
                    Threshold pace auto-detected from your best 30-40 minute
                    runs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={updateSportProfile} className="space-y-4">
                    <input type="hidden" name="sport" value="running" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="thresholdPace">
                          Threshold Pace (sec/km)
                        </Label>
                        <Input
                          id="thresholdPace"
                          name="thresholdPaceSPerKm"
                          type="number"
                          defaultValue={running?.thresholdPaceSPerKm ?? ""}
                          placeholder="270"
                        />
                        {running?.thresholdPaceSPerKm && (
                          <p className="text-xs text-muted-foreground">
                            = {formatPace(running.thresholdPaceSPerKm)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="running-lthr">LTHR (bpm)</Label>
                        <Input
                          id="running-lthr"
                          name="lthr"
                          type="number"
                          defaultValue={running?.lthr ?? ""}
                          placeholder="170"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="running-maxhr">Max HR (bpm)</Label>
                        <Input
                          id="running-maxhr"
                          name="sportMaxHr"
                          type="number"
                          defaultValue={running?.sportMaxHr ?? ""}
                          placeholder="192"
                        />
                      </div>
                    </div>
                    <SubmitButton>Save Running</SubmitButton>
                  </form>
                </CardContent>
              </Card>

              {/* Swimming */}
              <Card>
                <CardHeader>
                  <CardTitle>Swimming</CardTitle>
                  <CardDescription>
                    CSS estimated from your swim data. For manual entry: swim
                    400m + 200m all-out, CSS = 200 / (T400 - T200).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={updateSportProfile} className="space-y-4">
                    <input type="hidden" name="sport" value="swimming" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="css">CSS (sec/100m)</Label>
                        <Input
                          id="css"
                          name="cssSPer100m"
                          type="number"
                          defaultValue={swimming?.cssSPer100m ?? ""}
                          placeholder="95"
                        />
                        {swimming?.cssSPer100m && (
                          <p className="text-xs text-muted-foreground">
                            = {formatPacePer100m(swimming.cssSPer100m)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="swim-lthr">LTHR (bpm)</Label>
                        <Input
                          id="swim-lthr"
                          name="lthr"
                          type="number"
                          defaultValue={swimming?.lthr ?? ""}
                          placeholder="155"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="swim-maxhr">Max HR (bpm)</Label>
                        <Input
                          id="swim-maxhr"
                          name="sportMaxHr"
                          type="number"
                          defaultValue={swimming?.sportMaxHr ?? ""}
                          placeholder="178"
                        />
                      </div>
                    </div>
                    <SubmitButton>Save Swimming</SubmitButton>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data & Privacy Tab */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Data &amp; Privacy</CardTitle>
                <CardDescription>
                  Export your data or delete your account. We comply with GDPR
                  and data protection regulations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountActions />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Manage your Paincave subscription.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {subscription?.status === "active"
                          ? "Pro Plan"
                          : "Free Plan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.status === "active"
                          ? "Full access to all features"
                          : "Limited features — upgrade to Pro for $9.99/mo"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        subscription?.status === "active"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {subscription?.status ?? "free"}
                    </Badge>
                  </div>
                  {subscription?.currentPeriodEnd && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {subscription.cancelAtPeriodEnd
                        ? "Cancels"
                        : "Renews"}{" "}
                      on{" "}
                      {subscription.currentPeriodEnd.toLocaleDateString()}
                    </p>
                  )}
                </div>

                {subscription?.status === "active" ? (
                  <ManageSubscriptionButton />
                ) : (
                  <UpgradeButton />
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Pro includes:
                  </p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Fitness Timeline (CTL/ATL/TSB)</li>
                    <li>Coaching engine &amp; weekly workout plans</li>
                    <li>Nutrition targets &amp; fueling plans</li>
                    <li>Workout export (ZWO, FIT, MRC, ICS)</li>
                    <li>Health tracking (HRV, sleep, readiness)</li>
                    <li>Unlimited activity history</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
