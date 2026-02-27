"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, BookOpen, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TextRecord } from "@/lib/texts";

interface TraditionFilter {
  slug: string;
  name: string;
  icon: string;
}

interface LibraryCatalogProps {
  texts: TextRecord[];
  traditions: TraditionFilter[];
}

export function LibraryCatalog({ texts, traditions }: LibraryCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedTradition, setSelectedTradition] = useState<string | null>(
    null,
  );

  const filtered = useMemo(() => {
    let result = texts;

    if (selectedTradition) {
      result = result.filter((t) => t.tradition_slug === selectedTradition);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.author_name.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [texts, search, selectedTradition]);

  // Count texts per tradition from loaded data
  const traditionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of texts) {
      counts[t.tradition_slug] = (counts[t.tradition_slug] || 0) + 1;
    }
    return counts;
  }, [texts]);

  return (
    <>
      {/* Search + Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, author, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        {/* Tradition filter chips */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedTradition === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTradition(null)}
            className="text-xs"
          >
            All ({texts.length})
          </Button>
          {traditions
            .filter((t) => traditionCounts[t.slug])
            .map((tradition) => (
              <Button
                key={tradition.slug}
                variant={
                  selectedTradition === tradition.slug ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  setSelectedTradition(
                    selectedTradition === tradition.slug
                      ? null
                      : tradition.slug,
                  )
                }
                className="text-xs"
              >
                {tradition.icon} {tradition.name} (
                {traditionCounts[tradition.slug]})
              </Button>
            ))}
        </div>

        {/* Active filter indicator */}
        {(search || selectedTradition) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedTradition(null);
              }}
              className="h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3 mr-1" />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((text) => (
            <Link key={text.slug} href={`/text/${text.slug}`}>
              <Card className="h-full bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group cursor-pointer">
                <CardContent className="pt-5 pb-4">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                    {text.title}
                  </h3>
                  {text.author_name && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {text.author_name}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {text.tradition_icon} {text.tradition_name}
                    </Badge>
                    {text.language && text.language !== "en" && (
                      <Badge variant="outline" className="text-xs">
                        {text.language}
                      </Badge>
                    )}
                  </div>
                  {text.chapter_count && Number(text.chapter_count) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Number(text.chapter_count)} chapter
                      {Number(text.chapter_count) !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-border rounded-lg bg-card">
          <BookOpen className="size-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-lg mb-2">No texts found</p>
          <p className="text-muted-foreground text-sm">
            Try a different search term or filter
          </p>
        </div>
      )}
    </>
  );
}
