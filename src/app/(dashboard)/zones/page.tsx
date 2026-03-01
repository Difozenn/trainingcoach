import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ZonesPage() {
  return (
    <>
      <DashboardHeader title="Zone Analysis" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Cycling Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Coggan 7-zone power model based on FTP. Set your FTP in
                settings to see personalized zones.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Running Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                6-zone pace model based on threshold pace. Auto-detected from
                your run data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Swimming Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                5-zone CSS model based on Critical Swim Speed. Estimated from
                your swim data.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
