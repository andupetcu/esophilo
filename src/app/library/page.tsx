import type { Metadata } from "next";
import { getAllTexts } from "@/lib/texts";
import { traditions } from "@/lib/traditions";
import { LibraryCatalog } from "./library-catalog";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse the complete EsoPhilo library — 1,178 sacred and philosophical texts across 15 traditions. Search, filter, and explore ancient wisdom.",
  openGraph: {
    title: "Library | EsoPhilo",
    description:
      "Browse 1,178 sacred and philosophical texts across 15 traditions.",
  },
};

export default async function LibraryPage() {
  const texts = await getAllTexts();

  return (
    <div className="min-h-screen py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-primary mb-3">
            Library
          </h1>
          <p className="font-serif text-lg text-muted-foreground max-w-2xl">
            {texts.length > 0
              ? `${texts.length.toLocaleString()} texts across ${traditions.length} traditions`
              : "Browse the complete catalog of sacred and philosophical texts"}
          </p>
        </div>

        <LibraryCatalog
          texts={texts}
          traditions={traditions.map((t) => ({
            slug: t.slug,
            name: t.name,
            icon: t.icon,
          }))}
        />
      </div>
    </div>
  );
}
