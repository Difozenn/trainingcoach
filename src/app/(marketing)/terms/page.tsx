import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for TrainingCoach endurance training platform.",
};

export default function TermsPage() {
  return (
    <main className="py-20">
      <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-4">
        <h1>Terms of Service</h1>
        <p className="lead">Last updated: March 2026</p>

        <h2>Service Description</h2>
        <p>TrainingCoach is a SaaS platform for endurance athletes (cycling, running, swimming). We provide training metrics, workout recommendations, and nutrition targets based on your synced activity data.</p>

        <h2>Important Disclaimers</h2>
        <ul>
          <li><strong>Not medical advice.</strong> TrainingCoach does not provide medical, health, or diagnostic advice. Always consult a healthcare professional before starting or modifying any training program.</li>
          <li><strong>Not dietary advice.</strong> Nutrition targets are general guidelines based on published sports science research. They do not constitute personalized dietary advice. Consult a registered dietitian for individual nutrition planning.</li>
          <li><strong>Training at your own risk.</strong> You are responsible for assessing your own fitness and health before performing any recommended workout.</li>
        </ul>

        <h2>Account</h2>
        <p>You are responsible for maintaining the security of your account. Use a strong password (minimum 12 characters). You must be at least 16 years old to create an account.</p>

        <h2>Subscriptions and Billing</h2>
        <ul>
          <li>Free tier: no payment required, limited features</li>
          <li>Pro tier: billed monthly via Stripe at the current published rate</li>
          <li>Cancel anytime from Settings — access continues until end of billing period</li>
          <li>No refunds for partial months</li>
        </ul>

        <h2>Data and Privacy</h2>
        <p>See our <a href="/privacy">Privacy Policy</a> for full details on data collection, usage, and your rights.</p>

        <h2>Acceptable Use</h2>
        <p>You may not: reverse-engineer the platform, use automated scripts to access the API, share account credentials, or use the service for any unlawful purpose.</p>

        <h2>Intellectual Property</h2>
        <p>Training metrics formulas are based on published research (Coggan, Banister, Seiler, et al.) and are implemented independently. Your activity data remains yours. You grant us a limited license to process it for service delivery.</p>

        <h2>Limitation of Liability</h2>
        <p>TrainingCoach is provided &quot;as is&quot; without warranty. We are not liable for injuries, health issues, or performance outcomes resulting from following any recommendations provided by the platform.</p>

        <h2>Changes</h2>
        <p>We may update these terms. Material changes will be communicated via email 30 days in advance.</p>

        <h2>Contact</h2>
        <p>Questions: legal@trainingcoach.dev</p>
      </div>
    </main>
  );
}
