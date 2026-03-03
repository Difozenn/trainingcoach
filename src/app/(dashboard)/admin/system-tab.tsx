"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triggerStreamBackfill, triggerStravaResync } from "./actions";
import type { BackfillRow } from "@/lib/data/admin-queries";

export function AdminSystemTab({ progress }: { progress: BackfillRow[] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stream Backfill Progress</CardTitle>
          <CardDescription>
            Activities with and without stream data per user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">With Streams</TableHead>
                  <TableHead className="text-right">Without</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No activities found
                    </TableCell>
                  </TableRow>
                )}
                {progress.map((row) => {
                  const pct =
                    row.total > 0
                      ? Math.round((row.with_streams / row.total) * 100)
                      : 0;
                  return (
                    <TableRow key={row.user_id}>
                      <TableCell className="font-mono text-xs">
                        {row.email}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.with_streams}
                      </TableCell>
                      <TableCell className="text-right text-orange-500">
                        {row.without_streams}
                      </TableCell>
                      <TableCell className="text-right">{row.total}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={pct === 100 ? "default" : "secondary"}
                          className="font-mono"
                        >
                          {pct}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <form action={triggerStreamBackfill}>
                            <input
                              type="hidden"
                              name="userId"
                              value={row.user_id}
                            />
                            <input
                              type="hidden"
                              name="platform"
                              value="strava"
                            />
                            <Button variant="outline" size="sm" type="submit">
                              Backfill
                            </Button>
                          </form>
                          {row.connection_id && (
                            <form action={triggerStravaResync}>
                              <input
                                type="hidden"
                                name="userId"
                                value={row.user_id}
                              />
                              <input
                                type="hidden"
                                name="connectionId"
                                value={row.connection_id}
                              />
                              <Button variant="outline" size="sm" type="submit">
                                Re-sync
                              </Button>
                            </form>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>External Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <a
            href="https://app.inngest.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Inngest Dashboard</Button>
          </a>
          <a
            href="https://console.neon.tech"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Neon Console</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
