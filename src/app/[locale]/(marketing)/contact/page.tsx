import type { Metadata } from "next";
import { resend, FROM_EMAIL } from "@/lib/email/client";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact — Paincave",
  description: "Get in touch with the Paincave team.",
};

async function sendContactEmail(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address." };
  }
  if (message.length > 5000) {
    return { error: "Message too long (max 5000 characters)." };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "info@paincave.io",
      replyTo: email,
      subject: `Contact form: ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });
    return { success: true };
  } catch {
    return { error: "Failed to send message. Please try again later." };
  }
}

export default function ContactPage() {
  return (
    <main className="py-20">
      <div className="mx-auto max-w-xl px-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
        <p className="mt-2 text-muted-foreground">
          Have a question, feedback, or need help? Send us a message and we&apos;ll get back to you.
        </p>
        <div className="mt-8">
          <ContactForm action={sendContactEmail} />
        </div>
      </div>
    </main>
  );
}
