import { Inngest, NonRetriableError } from "inngest";
import { InngestMiddleware } from "inngest";
import { db } from "@/lib/db";
import { jobLogs } from "@/lib/db/schema";

/** Write a log entry — fire-and-forget, never throws. */
async function writeLog(
  level: string,
  functionName: string,
  stepName: string | undefined,
  message: string,
  errorCode?: string,
  context?: Record<string, unknown>
) {
  try {
    await db.insert(jobLogs).values({
      level,
      functionName,
      stepName: stepName ?? null,
      errorCode: errorCode ?? null,
      message,
      context: context ?? null,
    });
  } catch {
    // If the DB itself is down, we can't log. Console is last resort.
    console.error("[inngest] Failed to write job log", { level, functionName, message });
  }
}

/**
 * Error classification middleware — applied to ALL Inngest functions.
 * Catches errors at the step level, classifies them, logs to job_logs table,
 * and either stops retries (NonRetriableError) or allows retry.
 */
const errorClassifier = new InngestMiddleware({
  name: "Error Classifier",
  init() {
    return {
      onFunctionRun({ fn }) {
        const fnName = String(typeof fn.id === "function" ? fn.id() : fn.id);
        return {
          transformOutput({ result, step }) {
            if (!result.error) return;

            const err = result.error;
            const msg = err instanceof Error ? err.message : String(err);
            const code = (err as { code?: string })?.code;
            const stepName = step?.displayName ?? step?.name;
            const context = { errorCode: code };

            // Already classified — just log it
            if (err instanceof NonRetriableError) {
              writeLog("error", fnName, stepName, msg, code, context);
              return;
            }

            // ── Postgres errors ──────────────────────────────────
            if (code?.startsWith("53")) {
              writeLog("error", fnName, stepName, `DB resource limit: ${msg}`, code, context);
              throw new NonRetriableError(`DB resource limit [${code}]: ${msg}`, { cause: err });
            }
            if (code?.startsWith("23")) {
              writeLog("error", fnName, stepName, `DB constraint: ${msg}`, code, context);
              throw new NonRetriableError(`DB constraint [${code}]: ${msg}`, { cause: err });
            }
            if (code === "42P01" || code === "42703") {
              writeLog("error", fnName, stepName, `DB schema error: ${msg}`, code, context);
              throw new NonRetriableError(`DB schema error [${code}]: ${msg}`, { cause: err });
            }

            // ── Auth errors — don't retry ────────────────────────
            if (msg.includes("401") || msg.includes("Unauthorized")) {
              writeLog("error", fnName, stepName, `Auth failed: ${msg}`, "401", context);
              throw new NonRetriableError(`Auth failed: ${msg}`, { cause: err });
            }
            if (msg.includes("403") || msg.includes("Forbidden")) {
              writeLog("error", fnName, stepName, `Forbidden: ${msg}`, "403", context);
              throw new NonRetriableError(`Forbidden: ${msg}`, { cause: err });
            }

            // ── Everything else: log and let Inngest retry ───────
            writeLog("warn", fnName, stepName, `Transient error (will retry): ${msg}`, code, context);
          },
        };
      },
    };
  },
});

export const inngest = new Inngest({
  id: "paincave",
  middleware: [errorClassifier],
});
