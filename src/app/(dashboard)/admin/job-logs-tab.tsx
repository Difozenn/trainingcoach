"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clearOldJobLogs } from "./actions";

type LogEntry = {
  id: string;
  level: string;
  functionName: string;
  stepName: string | null;
  message: string;
  createdAt: string | Date;
};

const levelVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  error: "destructive",
  warn: "secondary",
  info: "outline",
};

export function AdminJobLogsTab({
  logs,
  filters,
}: {
  logs: LogEntry[];
  filters: { levels: string[]; functions: string[] };
}) {
  const [levelFilter, setLevelFilter] = useState("all");
  const [fnFilter, setFnFilter] = useState("all");

  const filtered = logs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (fnFilter !== "all" && log.functionName !== fnFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {filters.levels.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={fnFilter} onValueChange={setFnFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Function" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All functions</SelectItem>
            {filters.functions.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <form action={clearOldJobLogs} className="ml-auto">
          <input type="hidden" name="days" value="7" />
          <Button variant="destructive" size="sm" type="submit">
            Clear logs older than 7d
          </Button>
        </form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[160px]">Time</TableHead>
              <TableHead className="w-[70px]">Level</TableHead>
              <TableHead>Function</TableHead>
              <TableHead>Step</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No logs found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={levelVariant[log.level] ?? "outline"}
                    className={
                      log.level === "warn"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        : ""
                    }
                  >
                    {log.level}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.functionName}
                </TableCell>
                <TableCell className="text-xs">{log.stepName ?? "—"}</TableCell>
                <TableCell className="max-w-[400px] truncate text-xs">
                  {log.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
