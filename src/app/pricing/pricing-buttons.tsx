"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PricingButtons() {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  async function handleCheckout(plan: "monthly" | "yearly") {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        className="w-full text-base"
        disabled={loading !== null}
        onClick={() => handleCheckout("monthly")}
      >
        {loading === "monthly" ? "Redirecting..." : "Subscribe Monthly \u2014 $7/mo"}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full text-base border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
        disabled={loading !== null}
        onClick={() => handleCheckout("yearly")}
      >
        {loading === "yearly" ? "Redirecting..." : "Subscribe Yearly \u2014 $49/yr"}
      </Button>
    </div>
  );
}
