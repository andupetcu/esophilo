import type { Metadata } from "next";
import Link from "next/link";
import { getChapter, getChaptersByTextId } from "@/lib/texts";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  params: Promise<{ slug: string; chapter: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter } = await params;
  const data = await getChapter(slug, parseInt(chapter));
  if (!data) return { title: "Chapter" };
  return {
    title: `${data.chapter.title || `Chapter ${chapter}`} — ${data.text.title}`,
  };
}

function renderContent(content: string) {
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) return null;
    return (
      <p key={index}>
        {trimmed.split("\n").map((line, lineIndex, arr) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < arr.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapter } = await params;
  const chapterNumber = parseInt(chapter);
  const data = await getChapter(slug, chapterNumber);

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="mb-6 text-5xl">&#128220;</div>
        <h1 className="font-heading text-3xl font-bold text-primary mb-4">
          Content Coming Soon
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto mb-8">
          This chapter is being prepared. Check back soon for the full content.
        </p>
        <Link
          href={`/text/${slug}`}
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          &larr; Back to text
        </Link>
      </div>
    );
  }

  const { chapter: chapterData, text } = data;
  const chapters = await getChaptersByTextId(text.id);
  const totalChapters = chapters.length;
  const hasPrev = chapterNumber > 1;
  const hasNext = chapterNumber < totalChapters;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link
          href={`/text/${slug}`}
          className="hover:text-primary transition-colors"
        >
          {text.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {chapterData.title || `Chapter ${chapterNumber}`}
        </span>
      </nav>

      {/* Chapter header */}
      <header className="mb-10 text-center">
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-3">
          Chapter {chapterNumber} of {totalChapters}
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2">
          {chapterData.title || `Chapter ${chapterNumber}`}
        </h1>
        <p className="text-muted-foreground text-sm font-heading">
          {text.title}
          {text.author_name && <span> &mdash; {text.author_name}</span>}
        </p>
      </header>

      {/* Divider */}
      <div className="flex items-center justify-center mb-10">
        <div className="h-px w-12 bg-primary/30" />
        <div className="mx-3 text-primary/50 text-xs">&#10022;</div>
        <div className="h-px w-12 bg-primary/30" />
      </div>

      {/* Reading content */}
      <article className="prose-reading mb-16">
        {renderContent(chapterData.content)}
      </article>

      {/* Bottom divider */}
      <div className="flex items-center justify-center mb-10">
        <div className="h-px w-12 bg-primary/30" />
        <div className="mx-3 text-primary/50 text-xs">&#10022;</div>
        <div className="h-px w-12 bg-primary/30" />
      </div>

      {/* Progress indicator */}
      <div className="text-center mb-8">
        <p className="text-muted-foreground text-sm">
          Chapter {chapterNumber} of {totalChapters}
        </p>
        {totalChapters > 1 && (
          <div className="mt-2 mx-auto max-w-xs h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60 rounded-full transition-all"
              style={{ width: `${(chapterNumber / totalChapters) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Chapter navigation */}
      <nav className="flex items-center justify-between border-t border-border pt-8">
        <div className="flex-1">
          {hasPrev ? (
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href={`/text/${slug}/${chapterNumber - 1}`}>
                <ChevronLeft className="size-4" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </div>

        <div className="flex-1 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link
              href={`/text/${slug}`}
              className="text-muted-foreground hover:text-foreground"
            >
              All Chapters
            </Link>
          </Button>
        </div>

        <div className="flex-1 flex justify-end">
          {hasNext ? (
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href={`/text/${slug}/${chapterNumber + 1}`}>
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </div>
      </nav>
    </div>
  );
}
