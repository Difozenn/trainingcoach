/**
 * Recalculate TSS for all cycling activities using FTP decay model.
 *
 * 1. Adds ftp_used column if not present
 * 2. Walks all cycling activities chronologically
 * 3. Builds FTP timeline with exponential decay (τ=90 days)
 * 4. Recalculates TSS/IF for each activity with time-appropriate FTP
 * 5. Updates activities.tss, activities.intensity_factor, activities.ftp_used
 * 6. Clears old threshold_history and rebuilds from timeline
 * 7. Rebuilds daily_metrics with corrected TSS
 */
const postgres = require('postgres');
const sql = postgres('postgresql://neondb_owner:npg_n3rsGF6kXJuR@ep-silent-grass-agpmbgn2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require');

const TAU = 90; // days — decay time constant
const FTP_FLOOR_RATIO = 0.6; // FTP won't decay below 60% of peak

function getEffectiveFTP(lastFtp, lastFtpDate, currentDate) {
  const daysSince = (currentDate.getTime() - lastFtpDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 0) return lastFtp;
  const decayed = lastFtp * Math.exp(-daysSince / TAU);
  const floor = lastFtp * FTP_FLOOR_RATIO;
  return Math.round(Math.max(decayed, floor));
}

(async () => {
  try {
    // Step 0: Add ftp_used column if it doesn't exist
    const cols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'activities' AND column_name = 'ftp_used'
    `;
    if (cols.length === 0) {
      await sql`ALTER TABLE activities ADD COLUMN ftp_used integer`;
      console.log('Added ftp_used column to activities');
    } else {
      console.log('ftp_used column already exists');
    }

    // Step 1: Get user ID
    const users = await sql`SELECT DISTINCT user_id FROM activities LIMIT 1`;
    if (users.length === 0) { console.log('No activities found'); return; }
    const userId = users[0].user_id;
    console.log('User:', userId);

    // Step 2: Get all cycling activities chronologically
    const cyclingActivities = await sql`
      SELECT id, external_id, name, started_at,
             normalized_power, average_power_watts,
             duration_seconds, moving_time_seconds, tss, intensity_factor
      FROM activities
      WHERE user_id = ${userId} AND sport = 'cycling'
      ORDER BY started_at ASC
    `;
    console.log('Cycling activities:', cyclingActivities.length);

    // Step 3: Build FTP timeline with decay
    let currentFtp = 0;
    let currentFtpDate = new Date(0);
    const ftpTimeline = [];
    let breakthroughs = 0;

    // Clear old cycling threshold history for rebuild
    await sql`DELETE FROM threshold_history WHERE user_id = ${userId} AND sport = 'cycling' AND metric_name = 'ftp'`;
    console.log('Cleared old FTP threshold history');

    const updateBatch = [];

    for (const act of cyclingActivities) {
      const np = act.normalized_power || act.average_power_watts;
      if (!np) {
        // No power data — keep existing TSS (HR-based)
        updateBatch.push({ id: act.id, ftp_used: null });
        continue;
      }

      let effectiveFtp;
      if (currentFtp === 0) {
        // Bootstrap: first activity with power
        const candidateFtp = Math.round(np * 0.95);
        if (candidateFtp > 0) {
          currentFtp = candidateFtp;
          currentFtpDate = new Date(act.started_at);
          effectiveFtp = currentFtp;
          breakthroughs++;
          ftpTimeline.push({ date: act.started_at, ftp: currentFtp, breakthrough: true, name: act.name });

          await sql`INSERT INTO threshold_history (id, user_id, sport, metric_name, value, source, activity_id, detected_at)
                    VALUES (${crypto.randomUUID()}, ${userId}, 'cycling', 'ftp', ${currentFtp}, 'auto_detect', ${act.external_id}, ${act.started_at})`;
        } else {
          updateBatch.push({ id: act.id, ftp_used: null });
          continue;
        }
      } else {
        // Apply decay from last FTP date to this activity
        effectiveFtp = getEffectiveFTP(currentFtp, currentFtpDate, new Date(act.started_at));

        // Check for breakthrough
        const candidateFtp = Math.round(np * 0.95);
        if (candidateFtp > effectiveFtp) {
          currentFtp = candidateFtp;
          currentFtpDate = new Date(act.started_at);
          effectiveFtp = currentFtp;
          breakthroughs++;
          ftpTimeline.push({ date: act.started_at, ftp: currentFtp, breakthrough: true, name: act.name });

          await sql`INSERT INTO threshold_history (id, user_id, sport, metric_name, value, source, activity_id, detected_at)
                    VALUES (${crypto.randomUUID()}, ${userId}, 'cycling', 'ftp', ${currentFtp}, 'auto_detect', ${act.external_id}, ${act.started_at})`;
        } else {
          ftpTimeline.push({ date: act.started_at, ftp: effectiveFtp, breakthrough: false });
        }
      }

      // Recalculate TSS with time-appropriate FTP
      const power = np;
      const intensityFactor = power / effectiveFtp;
      const durationHours = (act.moving_time_seconds || act.duration_seconds) / 3600;
      const newTss = Math.round(durationHours * intensityFactor * intensityFactor * 100 * 10) / 10;
      const newIf = Math.round(intensityFactor * 1000) / 1000;

      updateBatch.push({
        id: act.id,
        tss: newTss,
        intensity_factor: newIf,
        ftp_used: effectiveFtp,
      });
    }

    // Step 4: Apply updates in batches
    console.log('\nFTP Timeline:');
    for (const entry of ftpTimeline.filter(e => e.breakthrough)) {
      const d = new Date(entry.date).toISOString().split('T')[0];
      console.log(`  ${d} FTP=${entry.ftp}W ${entry.breakthrough ? '★ BREAKTHROUGH' : ''} ${entry.name || ''}`);
    }
    console.log(`\nBreakthroughs: ${breakthroughs}`);
    console.log(`Current effective FTP (decayed to today): ${getEffectiveFTP(currentFtp, currentFtpDate, new Date())}W`);
    console.log(`Peak FTP: ${currentFtp}W (set ${currentFtpDate.toISOString().split('T')[0]})`);

    let updated = 0;
    for (const row of updateBatch) {
      if (row.tss !== undefined) {
        await sql`
          UPDATE activities SET
            tss = ${row.tss},
            intensity_factor = ${row.intensity_factor},
            ftp_used = ${row.ftp_used}
          WHERE id = ${row.id}
        `;
      } else {
        await sql`UPDATE activities SET ftp_used = ${row.ftp_used} WHERE id = ${row.id}`;
      }
      updated++;
      if (updated % 100 === 0) process.stdout.write(`\r  Updated ${updated}/${updateBatch.length} activities...`);
    }
    console.log(`\nUpdated ${updated} cycling activities`);

    // Update sport profile to current effective FTP (decayed to today)
    const currentEffective = getEffectiveFTP(currentFtp, currentFtpDate, new Date());
    await sql`
      UPDATE sport_profiles SET ftp = ${currentEffective}, updated_at = NOW()
      WHERE user_id = ${userId} AND sport = 'cycling'
    `;
    console.log(`Sport profile FTP updated to ${currentEffective}W (decayed from peak ${currentFtp}W)`);

    // Step 5: Rebuild daily_metrics
    console.log('\nRebuilding daily_metrics...');

    const dailyTss = await sql`
      SELECT DATE(started_at) AS day,
        COALESCE(SUM(CASE WHEN sport='cycling' THEN tss ELSE 0 END),0) AS cycling_tss,
        COALESCE(SUM(CASE WHEN sport='running' THEN tss ELSE 0 END),0) AS running_tss,
        COALESCE(SUM(CASE WHEN sport='swimming' THEN tss ELSE 0 END),0) AS swimming_tss,
        COALESCE(SUM(tss),0) AS total_tss
      FROM activities WHERE user_id = ${userId} AND tss IS NOT NULL
      GROUP BY DATE(started_at) ORDER BY day ASC
    `;
    console.log('Days with TSS:', dailyTss.length);

    const tssMap = new Map();
    for (const row of dailyTss) {
      const key = new Date(row.day).toISOString().split('T')[0];
      tssMap.set(key, {
        c: Number(row.cycling_tss),
        r: Number(row.running_tss),
        s: Number(row.swimming_tss),
        t: Number(row.total_tss),
      });
    }

    // Preserve health data
    const healthData = await sql`
      SELECT date, hrv, resting_hr, sleep_score, body_battery, training_readiness, stress_level
      FROM daily_metrics WHERE user_id = ${userId}
        AND (hrv IS NOT NULL OR resting_hr IS NOT NULL OR sleep_score IS NOT NULL)
    `;
    const healthMap = new Map();
    for (const row of healthData) {
      const key = new Date(row.date).toISOString().split('T')[0];
      healthMap.set(key, row);
    }
    console.log('Preserved health data for', healthMap.size, 'days');

    await sql`DELETE FROM daily_metrics WHERE user_id = ${userId}`;

    const firstDay = new Date(dailyTss[0].day);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let ctl = 0;
    let atl = 0;
    const current = new Date(firstDay);
    let inserted = 0;
    const batch = [];

    while (current <= today) {
      const key = current.toISOString().split('T')[0];
      const d = tssMap.get(key) || { c: 0, r: 0, s: 0, t: 0 };

      ctl = ctl + (d.t - ctl) / 42;
      atl = atl + (d.t - atl) / 7;
      const tsb = ctl - atl;
      const rampRate = ((d.t - ctl) / 42) * 7;

      const health = healthMap.get(key);

      batch.push({
        id: crypto.randomUUID(),
        user_id: userId,
        date: new Date(current),
        total_tss: Math.round(d.t * 10) / 10,
        cycling_tss: Math.round(d.c * 10) / 10,
        running_tss: Math.round(d.r * 10) / 10,
        swimming_tss: Math.round(d.s * 10) / 10,
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10,
        ramp_rate: Math.round(rampRate * 10) / 10,
        hrv: health?.hrv || null,
        resting_hr: health?.resting_hr || null,
        sleep_score: health?.sleep_score || null,
        body_battery: health?.body_battery || null,
        training_readiness: health?.training_readiness || null,
        stress_level: health?.stress_level || null,
      });

      if (batch.length >= 500) {
        await sql`INSERT INTO daily_metrics ${sql(batch)}`;
        inserted += batch.length;
        batch.length = 0;
        process.stdout.write('\r  Inserted ' + inserted + ' rows...');
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    if (batch.length > 0) {
      await sql`INSERT INTO daily_metrics ${sql(batch)}`;
      inserted += batch.length;
    }

    console.log(`\nRebuilt ${inserted} daily_metrics rows`);
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`CTL: ${Math.round(ctl * 10) / 10}`);
    console.log(`ATL: ${Math.round(atl * 10) / 10}`);
    console.log(`TSB: ${Math.round((ctl - atl) * 10) / 10}`);
    console.log(`FTP: ${currentEffective}W (peak ${currentFtp}W on ${currentFtpDate.toISOString().split('T')[0]})`);

  } catch(e) {
    console.error('ERROR:', e.message, e.stack);
  } finally {
    await sql.end();
  }
})();
