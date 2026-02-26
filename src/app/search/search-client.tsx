"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Loader2 } from "lucide-react";

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  author_name: string;
  author_slug: string;
  tradition_name: string;
  tradition_slug: string;
  tradition_icon: string;
  notes: string;
  description: string;
}

const SUGGESTED_SEARCHES = [
  "What is the nature of reality?",
  "Meditation",
  "Alchemy",
  "Plato",
  "Hermetic",
];

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchResults(query.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  async function fetchResults(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setHasSearched(true);
    } catch {
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length > 0) {
      fetchResults(query.trim());
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold tracking-tight mb-3">
          Search the Library
        </h1>
        <p className="text-muted-foreground font-serif text-lg">
          Explore 120+ sacred and philosophical texts
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative mb-10">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search texts, authors, or traditions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-14 pl-12 pr-4 text-lg rounded-xl border-border focus-visible:border-primary focus-visible:ring-primary/50"
        />
      </form>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground font-serif">
            Searching...
          </span>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          {results.map((result) => (
            <Link
              key={result.id}
              href={`/text/${result.slug}`}
              className="block group"
            >
              <div className="rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <h2 className="font-heading text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {result.title}
                </h2>
                {result.author_name && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.author_name}
                  </p>
                )}
                {result.tradition_name && (
                  <Badge variant="secondary" className="text-xs mb-3">
                    {result.tradition_icon} {result.tradition_name}
                  </Badge>
                )}
                {(result.description || result.notes) && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mt-2">
                    {result.description || result.notes}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-serif text-lg mb-2">
            No results found
          </p>
          <p className="text-sm text-muted-foreground">
            Try a different search term or browse by tradition
          </p>
        </div>
      )}

      {/* Suggested Searches */}
      {!loading && !hasSearched && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Suggested searches
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTED_SEARCHES.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuery(suggestion)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-all duration-200 hover:border-primary/30 hover:text-primary hover:shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
