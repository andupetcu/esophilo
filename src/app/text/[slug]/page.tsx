import type { Metadata } from "next";
import Link from "next/link";
import { getTextBySlug, getChaptersByTextId } from "@/lib/texts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const text = await getTextBySlug(slug);
  return { title: text?.title || "Text" };
}

export default async function TextDetailPage({ params }: Props) {
  const { slug } = await params;
  const text = await getTextBySlug(slug);

  if (!text) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="mb-6 text-5xl">&#128218;</div>
        <h1 className="font-heading text-4xl font-bold text-primary mb-4">
          Coming Soon
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
          This text is being prepared for the library. Check back soon for the
          full content.
        </p>
        <Link
          href="/traditions"
          className="inline-block mt-8 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          &larr; Browse all traditions
        </Link>
      </div>
    );
  }

  const chapters = await getChaptersByTextId(text.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-10">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-primary mb-3">
          {text.title}
        </h1>

        {text.author_name && (
          <p className="text-lg text-muted-foreground mb-4">
            by{" "}
            <Link
              href={`/tradition/${text.tradition_slug}`}
              className="text-foreground hover:text-primary transition-colors"
            >
              {text.author_name}
            </Link>
          </p>
        )}

        {/* Tradition badge */}
        {text.tradition_name && (
          <div className="mb-6">
            <Link href={`/tradition/${text.tradition_slug}`}>
              <Badge
                variant="secondary"
                className="hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                {text.tradition_icon && (
                  <span className="mr-1">{text.tradition_icon}</span>
                )}
                {text.tradition_name}
              </Badge>
            </Link>
          </div>
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
          {text.date_written && (
            <div>
              <span className="block text-muted-foreground mb-0.5">
                Date Written
              </span>
              <span className="text-foreground">{text.date_written}</span>
            </div>
          )}
          {text.language && (
            <div>
              <span className="block text-muted-foreground mb-0.5">
                Language
              </span>
              <span className="text-foreground">{text.language}</span>
            </div>
          )}
          {text.translator && (
            <div>
              <span className="block text-muted-foreground mb-0.5">
                Translator
              </span>
              <span className="text-foreground">{text.translator}</span>
            </div>
          )}
          {text.type && (
            <div>
              <span className="block text-muted-foreground mb-0.5">Type</span>
              <span className="text-foreground">{text.type}</span>
            </div>
          )}
        </div>

        {/* Description / Notes */}
        {(text.description || text.notes) && (
          <>
            <Separator className="my-6" />
            {text.description && (
              <p className="text-muted-foreground leading-relaxed mb-3">
                {text.description}
              </p>
            )}
            {text.notes && (
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                {text.notes}
              </p>
            )}
          </>
        )}
      </header>

      <Separator className="my-8" />

      {/* Table of Contents */}
      <section>
        <h2 className="font-heading text-2xl font-semibold text-primary mb-6">
          Table of Contents
        </h2>

        {chapters.length > 0 ? (
          <>
            <ol className="space-y-2 mb-8">
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link
                    href={`/text/${slug}/${chapter.chapter_number}`}
                    className="group flex items-baseline gap-3 py-2 px-3 rounded-md hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-muted-foreground text-sm font-mono shrink-0 w-8 text-right">
                      {chapter.chapter_number}.
                    </span>
                    <span className="text-foreground group-hover:text-primary transition-colors">
                      {chapter.title || `Chapter ${chapter.chapter_number}`}
                    </span>
                    {chapter.word_count > 0 && (
                      <span className="text-muted-foreground text-xs ml-auto shrink-0">
                        {chapter.word_count.toLocaleString()} words
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>

            <div className="flex justify-center">
              <Button asChild size="lg" className="font-heading text-base">
                <Link href={`/text/${slug}/1`}>Start Reading</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-12 border border-border rounded-lg bg-card">
            <p className="text-muted-foreground text-lg mb-2">
              Content is being prepared.
            </p>
            <p className="text-muted-foreground text-sm">
              Check back soon.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
