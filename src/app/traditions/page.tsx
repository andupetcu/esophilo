import type { Metadata } from "next";
import Link from "next/link";
import { traditions } from "@/lib/traditions";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Traditions",
};

export default function TraditionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading text-4xl font-bold tracking-tight mb-3">
          Explore Traditions
        </h1>
        <p className="text-muted-foreground text-lg">
          15 wisdom traditions spanning thousands of years
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {traditions.map((tradition) => (
          <Card
            key={tradition.slug}
            className="bg-card border border-border hover:border-primary/30 transition rounded-lg p-6"
          >
            <CardHeader>
              <div className="text-4xl mb-2">{tradition.icon}</div>
              <CardTitle className="font-heading text-xl">
                {tradition.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {tradition.description}
              </p>
            </CardContent>
            <CardFooter>
              <Link
                href={`/tradition/${tradition.slug}`}
                className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
              >
                Explore &rarr;
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
