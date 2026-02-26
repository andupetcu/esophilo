import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "@/lib/db";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Invalid webhook configuration" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;
        const clientReferenceId = session.client_reference_id;
        const customerEmail = session.customer_email;

        const clientReferenceUserId = clientReferenceId ? Number(clientReferenceId) : null;
        if (clientReferenceUserId && Number.isInteger(clientReferenceUserId)) {
          await safeQuery(
            "UPDATE users SET is_pro = TRUE, stripe_customer_id = $1, stripe_subscription_id = $2 WHERE id = $3",
            [customerId, subscriptionId, clientReferenceUserId]
          );
        } else if (customerEmail) {
          await safeQuery(
            "UPDATE users SET is_pro = TRUE, stripe_customer_id = $1, stripe_subscription_id = $2 WHERE email = $3",
            [customerId, subscriptionId, customerEmail]
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
