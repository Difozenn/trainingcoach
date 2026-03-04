/**
 * Backfill peak powers for existing activities that have stream data.
 *
 * Usage: npx tsx scripts/backfill-peak-powers.ts
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, and, isNull, isNotNull, sql } from "drizzle-orm";
import { calculatePeakPowers } from "@/lib/engine/cycling/power-profile";
import type { StreamDataBlob } from "@/lib/db/schema/activities";

async function main() {
  console.log("Finding cycling activities with streams but no peak powers...");

  const rows = await db
    .select({
      id: activities.id,
      streamData: activities.streamData,
    })
    .from(activities)
    .where(
      and(
        eq(activities.sport, "cycling"),
        isNotNull(activities.streamData),
        isNull(activities.peak5s)
      )
    );

  console.log(`Found ${rows.length} activities to process`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const blob = row.streamData as StreamDataBlob | null;
    if (!blob?.watts?.length) {
      skipped++;
      continue;
    }

    const peaks = calculatePeakPowers(blob.watts);

    await db
      .update(activities)
      .set({
        peak5s: peaks.peak5s,
        peak15s: peaks.peak15s,
        peak30s: peaks.peak30s,
        peak1m: peaks.peak1m,
        peak5m: peaks.peak5m,
        peak10m: peaks.peak10m,
        peak20m: peaks.peak20m,
        peak60m: peaks.peak60m,
      })
      .where(eq(activities.id, row.id));

    updated++;
    if (updated % 50 === 0) {
      console.log(`  Processed ${updated}/${rows.length}...`);
    }
  }

  console.log(`Done! Updated: ${updated}, Skipped (no power): ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
