import Link from "next/link";
import { traditions } from "@/lib/traditions";
import { getFeaturedTexts } from "@/lib/texts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, ArrowRight } from "lucide-react";

export default async function Home() {
  const featuredTexts = await getFeaturedTexts();

  return (
    <div className="min-h-screen">
      {/* ============================================================
          1. Hero Section
          ============================================================ */}
      <section className="constellation-bg relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="size-8 text-primary" />
          </div>

          <h1 className="text-gold-gradient font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            Ancient Wisdom, Modern Understanding
          </h1>

          <p className="font-serif text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A digital library of 120+ sacred and philosophical texts with
            AI-powered understanding
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 py-5">
              <Link href="/traditions">
                <BookOpen className="size-4 mr-1" />
                Explore Traditions
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base px-8 py-5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Link href="/ask">
                <Sparkles className="size-4 mr-1" />
                Ask the Sages
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. Daily Wisdom (placeholder)
          ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-primary/20 max-w-3xl mx-auto bg-card/60 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <p className="font-serif text-xl sm:text-2xl italic text-foreground/90 leading-relaxed mb-4">
                &ldquo;The unexamined life is not worth living.&rdquo;
              </p>
              <p className="text-primary font-heading text-lg mb-6">
                &mdash; Socrates
              </p>
              <Link
                href="/text/the-republic"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Read more &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================
          3. Browse by Tradition
          ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-primary mb-3">
              Browse by Tradition
            </h2>
            <p className="text-muted-foreground font-serif text-lg max-w-xl mx-auto">
              Explore the world&apos;s great philosophical and esoteric lineages
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {traditions.map((tradition) => (
              <Link key={tradition.slug} href={`/tradition/${tradition.slug}`}>
                <Card className="h-full bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                  <CardContent className="flex flex-col items-center text-center pt-6 pb-4 px-3">
                    <span
                      className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300"
                      role="img"
                      aria-label={tradition.name}
                    >
                      {tradition.icon}
                    </span>
                    <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground mb-1.5">
                      {tradition.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tradition.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. Featured Texts
          ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-primary mb-3">
              Featured Texts
            </h2>
            <p className="text-muted-foreground font-serif text-lg max-w-xl mx-auto">
              Timeless works that have shaped human thought for millennia
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTexts.map((text) => (
              <Link key={text.slug} href={`/text/${text.slug}`}>
                <Card className="h-full bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                  <CardContent className="flex flex-col justify-between h-full pt-6 pb-5">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {text.title}
                      </h3>
                      {text.author_name && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {text.author_name}
                        </p>
                      )}
                      {text.tradition_name && (
                        <Badge
                          variant="secondary"
                          className="text-xs mb-3"
                        >
                          {text.tradition_icon} {text.tradition_name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-primary font-medium flex items-center gap-1 mt-4 group-hover:gap-2 transition-all">
                      Read <ArrowRight className="size-3.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. Ask the Sages CTA
          ============================================================ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-card border-primary/10">
            <CardContent className="py-12 md:py-16 text-center">
              <Sparkles className="size-10 text-primary mx-auto mb-6" />
              <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground mb-4">
                Have a question about ancient wisdom?
              </h2>
              <p className="text-muted-foreground font-serif text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                Our AI guide draws from 120+ texts to help you explore the
                world&apos;s philosophical and esoteric traditions
              </p>
              <Button asChild size="lg" className="text-base px-8 py-5">
                <Link href="/ask">
                  <Sparkles className="size-4 mr-1" />
                  Ask the Sages
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================
          6. Footer
          ============================================================ */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-serif text-muted-foreground mb-3">
            120+ texts &bull; 15 traditions &bull; Thousands of years of wisdom
          </p>
          <p className="text-sm text-muted-foreground/60">
            &copy; 2026 EsoPhilo
          </p>
        </div>
      </footer>
    </div>
  );
}
