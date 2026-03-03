import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobLogs } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

/**
 * GET /api/admin/logs — query recent job errors.
 * Protected by a simple bearer token (ADMIN_API_KEY env var).
 *
 * Query params:
 *   ?limit=20          — max rows (default 20)
 *   ?level=error       — filter by level
 *   ?fn=fetch-single-stream  — filter by function name
 *   ?summary=true      — group by function+message, show counts
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || token !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const limit = Math.min(Number(params.get("limit") || 50), 200);
  const level = params.get("level");
  const fn = params.get("fn");
  const summary = params.get("summary") === "true";

  if (summary) {
    // Aggregated view: count by function + message
    const rows = await db.execute<{
      function_name: string;
      level: string;
      message: string;
      count: string;
      last_seen: string;
    }>(sql`
      SELECT function_name, level, message,
             COUNT(*) as count,
             MAX(created_at) as last_seen
      FROM job_logs
      ${level ? sql`WHERE level = ${level}` : sql``}
      GROUP BY function_name, level, message
      ORDER BY MAX(created_at) DESC
      LIMIT ${limit}
    `);
    return NextResponse.json({ logs: rows });
  }

  // Detailed view
  let query = db
    .select()
    .from(jobLogs)
    .orderBy(desc(jobLogs.createdAt))
    .limit(limit);

  if (level) {
    query = query.where(eq(jobLogs.level, level)) as typeof query;
  }
  if (fn) {
    query = query.where(eq(jobLogs.functionName, fn)) as typeof query;
  }

  const rows = await query;
  return NextResponse.json({ logs: rows });
}
