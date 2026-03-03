import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Activity, Link2, CreditCard } from "lucide-react";

type OverviewData = {
  totalUsers: number;
  new7d: number;
  new30d: number;
  totalActivities: number;
  withStreams: number;
  withoutStreams: number;
  activeConnections: number;
  activeSubscriptions: number;
  dbSize: string;
};

export function AdminOverviewTab({ data }: { data: OverviewData }) {
  const cards = [
    {
      title: "Total Users",
      value: data.totalUsers,
      sub: `+${data.new7d} (7d) / +${data.new30d} (30d)`,
      icon: Users,
    },
    {
      title: "Activities",
      value: data.totalActivities,
      sub: `${data.withStreams} with streams / ${data.withoutStreams} without`,
      icon: Activity,
    },
    {
      title: "Active Connections",
      value: data.activeConnections,
      sub: "Strava / Garmin / Wahoo",
      icon: Link2,
    },
    {
      title: "Subscriptions",
      value: data.activeSubscriptions,
      sub: `DB: ${data.dbSize}`,
      icon: CreditCard,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
