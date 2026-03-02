import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How PainCave collects, uses, and protects your data. GDPR compliant.",
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
          PainCave (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
          operates the website{" "}
          <a href="https://paincave.io">paincave.io</a> and the PainCave
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
          PainCave is the data controller responsible for your personal data.
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
          password is never stored in plain text — it is hashed using Argon2id
          (the current OWASP-recommended algorithm) before storage.
        </p>

        <h3>2.2 Athlete Profile</h3>
        <p>
          To personalise your training recommendations, we collect information
          you voluntarily provide: weight, height, date of birth, experience
          level, sport preferences (cycling, running, swimming), training
          thresholds (FTP, threshold pace, CSS), and goal settings.
        </p>

        <h3>2.3 Activity Data</h3>
        <p>
          When you connect a third-party platform (Strava, Garmin, or Wahoo),
          we receive activity data via their APIs using OAuth. This may include:
        </p>
        <ul>
          <li>Activity type, duration, distance, and timestamps</li>
          <li>Heart rate, power, pace, cadence, and elevation data</li>
          <li>GPS route data (latitude/longitude coordinates)</li>
          <li>Activity title and description</li>
        </ul>
        <p>
          We only access data you authorise through the OAuth consent screen.
          You can revoke access at any time from Settings or directly on the
          third-party platform.
        </p>

        <h3>2.4 Health Data (Sensitive)</h3>
        <p>
          With your <strong>explicit consent</strong>, we may receive health
          metrics from connected devices via Garmin Connect: heart rate
          variability (HRV), resting heart rate, sleep duration, and sleep
          score. This data is classified as sensitive personal data under GDPR
          Article 9 and is processed solely for recovery and readiness
          recommendations within the coaching engine. You may withdraw consent
          and disconnect the integration at any time.
        </p>

        <h3>2.5 Payment Data</h3>
        <p>
          Payments are processed by{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stripe
          </a>
          . We <strong>never</strong> receive or store your credit card number,
          CVV, or full card details. We receive only a Stripe customer ID,
          subscription status, and billing period dates to manage your
          subscription.
        </p>

        <h3>2.6 Usage Data</h3>
        <p>
          We collect standard server logs (IP address, browser type, pages
          visited, timestamps) for security monitoring and service improvement.
          We do not use third-party analytics trackers or advertising pixels.
        </p>

        {/* ── 3. Legal Basis for Processing ──────────────────────── */}
        <h2>3. Legal Basis for Processing (GDPR Article 6)</h2>
        <table>
          <thead>
            <tr>
              <th>Data Category</th>
              <th>Legal Basis</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Account &amp; profile data</td>
              <td>
                <strong>Contract</strong> — necessary to provide the Service
                (Art. 6(1)(b))
              </td>
            </tr>
            <tr>
              <td>Activity data</td>
              <td>
                <strong>Contract</strong> — necessary to calculate training
                metrics (Art. 6(1)(b))
              </td>
            </tr>
            <tr>
              <td>Health data (HRV, sleep)</td>
              <td>
                <strong>Explicit consent</strong> (Art. 9(2)(a))
              </td>
            </tr>
            <tr>
              <td>Payment data</td>
              <td>
                <strong>Contract</strong> — necessary to process subscriptions
                (Art. 6(1)(b))
              </td>
            </tr>
            <tr>
              <td>Usage / server logs</td>
              <td>
                <strong>Legitimate interest</strong> — security and service
                reliability (Art. 6(1)(f))
              </td>
            </tr>
            <tr>
              <td>Transactional emails</td>
              <td>
                <strong>Contract</strong> — service-related communications
                (Art. 6(1)(b))
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 4. How We Use Your Data ────────────────────────────── */}
        <h2>4. How We Use Your Data</h2>
        <p>Your data is used exclusively to:</p>
        <ul>
          <li>
            Calculate training load metrics (TSS, CTL, ATL, TSB) and training
            zones
          </li>
          <li>Generate personalised workout recommendations</li>
          <li>Display nutrition targets (macros, hydration, fuelling)</li>
          <li>Provide recovery readiness assessments (when health data is connected)</li>
          <li>Send transactional emails (welcome, weekly summaries, alerts)</li>
          <li>Process subscription payments via Stripe</li>
          <li>Maintain platform security and prevent abuse</li>
        </ul>
        <p>
          We <strong>do not</strong> sell, rent, or share your personal data
          with third parties for marketing or advertising purposes.{" "}
          <strong>We do not</strong> use your data to train machine learning
          models. <strong>We do not</strong> serve advertisements.
        </p>

        {/* ── 5. Data Processors (Sub-processors) ────────────────── */}
        <h2>5. Third-Party Processors</h2>
        <p>
          We use the following third-party services to operate the platform.
          Each processes data only as necessary to provide their service:
        </p>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Data Shared</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Vercel
                </a>
              </td>
              <td>Hosting &amp; edge functions</td>
              <td>Server logs, IP addresses</td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://neon.tech/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Neon
                </a>
              </td>
              <td>PostgreSQL database</td>
              <td>All stored data (encrypted at rest)</td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe
                </a>
              </td>
              <td>Payment processing</td>
              <td>Email, subscription plan, payment method (PCI DSS compliant)</td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://resend.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Resend
                </a>
              </td>
              <td>Transactional email delivery</td>
              <td>Email address, email content</td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://www.inngest.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Inngest
                </a>
              </td>
              <td>Background job orchestration</td>
              <td>Job metadata, user IDs</td>
            </tr>
          </tbody>
        </table>

        <h3>Connected Platforms (User-Initiated)</h3>
        <p>
          When you connect Strava, Garmin, or Wahoo, you authorise those
          platforms to share data with PainCave via OAuth. These connections are
          initiated and controlled by you and can be revoked at any time.
        </p>

        {/* ── 6. Data Security ───────────────────────────────────── */}
        <h2>6. Data Security</h2>
        <p>We implement the following security measures:</p>
        <ul>
          <li>
            <strong>Encryption in transit</strong>: all connections use TLS 1.2+
            (HTTPS enforced via HSTS)
          </li>
          <li>
            <strong>Encryption at rest</strong>: database encrypted at rest;
            OAuth tokens encrypted with AES-256-GCM before storage
          </li>
          <li>
            <strong>Password hashing</strong>: Argon2id with OWASP-recommended
            parameters
          </li>
          <li>
            <strong>Security headers</strong>: Content Security Policy (CSP),
            X-Frame-Options, X-Content-Type-Options, Referrer-Policy
          </li>
          <li>
            <strong>Rate limiting</strong>: API endpoints are rate-limited to
            prevent abuse
          </li>
          <li>
            <strong>Access control</strong>: all data queries are scoped to the
            authenticated user&apos;s account
          </li>
        </ul>

        {/* ── 7. Data Retention ──────────────────────────────────── */}
        <h2>7. Data Retention</h2>
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Retention Period</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Active account</td>
              <td>Data retained while your account is active</td>
            </tr>
            <tr>
              <td>Account deletion</td>
              <td>
                All personal data permanently deleted within 30 days via cascade
                deletion. Stripe customer record deleted via API.
              </td>
            </tr>
            <tr>
              <td>Server logs</td>
              <td>Automatically purged after 30 days</td>
            </tr>
            <tr>
              <td>Cancelled subscription</td>
              <td>
                Account and data retained (you may still use the free tier).
                Delete your account from Settings to remove all data.
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── 8. International Transfers ─────────────────────────── */}
        <h2>8. International Data Transfers</h2>
        <p>
          Your data may be processed in the United States and the European Union
          by our sub-processors. Where data is transferred outside the EEA, we
          ensure adequate protection through:
        </p>
        <ul>
          <li>
            EU Standard Contractual Clauses (SCCs) with our processors
          </li>
          <li>
            Processor certifications (e.g., Stripe&apos;s PCI DSS compliance,
            Vercel&apos;s SOC 2)
          </li>
        </ul>

        {/* ── 9. Cookies ─────────────────────────────────────────── */}
        <h2>9. Cookies</h2>
        <p>
          PainCave uses only <strong>strictly necessary cookies</strong> for
          authentication (session token). We do not use tracking cookies,
          analytics cookies, or advertising cookies. No cookie consent banner is
          required because we only use essential cookies (ePrivacy Directive
          Article 5(3) exemption).
        </p>

        {/* ── 10. Your Rights ────────────────────────────────────── */}
        <h2>10. Your Rights Under GDPR</h2>
        <p>
          If you are in the European Economic Area (EEA) or the United Kingdom,
          you have the following rights:
        </p>
        <table>
          <thead>
            <tr>
              <th>Right</th>
              <th>How to Exercise</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Access</strong> (Art. 15)</td>
              <td>
                Export all your data as JSON from Settings → Account → Export
                Data
              </td>
            </tr>
            <tr>
              <td><strong>Rectification</strong> (Art. 16)</td>
              <td>
                Update your profile, thresholds, and preferences at any time in
                Settings
              </td>
            </tr>
            <tr>
              <td><strong>Erasure</strong> (Art. 17)</td>
              <td>
                Delete your account and all associated data from Settings →
                Account → Delete Account
              </td>
            </tr>
            <tr>
              <td><strong>Data Portability</strong> (Art. 20)</td>
              <td>
                Download your data in machine-readable JSON format from Settings
              </td>
            </tr>
            <tr>
              <td><strong>Restriction</strong> (Art. 18)</td>
              <td>
                Contact us to restrict processing while we resolve a dispute
              </td>
            </tr>
            <tr>
              <td><strong>Objection</strong> (Art. 21)</td>
              <td>
                Contact us to object to processing based on legitimate interest
              </td>
            </tr>
            <tr>
              <td><strong>Withdraw Consent</strong> (Art. 7(3))</td>
              <td>
                Disconnect health data integrations at any time from Settings
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          To exercise any right, use the in-app tools in Settings or email{" "}
          <a href="mailto:privacy@paincave.io">privacy@paincave.io</a>. We will
          respond within 30 days as required by GDPR.
        </p>
        <p>
          You also have the right to lodge a complaint with your local data
          protection supervisory authority.
        </p>

        {/* ── 11. Children's Privacy ─────────────────────────────── */}
        <h2>11. Children&apos;s Privacy</h2>
        <p>
          PainCave is not intended for individuals under the age of 16. We do
          not knowingly collect personal data from children. If we learn that we
          have collected data from a child under 16, we will delete it promptly.
        </p>

        {/* ── 12. Changes ────────────────────────────────────────── */}
        <h2>12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make
          material changes, we will notify you by email at least 30 days before
          the changes take effect. Non-material changes (e.g., formatting,
          clarifications) may be made without notice. The &ldquo;Last
          updated&rdquo; date at the top of this page indicates the most recent
          revision.
        </p>

        {/* ── 13. Contact ────────────────────────────────────────── */}
        <h2>13. Contact</h2>
        <p>
          For privacy-related questions, data requests, or concerns:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a href="mailto:privacy@paincave.io">privacy@paincave.io</a>
          </li>
          <li>
            Website:{" "}
            <a href="https://paincave.io">paincave.io</a>
          </li>
        </ul>
      </div>
    </main>
  );
}
