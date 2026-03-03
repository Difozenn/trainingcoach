import { db } from "@/lib/db";
import { jobLogs } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

// ── Overview Stats ──────────────────────────────────────────────

export async function getAdminOverview() {
  const rows = await db.execute<{
    total_users: string;
    new_7d: string;
    new_30d: string;
    total_activities: string;
    with_streams: string;
    without_streams: string;
    active_connections: string;
    active_subscriptions: string;
    db_size: string;
  }>(sql`
    SELECT
      (SELECT count(*) FROM users) as total_users,
      (SELECT count(*) FROM users WHERE created_at > now() - interval '7 days') as new_7d,
      (SELECT count(*) FROM users WHERE created_at > now() - interval '30 days') as new_30d,
      (SELECT count(*) FROM activities) as total_activities,
      (SELECT count(*) FROM activities WHERE stream_data IS NOT NULL) as with_streams,
      (SELECT count(*) FROM activities WHERE stream_data IS NULL) as without_streams,
      (SELECT count(*) FROM platform_connections WHERE is_active = true) as active_connections,
      (SELECT count(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
      (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size
  `);

  const r = (rows as unknown as Array<Record<string, string>>)[0];
  return {
    totalUsers: Number(r.total_users),
    new7d: Number(r.new_7d),
    new30d: Number(r.new_30d),
    totalActivities: Number(r.total_activities),
    withStreams: Number(r.with_streams),
    withoutStreams: Number(r.without_streams),
    activeConnections: Number(r.active_connections),
    activeSubscriptions: Number(r.active_subscriptions),
    dbSize: r.db_size ?? "unknown",
  };
}

// ── Users List ──────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  provider: string | null;
  onboarding_completed: boolean | null;
  activity_count: number;
  last_activity: string | null;
  platforms: string | null;
  subscription_status: string | null;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const rows = await db.execute(sql`
    SELECT
      u.id,
      u.email,
      u.name,
      u.created_at,
      a.provider,
      ap.onboarding_completed,
      COALESCE(act.activity_count, 0)::int as activity_count,
      act.last_activity,
      pc.platforms,
      s.status as subscription_status
    FROM users u
    LEFT JOIN LATERAL (
      SELECT provider FROM accounts WHERE user_id = u.id LIMIT 1
    ) a ON true
    LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int as activity_count, MAX(started_at) as last_activity
      FROM activities WHERE user_id = u.id
    ) act ON true
    LEFT JOIN LATERAL (
      SELECT string_agg(platform::text, ', ') as platforms
      FROM platform_connections WHERE user_id = u.id AND is_active = true
    ) pc ON true
    LEFT JOIN subscriptions s ON s.user_id = u.id
    ORDER BY u.created_at DESC
  `);
  return rows as unknown as AdminUser[];
}

// ── Job Logs ────────────────────────────────────────────────────

export async function getAdminJobLogs(options: {
  limit?: number;
  level?: string;
  fn?: string;
  summary?: boolean;
}) {
  const { limit = 50, level, fn, summary } = options;
  const cap = Math.min(limit, 200);

  if (summary) {
    const rows = await db.execute(sql`
      SELECT function_name, level, message,
             COUNT(*) as count,
             MAX(created_at) as last_seen
      FROM job_logs
      ${level ? sql`WHERE level = ${level}` : sql``}
      GROUP BY function_name, level, message
      ORDER BY MAX(created_at) DESC
      LIMIT ${cap}
    `);
    return rows as unknown as Array<Record<string, unknown>>;
  }

  const conditions = [];
  if (level) conditions.push(eq(jobLogs.level, level));
  if (fn) conditions.push(eq(jobLogs.functionName, fn));

  return db
    .select()
    .from(jobLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(jobLogs.createdAt))
    .limit(cap);
}

export async function getJobLogFilterOptions() {
  const [levels, functions] = await Promise.all([
    db.execute<{ level: string }>(
      sql`SELECT DISTINCT level FROM job_logs ORDER BY level`
    ),
    db.execute<{ fn: string }>(
      sql`SELECT DISTINCT function_name as fn FROM job_logs ORDER BY function_name`
    ),
  ]);
  return {
    levels: (levels as unknown as Array<{ level: string }>).map((r) => r.level),
    functions: (functions as unknown as Array<{ fn: string }>).map((r) => r.fn),
  };
}

// ── Stream Backfill Progress ────────────────────────────────────

export type BackfillRow = {
  user_id: string;
  email: string;
  with_streams: number;
  without_streams: number;
  total: number;
  connection_id: string | null;
};

export async function getStreamBackfillProgress(): Promise<BackfillRow[]> {
  const rows = await db.execute(sql`
    SELECT
      u.id as user_id,
      u.email,
      COUNT(*) FILTER (WHERE a.stream_data IS NOT NULL)::int as with_streams,
      COUNT(*) FILTER (WHERE a.stream_data IS NULL)::int as without_streams,
      COUNT(*)::int as total,
      pc.id as connection_id
    FROM users u
    JOIN activities a ON a.user_id = u.id
    LEFT JOIN platform_connections pc
      ON pc.user_id = u.id AND pc.platform = 'strava' AND pc.is_active = true
    GROUP BY u.id, u.email, pc.id
    ORDER BY COUNT(*) FILTER (WHERE a.stream_data IS NULL) DESC
  `);
  return rows as unknown as BackfillRow[];
}
