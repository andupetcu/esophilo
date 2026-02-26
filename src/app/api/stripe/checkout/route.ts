import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyToken } from "@/lib/auth";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "");
}

export async function POST(request: NextRequest) {
  try {
    const { plan, email } = await request.json();
    if (plan !== "monthly" && plan !== "yearly") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceAmount = plan === "yearly" ? 4900 : 700;
    const interval = plan === "yearly" ? "year" : "month";
    const authToken = request.cookies.get("auth-token")?.value;
    const user = authToken ? await verifyToken(authToken) : null;
    const customerEmail = typeof email === "string" && email.includes("@")
      ? email.trim().toLowerCase()
      : user?.email;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      ...(user?.id ? { client_reference_id: String(user.id) } : {}),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "EsoPhilo Pro",
              description:
                plan === "yearly"
                  ? "Annual access to unlimited AI queries, bookmarks, and more"
                  : "Monthly access to unlimited AI queries, bookmarks, and more",
            },
            unit_amount: priceAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL || "http://localhost:3000"}/pricing?success=true`,
      cancel_url: `${process.env.SITE_URL || "http://localhost:3000"}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe error:", error);
    const message =
      error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
