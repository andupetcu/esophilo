import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Sparkles, Globe, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "EsoPhilo is a digital library of 1,178 sacred and philosophical texts across 15 traditions, with AI-powered exploration via Ask the Sages.",
  openGraph: {
    title: "About | EsoPhilo",
    description:
      "A digital library of 1,178 sacred and philosophical texts with AI-powered understanding.",
  },
};

const highlights = [
  {
    icon: BookOpen,
    title: "1,178 Texts",
    description:
      "Public domain philosophical, esoteric, and sacred works — from the Bhagavad Gita to the Corpus Hermeticum, from Plato to Rumi.",
  },
  {
    icon: Globe,
    title: "15 Traditions",
    description:
      "Spanning Hermetic, Gnostic, Kabbalistic, Buddhist, Hindu, Sufi, Taoist, Greek, Neoplatonic, Medieval, Renaissance, Theosophical, and more.",
  },
  {
    icon: Sparkles,
    title: "Ask the Sages",
    description:
      "An AI-powered guide that draws from the entire library to answer your questions with citations and context from the original texts.",
  },
  {
    icon: Search,
    title: "Full-Text Search",
    description:
      "Search across every chapter of every text. Find passages about alchemy, meditation, the soul, virtue, or any topic that calls to you.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-gold-gradient font-heading text-4xl sm:text-5xl font-bold tracking-tight mb-6">
            About EsoPhilo
          </h1>
          <p className="font-serif text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A digital library dedicated to preserving and making accessible the
            world&apos;s great philosophical and esoteric traditions.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16">
          <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
            <CardContent className="py-8 px-6 sm:px-10">
              <h2 className="font-heading text-2xl font-semibold text-primary mb-4">
                Our Mission
              </h2>
              <div className="font-serif text-foreground/90 leading-relaxed space-y-4">
                <p>
                  The great philosophical and spiritual texts of humanity belong
                  to everyone. Yet many of these works remain scattered across
                  archives, difficult to find, and harder to understand without
                  context.
                </p>
                <p>
                  EsoPhilo brings together 1,178 public domain texts from 15
                  traditions into a single, searchable library. From the
                  Upanishads to the Emerald Tablet, from Marcus Aurelius to
                  Meister Eckhart — these are the works that have shaped human
                  thought across millennia.
                </p>
                <p>
                  With our AI-powered <strong>Ask the Sages</strong> feature,
                  you can explore these texts in conversation. Ask a question
                  about the nature of reality, the path of virtue, or the
                  meaning of a specific passage — and receive answers grounded in
                  the original sources, with citations you can follow back to the
                  text.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Highlights Grid */}
        <div className="mb-16">
          <h2 className="font-heading text-2xl font-semibold text-primary mb-6 text-center">
            What You&apos;ll Find
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {highlights.map((item) => (
              <Card
                key={item.title}
                className="bg-card border border-border"
              >
                <CardContent className="pt-6 pb-5">
                  <item.icon className="size-8 text-primary mb-3" />
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Open Source / Public Domain note */}
        <div className="mb-16">
          <Card className="bg-card border border-border">
            <CardContent className="py-8 px-6 sm:px-10">
              <h2 className="font-heading text-2xl font-semibold text-primary mb-4">
                Public Domain Texts
              </h2>
              <p className="font-serif text-foreground/90 leading-relaxed">
                Every text in the EsoPhilo library is in the public domain. These
                works belong to humanity. We&apos;ve collected them from sources
                including Project Gutenberg, sacred-texts.com, and academic
                archives, and formatted them for comfortable reading on any
                device.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTAs */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-base px-8 py-5">
              <Link href="/library">
                <BookOpen className="size-4 mr-1" />
                Browse the Library
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
      </div>
    </div>
  );
}
