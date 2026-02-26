import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { PricingButtons } from "./pricing-buttons";

export const metadata: Metadata = {
  title: "Pricing",
};

const freeFeatures = [
  "Read all 120+ texts",
  "Full-text search",
  "3 AI queries per day",
  "Daily wisdom",
];

const proFeatures = [
  "Everything in Free",
  "Unlimited AI queries",
  "Passage explainer",
  "Bookmarks & notes",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Sparkles className="size-8 text-primary" />
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-primary mb-4">
            Unlock the Full Library
          </h1>
          <p className="font-serif text-lg text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="h-full border-border">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Free</CardTitle>
              <div className="mt-2">
                <span className="text-4xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground font-serif">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1">
              <ul className="space-y-3 mb-8">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-serif">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" size="lg" className="w-full text-base">
                <Link href="/auth/login">Get Started</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tier */}
          <Card className="h-full ring-1 ring-primary/30 shadow-lg shadow-primary/5 border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="font-heading text-2xl">Pro</CardTitle>
                <Badge>Most Popular</Badge>
              </div>
              <div className="mt-2">
                <span className="text-4xl font-bold text-foreground">$7</span>
                <span className="text-muted-foreground font-serif">/month</span>
              </div>
              <p className="text-sm text-muted-foreground font-serif">
                or $49/year (save 42%)
              </p>
            </CardHeader>
            <CardContent className="flex flex-col justify-between flex-1">
              <ul className="space-y-3 mb-8">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="size-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90 font-serif">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <PricingButtons />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
