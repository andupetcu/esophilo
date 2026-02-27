import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { getTraditionBySlug } from "@/lib/traditions";
import { getTextsByTradition } from "@/lib/texts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tradition = getTraditionBySlug(slug);
  if (!tradition) return { title: "Tradition" };

  const description = tradition.description.slice(0, 160);

  return {
    title: tradition.name,
    description,
    openGraph: {
      title: `${tradition.name} | EsoPhilo`,
      description,
    },
  };
}

export default async function TraditionPage({ params }: Props) {
  const { slug } = await params;
  const tradition = getTraditionBySlug(slug);

  if (!tradition) {
    notFound();
  }

  const texts = await getTextsByTradition(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Tradition Header */}
      <div className="mb-12">
        <div className="text-5xl mb-4">{tradition.icon}</div>
        <h1 className="font-heading text-4xl font-bold tracking-tight mb-4">
          {tradition.name}
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">
          {tradition.description}
        </p>
      </div>

      {/* Texts Section */}
      <div>
        <h2 className="font-heading text-2xl font-semibold mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Texts
        </h2>

        {texts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {texts.map((text) => (
              <Link key={text.slug} href={`/text/${text.slug}`}>
                <Card className="bg-card border border-border hover:border-primary/30 transition rounded-lg p-6 h-full">
                  <CardHeader>
                    <CardTitle className="font-heading text-xl">
                      {text.title}
                    </CardTitle>
                    <div className="text-muted-foreground text-sm">
                      {text.author_name}
                      {text.date_written && (
                        <span className="ml-2 text-muted-foreground/70">
                          ({text.date_written})
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {text.type && (
                        <Badge variant="secondary">{text.type}</Badge>
                      )}
                      {text.language && (
                        <Badge variant="outline">{text.language}</Badge>
                      )}
                    </div>
                    {text.notes && (
                      <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                        {text.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">
              Texts coming soon after database is populated
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
