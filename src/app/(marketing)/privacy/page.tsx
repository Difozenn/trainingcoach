import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Paincave collects, uses, and protects your data. GDPR compliant.",
};

export default function PrivacyPage() {
  return (
    <main className="py-20">
      <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-4">
        <h1>Privacy Policy</h1>
        <p className="lead">
          Effective date: 1 March 2026 &middot; Last updated: 2 March 2026
        </p>

        <p>
          Paincave (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
          operates the website{" "}
          <a href="https://paincave.io">paincave.io</a> and the Paincave
          platform (the &ldquo;Service&rdquo;). This Privacy Policy explains
          what personal data we collect, why we collect it, and your rights
          regarding that data.
        </p>
        <p>
          By creating an account or using the Service, you acknowledge that you
          have read and understood this Privacy Policy.
        </p>

        {/* ── 1. Data Controller ─────────────────────────────────── */}
        <h2>1. Data Controller</h2>
        <p>
          Paincave is the data controller responsible for your personal data.
          For questions about this policy or to exercise your rights, contact us
          at{" "}
          <a href="mailto:privacy@paincave.io">privacy@paincave.io</a>.
        </p>

        {/* ── 2. Data We Collect ─────────────────────────────────── */}
        <h2>2. Data We Collect</h2>

        <h3>2.1 Account Data</h3>
        <p>
          When you register, we collect your <strong>name</strong>,{" "}
          <strong>email address</strong>, and a <strong>password</strong>. Your
          password is securely hashed before storage and is never stored in
          plain text.
        </p>

        <h3>2.2 Athlete Profile</h3>
        <p>
          To personalise your training recommendations, we collect information
          you voluntarily provide: weight, height, date of birth, experience
          level, sport preferences, training thresholds, and goal settings.
        </p>

        <h3>2.3 Activity Data</h3>
        <p>
          When you connect a third-party platform (Strava, Garmin, or Wahoo),
          we receive activity data via their APIs. This may include activity
          type, duration, distance, heart rate, power, pace, cadence, elevation,
          GPS route data, and timestamps.
        </p>
        <p>
          We only access data you authorise through the connection process.
          You can revoke access at any time from Settings or directly on the
          third-party platform.
        </p>

        <h3>2.4 Health Data (Sensitive)</h3>
        <p>
          With your <strong>explicit consent</strong>, we may receive health
          metrics from connected devices: heart rate variability (HRV), resting
          heart rate, and sleep data. This data is classified as sensitive
          personal data under GDPR Article 9 and is used solely for recovery
          recommendations. You may withdraw consent and disconnect the
          integration at any time.
        </p>

        <h3>2.5 Payment Data</h3>
        <p>
          Payments are processed by Stripe, a PCI-compliant payment processor.
          We <strong>never</strong> receive or store your credit card number or
          full card details. We only receive subscription status and billing
          dates to manage your account.
        </p>

        <h3>2.6 Usage Data</h3>
        <p>
          We collect standard server logs (IP address, browser type, pages
          visited, timestamps) for security monitoring and service improvement.
          We do not use advertising trackers or third-party analytics that
          profile you.
        </p>

        {/* ── 3. Legal Basis for Processing ──────────────────────── */}
        <h2>3. Legal Basis for Processing</h2>
        <ul>
          <li>
            <strong>Contract</strong> (Art. 6(1)(b)) — account data, profile
            data, activity data, payment data, and transactional emails are
            necessary to provide the Service.
          </li>
          <li>
            <strong>Explicit consent</strong> (Art. 9(2)(a)) — health data
            (HRV, sleep) is only collected with your active consent.
          </li>
          <li>
            <strong>Legitimate interest</strong> (Art. 6(1)(f)) — server logs
            are collected for security and service reliability.
          </li>
        </ul>

        {/* ── 4. How We Use Your Data ────────────────────────────── */}
        <h2>4. How We Use Your Data</h2>
        <p>Your data is used exclusively to:</p>
        <ul>
          <li>Calculate training metrics and training zones</li>
          <li>Generate personalised workout recommendations</li>
          <li>Display nutrition targets</li>
          <li>Provide recovery assessments (when health data is connected)</li>
          <li>Send service-related emails (welcome, weekly summaries, alerts)</li>
          <li>Process subscription payments</li>
          <li>Maintain platform security</li>
        </ul>
        <p>
          We <strong>do not</strong> sell, rent, or share your personal data for
          marketing or advertising.{" "}
          <strong>We do not</strong> use your data to train machine learning
          models. <strong>We do not</strong> serve advertisements.
        </p>

        {/* ── 5. Third Parties ─────────────────────────────────── */}
        <h2>5. Third Parties</h2>
        <p>
          We use a limited number of third-party service providers to operate
          the platform. These include providers for hosting, database storage,
          payment processing, and email delivery. Each provider processes data
          only as necessary to deliver their service and is bound by data
          processing agreements.
        </p>
        <p>
          When you connect Strava, Garmin, or Wahoo, you authorise those
          platforms to share your activity data with Paincave. These connections
          are initiated and controlled by you and can be revoked at any time.
        </p>

        {/* ── 6. Data Security ───────────────────────────────────── */}
        <h2>6. Data Security</h2>
        <p>
          We take appropriate technical and organisational measures to protect
          your personal data, including encryption of data in transit and at
          rest, secure password storage, and access controls that ensure your
          data is only accessible to you.
        </p>

        {/* ── 7. Data Retention ──────────────────────────────────── */}
        <h2>7. Data Retention</h2>
        <ul>
          <li>
            <strong>Active account:</strong> your data is retained while your
            account is active.
          </li>
          <li>
            <strong>Account deletion:</strong> all personal data is permanently
            deleted within 30 days of your request.
          </li>
          <li>
            <strong>Cancelled subscription:</strong> your account and data are
            retained (you may continue using the free tier). Delete your account
            from Settings to remove all data.
          </li>
          <li>
            <strong>Server logs:</strong> automatically purged after 30 days.
          </li>
        </ul>

        {/* ── 8. International Transfers ─────────────────────────── */}
        <h2>8. International Data Transfers</h2>
        <p>
          Your data may be processed in the United States and the European
          Union. Where data is transferred outside the EEA, we ensure adequate
          protection through EU Standard Contractual Clauses (SCCs) with our
          processors.
        </p>

        {/* ── 9. Cookies ─────────────────────────────────────────── */}
        <h2>9. Cookies</h2>
        <p>
          Paincave uses only <strong>strictly necessary cookies</strong> for
          authentication (session management). We do not use tracking cookies,
          analytics cookies, or advertising cookies.
        </p>

        {/* ── 10. Your Rights ────────────────────────────────────── */}
        <h2>10. Your Rights Under GDPR</h2>
        <p>
          If you are in the European Economic Area (EEA) or the United Kingdom,
          you have the right to:
        </p>
        <ul>
          <li>
            <strong>Access</strong> your data — export all your data from
            Settings
          </li>
          <li>
            <strong>Rectify</strong> your data — update your profile and
            preferences at any time
          </li>
          <li>
            <strong>Delete</strong> your data — permanently delete your account
            from Settings
          </li>
          <li>
            <strong>Port</strong> your data — download your data in
            machine-readable format
          </li>
          <li>
            <strong>Restrict or object</strong> to processing — contact us to
            discuss
          </li>
          <li>
            <strong>Withdraw consent</strong> — disconnect health data
            integrations at any time
          </li>
        </ul>
        <p>
          To exercise any right, use the tools in Settings or email{" "}
          <a href="mailto:privacy@paincave.io">privacy@paincave.io</a>. We
          will respond within 30 days.
        </p>
        <p>
          You also have the right to lodge a complaint with your local data
          protection supervisory authority.
        </p>

        {/* ── 11. Children's Privacy ─────────────────────────────── */}
        <h2>11. Children&apos;s Privacy</h2>
        <p>
          Paincave is not intended for individuals under the age of 16. We do
          not knowingly collect personal data from children. If we learn that we
          have collected data from a child under 16, we will delete it promptly.
        </p>

        {/* ── 12. Changes ────────────────────────────────────────── */}
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes
          will be communicated via email at least 30 days before they take
          effect. The &ldquo;Last updated&rdquo; date at the top indicates the
          most recent revision.
        </p>

        {/* ── 13. Contact ────────────────────────────────────────── */}
        <h2>13. Contact</h2>
        <p>
          For privacy-related questions or data requests:{" "}
          <a href="mailto:privacy@paincave.io">privacy@paincave.io</a>
        </p>
      </div>
    </main>
  );
}
