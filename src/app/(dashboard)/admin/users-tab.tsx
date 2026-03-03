"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "@/lib/data/admin-queries";

export function AdminUsersTab({ users }: { users: AdminUser[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Onboarded</TableHead>
            <TableHead className="text-right">Activities</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead>Platforms</TableHead>
            <TableHead>Sub</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-mono text-xs">{user.email}</TableCell>
              <TableCell>{user.name ?? "—"}</TableCell>
              <TableCell className="text-xs">
                {new Date(user.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {user.provider ?? "credentials"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.onboarding_completed ? "default" : "secondary"}>
                  {user.onboarding_completed ? "Yes" : "No"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{user.activity_count}</TableCell>
              <TableCell className="text-xs">
                {user.last_activity
                  ? new Date(user.last_activity).toLocaleDateString()
                  : "—"}
              </TableCell>
              <TableCell className="text-xs">{user.platforms ?? "—"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.subscription_status === "active" ? "default" : "outline"
                  }
                  className="text-xs"
                >
                  {user.subscription_status ?? "free"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
