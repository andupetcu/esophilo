import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.text();

  // In production, verify webhook signature
  // For MVP, just parse the event
  try {
    const event = JSON.parse(body);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.customer_email) {
          await safeQuery(
            "UPDATE users SET is_pro = TRUE, stripe_customer_id = $1, stripe_subscription_id = $2 WHERE email = $3",
            [session.customer, session.subscription, session.customer_email]
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await safeQuery(
          "UPDATE users SET is_pro = FALSE, stripe_subscription_id = NULL WHERE stripe_customer_id = $1",
          [subscription.customer]
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
