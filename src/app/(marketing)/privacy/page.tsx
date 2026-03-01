import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TrainingCoach collects, uses, and protects your data. GDPR compliant.",
};

export default function PrivacyPage() {
  return (
    <main className="py-20">
      <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-4">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: March 2026</p>

        <h2>What We Collect</h2>
        <ul>
          <li><strong>Account data</strong>: name, email, password hash (Argon2id)</li>
          <li><strong>Athlete profile</strong>: weight, height, date of birth, experience level, sport preferences</li>
          <li><strong>Activity data</strong>: synced from Strava/Garmin/Wahoo via OAuth (power, HR, pace, GPS, cadence)</li>
          <li><strong>Health data</strong>: HRV, resting HR, sleep score (from Garmin, with explicit consent)</li>
          <li><strong>Payment data</strong>: processed by Stripe — we never see your card number</li>
        </ul>

        <h2>How We Use It</h2>
        <p>Your data is used exclusively to calculate training metrics, generate workout recommendations, and display nutrition targets. We do not sell, share, or use your data for advertising.</p>

        <h2>Data Security</h2>
        <ul>
          <li>OAuth tokens encrypted with AES-256-GCM at rest</li>
          <li>Passwords hashed with Argon2id (OWASP 2025 standard)</li>
          <li>All connections over TLS/HTTPS</li>
          <li>HSTS, CSP, and security headers enforced</li>
        </ul>

        <h2>Health Data</h2>
        <p>Health metrics (HRV, resting HR, sleep) are classified as sensitive data. We collect this only with your explicit consent during platform connection. This data is used solely for recovery recommendations in the coaching engine.</p>

        <h2>Your Rights (GDPR)</h2>
        <ul>
          <li><strong>Access</strong>: Export all your data as JSON from Settings</li>
          <li><strong>Deletion</strong>: Delete your account and all associated data permanently</li>
          <li><strong>Portability</strong>: Download your data in a machine-readable format</li>
          <li><strong>Rectification</strong>: Update your profile data at any time</li>
        </ul>

        <h2>Data Retention</h2>
        <p>Active accounts: data retained while account is active. Deleted accounts: all data permanently removed within 30 days via cascade deletion.</p>

        <h2>Third Parties</h2>
        <ul>
          <li><strong>Strava/Garmin/Wahoo</strong>: OAuth for activity sync (revocable)</li>
          <li><strong>Stripe</strong>: payment processing (PCI compliant)</li>
          <li><strong>Vercel</strong>: hosting infrastructure</li>
          <li><strong>Resend</strong>: transactional emails only</li>
        </ul>

        <h2>Contact</h2>
        <p>For privacy questions: privacy@trainingcoach.dev</p>
      </div>
    </main>
  );
}
