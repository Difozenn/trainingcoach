/**
 * Recalculate TSS with ROLLING FTP model + HR adjustment.
 *
 * FTP = best HR-adjusted peak_20m in rolling 90-day window × 0.95
 * HR adjustment: if avg HR during best 20min < LTHR (92% maxHR), scale up.
 */
const postgres = require('postgres');
const sql = postgres('postgresql://neondb_owner:npg_n3rsGF6kXJuR@ep-silent-grass-agpmbgn2-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require');

const WINDOW_DAYS = 90;
const LTHR_PCT = 0.92;
const MAX_HR_SCALE = 1.15; // cap adjustment at 15%

(async () => {
  try {
    const users = await sql`SELECT DISTINCT user_id FROM activities LIMIT 1`;
    if (users.length === 0) { console.log('No activities'); return; }
    const userId = users[0].user_id;

    const [profile] = await sql`SELECT max_hr FROM athlete_profiles WHERE user_id = ${userId}`;
    const maxHr = profile?.max_hr || 0;
    const lthr = Math.round(maxHr * LTHR_PCT);
    console.log('User:', userId, '| MaxHR:', maxHr, '| LTHR:', lthr);

    // Get all cycling activities
    const acts = await sql`
      SELECT id, external_id, name, started_at,
             normalized_power, average_power_watts,
             duration_seconds, moving_time_seconds, peak_20m
      FROM activities WHERE user_id = ${userId} AND sport = 'cycling'
      ORDER BY started_at ASC
    `;
    console.log('Cycling activities:', acts.length);

    // For activities with streams, compute HR-adjusted peak_20m
    console.log('\nComputing HR-adjusted peaks from streams...');
    const hrAdjustedPeaks = new Map(); // activityId -> adjustedPeak20m
    let streamsProcessed = 0;

    // Process in batches to manage memory
    const BATCH = 50;
    const withPeak = acts.filter(a => a.peak_20m > 0);
    for (let b = 0; b < withPeak.length; b += BATCH) {
      const batch = withPeak.slice(b, b + BATCH);
      const ids = batch.map(a => a.id);
      const streams = await sql`SELECT id, stream_data FROM activities WHERE id = ANY(${ids}) AND stream_data IS NOT NULL`;

      for (const row of streams) {
        const sd = row.stream_data;
        if (!sd?.watts || !sd?.heartrate || sd.watts.length < 1200) continue;

        const watts = sd.watts;
        const hr = sd.heartrate;
        const windowSize = 1200;

        let maxAvg = 0, bestStart = 0, wSum = 0;
        for (let i = 0; i < watts.length; i++) {
          wSum += watts[i];
          if (i >= windowSize) wSum -= watts[i - windowSize];
          if (i >= windowSize - 1) {
            const avg = wSum / windowSize;
            if (avg > maxAvg) { maxAvg = avg; bestStart = i - windowSize + 1; }
          }
        }

        if (maxAvg === 0 || !maxHr) {
          hrAdjustedPeaks.set(row.id, maxAvg);
          continue;
        }

        let hrSum = 0, hrCount = 0;
        for (let i = bestStart; i < bestStart + windowSize && i < hr.length; i++) {
          if (hr[i] > 0) { hrSum += hr[i]; hrCount++; }
        }

        if (hrCount > 0) {
          const avgHrW = hrSum / hrCount;
          if (avgHrW < lthr) {
            const scale = Math.min(MAX_HR_SCALE, lthr / avgHrW);
            hrAdjustedPeaks.set(row.id, maxAvg * scale);
          } else {
            hrAdjustedPeaks.set(row.id, maxAvg);
          }
        } else {
          hrAdjustedPeaks.set(row.id, maxAvg);
        }
        streamsProcessed++;
      }
      process.stdout.write(`\r  Processed ${Math.min(b + BATCH, withPeak.length)}/${withPeak.length}...`);
    }
    console.log(`\n  HR-adjusted ${streamsProcessed} activities with streams`);

    // Walk chronologically with rolling window
    const windowPeaks = [];
    let currentFtp = 0, prevFtp = 0;
    const ftpChanges = [];
    const updateBatch = [];

    for (const act of acts) {
      const actDate = new Date(act.started_at);
      const durMin = (act.moving_time_seconds || act.duration_seconds) / 60;

      // Get the best peak value (HR-adjusted if available, else raw)
      let windowValue = 0;
      if (hrAdjustedPeaks.has(act.id)) {
        windowValue = hrAdjustedPeaks.get(act.id);
      } else if (act.peak_20m > 0) {
        windowValue = act.peak_20m;
      } else if (durMin >= 20) {
        const np = act.normalized_power || act.average_power_watts;
        if (np > 0) windowValue = np;
      }

      if (windowValue > 0) {
        windowPeaks.push({ date: actDate, value: windowValue, name: act.name, externalId: act.external_id });
      }

      // Remove peaks older than 90 days
      const cutoff = new Date(actDate);
      cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
      while (windowPeaks.length > 0 && windowPeaks[0].date < cutoff) windowPeaks.shift();

      if (windowPeaks.length > 0) {
        currentFtp = Math.round(Math.max(...windowPeaks.map(p => p.value)) * 0.95);
      }

      if (currentFtp !== prevFtp && currentFtp > 0) {
        const best = windowPeaks.reduce((a, b) => a.value > b.value ? a : b, windowPeaks[0]);
        ftpChanges.push({ date: actDate, ftp: currentFtp, name: best.name, externalId: best.externalId, dir: currentFtp > prevFtp ? '↑' : '↓' });
        prevFtp = currentFtp;
      }

      const np = act.normalized_power || act.average_power_watts;
      if (!np || currentFtp === 0) {
        updateBatch.push({ id: act.id, tss: null, intensity_factor: null, ftp_used: null });
        continue;
      }

      const ifact = np / currentFtp;
      const durH = (act.moving_time_seconds || act.duration_seconds) / 3600;
      updateBatch.push({
        id: act.id,
        tss: Math.round(durH * ifact * ifact * 100 * 10) / 10,
        intensity_factor: Math.round(ifact * 1000) / 1000,
        ftp_used: currentFtp,
      });
    }

    console.log('\n=== FTP CHANGES (last 10) ===');
    for (const fc of ftpChanges.slice(-10)) {
      console.log(`  ${new Date(fc.date).toISOString().slice(0,10)} ${fc.dir} FTP=${fc.ftp}W ${(fc.name||'').slice(0,40)}`);
    }
    console.log(`Final FTP: ${currentFtp}W`);

    // Update activities
    console.log('\nUpdating activities...');
    let updated = 0;
    for (const row of updateBatch) {
      await sql`UPDATE activities SET tss=${row.tss}, intensity_factor=${row.intensity_factor}, ftp_used=${row.ftp_used} WHERE id=${row.id}`;
      updated++;
      if (updated % 200 === 0) process.stdout.write(`\r  ${updated}/${updateBatch.length}...`);
    }
    console.log(`\n  Updated ${updated} activities`);

    // Rebuild threshold_history
    await sql`DELETE FROM threshold_history WHERE user_id=${userId} AND sport='cycling' AND metric_name='ftp'`;
    const bts = ftpChanges.filter(f => f.dir === '↑');
    for (const bt of bts) {
      await sql`INSERT INTO threshold_history (id,user_id,sport,metric_name,value,source,activity_id,detected_at) VALUES (${crypto.randomUUID()},${userId},'cycling','ftp',${bt.ftp},'auto_detect',${bt.externalId},${bt.date})`;
    }
    await sql`UPDATE sport_profiles SET ftp=${currentFtp}, updated_at=NOW() WHERE user_id=${userId} AND sport='cycling'`;
    console.log(`Sport profile FTP: ${currentFtp}W`);

    // Rebuild daily_metrics
    console.log('\nRebuilding daily_metrics...');
    const dailyTss = await sql`
      SELECT DATE(started_at) AS day,
        COALESCE(SUM(CASE WHEN sport='cycling' THEN tss ELSE 0 END),0) AS c,
        COALESCE(SUM(CASE WHEN sport='running' THEN tss ELSE 0 END),0) AS r,
        COALESCE(SUM(CASE WHEN sport='swimming' THEN tss ELSE 0 END),0) AS s,
        COALESCE(SUM(tss),0) AS t
      FROM activities WHERE user_id=${userId} AND tss IS NOT NULL
      GROUP BY DATE(started_at) ORDER BY day ASC
    `;
    const tssMap = new Map();
    for (const row of dailyTss) tssMap.set(new Date(row.day).toISOString().split('T')[0], { c: +row.c, r: +row.r, s: +row.s, t: +row.t });

    const health = await sql`SELECT date,hrv,resting_hr,sleep_score,body_battery,training_readiness,stress_level FROM daily_metrics WHERE user_id=${userId} AND (hrv IS NOT NULL OR resting_hr IS NOT NULL)`;
    const hMap = new Map();
    for (const h of health) hMap.set(new Date(h.date).toISOString().split('T')[0], h);

    await sql`DELETE FROM daily_metrics WHERE user_id=${userId}`;

    const firstDay = new Date(dailyTss[0].day);
    const today = new Date(); today.setUTCHours(0,0,0,0);
    let ctl=0, atl=0, cur=new Date(firstDay), ins=0;
    const batch = [];

    while (cur <= today) {
      const k = cur.toISOString().split('T')[0];
      const d = tssMap.get(k) || {c:0,r:0,s:0,t:0};
      ctl += (d.t - ctl) / 42;
      atl += (d.t - atl) / 7;
      const h = hMap.get(k);
      batch.push({ id:crypto.randomUUID(), user_id:userId, date:new Date(cur),
        total_tss:Math.round(d.t*10)/10, cycling_tss:Math.round(d.c*10)/10, running_tss:Math.round(d.r*10)/10, swimming_tss:Math.round(d.s*10)/10,
        ctl:Math.round(ctl*10)/10, atl:Math.round(atl*10)/10, tsb:Math.round((ctl-atl)*10)/10, ramp_rate:Math.round(((d.t-ctl)/42)*7*10)/10,
        hrv:h?.hrv||null, resting_hr:h?.resting_hr||null, sleep_score:h?.sleep_score||null, body_battery:h?.body_battery||null, training_readiness:h?.training_readiness||null, stress_level:h?.stress_level||null });
      if (batch.length >= 500) { await sql`INSERT INTO daily_metrics ${sql(batch)}`; ins+=batch.length; batch.length=0; }
      cur.setUTCDate(cur.getUTCDate()+1);
    }
    if (batch.length) { await sql`INSERT INTO daily_metrics ${sql(batch)}`; ins+=batch.length; }

    console.log(`Rebuilt ${ins} daily_metrics`);
    console.log(`\n=== FINAL ===\nFTP: ${currentFtp}W | CTL: ${Math.round(ctl*10)/10} | ATL: ${Math.round(atl*10)/10} | TSB: ${Math.round((ctl-atl)*10)/10}`);
  } catch(e) { console.error('ERROR:', e.message, e.stack); }
  finally { await sql.end(); }
})();
