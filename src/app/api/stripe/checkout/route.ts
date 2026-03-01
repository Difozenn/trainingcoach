import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Create a Stripe Checkout session for Pro subscription.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check for existing subscription
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (existing?.status === "active") {
    return NextResponse.json(
      { error: "Already subscribed" },
      { status: 400 }
    );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: existing?.stripeCustomerId
      ? undefined
      : session.user.email,
    customer: existing?.stripeCustomerId ?? undefined,
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: { userId: session.user.id },
    subscription_data: {
      metadata: { userId: session.user.id },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?billing=canceled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
