import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    "postgres://postgres:8hfb0G6VzobRRJQ26vH47blxIrTI430p3bqv19NrcQAUezTRUONkLmZLHyyOqKEI@10.0.0.20:5432/esophilo",
});

// ---------------------------------------------------------------------------
// URL conversion helpers
// ---------------------------------------------------------------------------

/**
 * Converts a Gutenberg URL to a plain-text download URL.
 * Handles two common formats:
 *   /ebooks/14209           -> /cache/epub/14209/pg14209.txt
 *   /files/2017/2017-h/...  -> /files/2017/2017-0.txt  (fallback: 2017.txt)
 */
function gutenbergTextUrls(sourceUrl: string): string[] {
  // Format 1: /ebooks/<id>
  const ebookMatch = sourceUrl.match(/gutenberg\.org\/ebooks\/(\d+)/);
  if (ebookMatch) {
    const id = ebookMatch[1];
    return [`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`];
  }

  // Format 2: /files/<id>/...
  const filesMatch = sourceUrl.match(/gutenberg\.org\/files\/(\d+)\//);
  if (filesMatch) {
    const id = filesMatch[1];
    return [
      `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
      `https://www.gutenberg.org/files/${id}/${id}.txt`,
    ];
  }

  // Format 3: /ebooks/author/<id> — not a direct text link, skip
  if (sourceUrl.includes("/ebooks/author/") || sourceUrl.includes("/ebooks/subject/")) {
    return [];
  }

  // Fallback: try the URL as-is (unlikely to be plain text, but worth a shot)
  return [sourceUrl];
}

// ---------------------------------------------------------------------------
// Fetch with retries and timeout
// ---------------------------------------------------------------------------

async function fetchText(url: string, timeoutMs = 30_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EsoPhilo-Ingestion/1.0 (esophilo.com; polite bot)",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    // Read as arraybuffer first to handle encoding issues
    const buf = await res.arrayBuffer();
    // Try UTF-8 first, fall back to latin1
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
      return text;
    } catch {
      return new TextDecoder("latin1").decode(buf);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithFallbacks(urls: string[]): Promise<string> {
  for (const url of urls) {
    try {
      const text = await fetchText(url);
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`    [fetch] ${url} failed: ${msg}`);
      // continue to next fallback
    }
  }
  throw new Error(`All URLs failed: ${urls.join(", ")}`);
}

// ---------------------------------------------------------------------------
// Strip Gutenberg boilerplate
// ---------------------------------------------------------------------------

function stripBoilerplate(raw: string): string {
  // Find start marker
  const startPatterns = [
    /\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG/i,
    /\*{3}\s*START OF (?:THE |THIS )?EBOOK/i,
  ];
  let startIdx = -1;
  for (const pat of startPatterns) {
    const match = raw.match(pat);
    if (match && match.index !== undefined) {
      // Move past the entire line containing the marker
      const lineEnd = raw.indexOf("\n", match.index);
      startIdx = lineEnd !== -1 ? lineEnd + 1 : match.index + match[0].length;
      break;
    }
  }

  // Find end marker
  const endPatterns = [
    /\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG/i,
    /\*{3}\s*END OF (?:THE |THIS )?EBOOK/i,
  ];
  let endIdx = raw.length;
  for (const pat of endPatterns) {
    const match = raw.match(pat);
    if (match && match.index !== undefined) {
      endIdx = match.index;
      break;
    }
  }

  if (startIdx === -1) {
    // No start marker found — use entire text but still strip end
    startIdx = 0;
  }

  return raw.slice(startIdx, endIdx).trim();
}

// ---------------------------------------------------------------------------
// Chapter splitting
// ---------------------------------------------------------------------------

interface RawChapter {
  title: string;
  content: string;
}

/**
 * Detect chapter/section boundaries in plain text.
 *
 * We look for lines that match known heading patterns. A heading line must be
 * relatively short (< 120 chars) and surrounded by blank-ish lines.
 */
function splitIntoChapters(text: string): RawChapter[] {
  const lines = text.split("\n");

  // Patterns that indicate a chapter/section heading
  const headingPatterns = [
    // CHAPTER I, CHAPTER 1, CHAPTER I., Chapter One, etc.
    /^\s*(CHAPTER|Chapter)\s+[IVXLCDM\d]+\.?\s*([-—:.].*)?$/i,
    // CHAPTER I — Title on same line
    /^\s*(CHAPTER|Chapter)\s+[IVXLCDM\d]+\s*[-—:.]\s*.+$/i,
    // "Chapter One", "Chapter Twenty-Three", etc.
    /^\s*(CHAPTER|Chapter)\s+(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty|Thirty|Forty|Fifty|Sixty|Seventy|Eighty|Ninety|Hundred)/i,
    // BOOK I, Book 1, BOOK FIRST, etc.
    /^\s*(BOOK|Book)\s+[IVXLCDM\d]+\.?\s*([-—:.].*)?$/i,
    /^\s*(BOOK|Book)\s+(the\s+)?(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth)/i,
    // PART I, Part 1, etc.
    /^\s*(PART|Part)\s+[IVXLCDM\d]+\.?\s*([-—:.].*)?$/i,
    /^\s*(PART|Part)\s+(the\s+)?(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|One|Two|Three)/i,
    // Section 1, SECTION I, etc.
    /^\s*(SECTION|Section)\s+[IVXLCDM\d]+\.?\s*([-—:.].*)?$/i,
    // Treatise / Ennead / Tractate patterns (for philosophical texts)
    /^\s*(TRACTATE|Tractate|ENNEAD|Ennead|TREATISE|Treatise)\s+[IVXLCDM\d]+/i,
    // Stanza / Sloka patterns (for Eastern texts)
    /^\s*(STANZA|Stanza)\s+[IVXLCDM\d]+/i,
    // Discourse / Lecture patterns
    /^\s*(DISCOURSE|Discourse|LECTURE|Lecture)\s+[IVXLCDM\d]+/i,
  ];

  // Also detect ALL CAPS short lines that look like section headers
  // They must be at most 80 chars, all uppercase letters (plus spaces/punctuation),
  // and have at least 2 word characters.
  const allCapsHeading = /^[A-Z][A-Z\s\d.,;:!?'"()\-—]+$/;

  interface HeadingHit {
    lineIdx: number;
    title: string;
  }

  const headings: HeadingHit[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    // Skip empty or very short lines
    if (trimmed.length < 2) continue;
    // Skip very long lines (these are body text, not headings)
    if (trimmed.length > 120) continue;

    // Check explicit heading patterns first
    let matched = false;
    for (const pat of headingPatterns) {
      if (pat.test(trimmed)) {
        headings.push({ lineIdx: i, title: trimmed });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Check ALL CAPS heading heuristic
    // Must be: short, all-caps, surrounded by blank lines (or near start/end),
    // at least 3 word characters, not a line of dashes/equals.
    if (
      trimmed.length >= 3 &&
      trimmed.length <= 80 &&
      allCapsHeading.test(trimmed) &&
      (trimmed.match(/[A-Z]/g)?.length ?? 0) >= 3 &&
      !/^[-=*_\s]+$/.test(trimmed)
    ) {
      // Check surrounding blank lines
      const prevBlank = i === 0 || lines[i - 1].trim() === "";
      const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === "";
      if (prevBlank && nextBlank) {
        headings.push({ lineIdx: i, title: trimmed });
      }
    }
  }

  // If no headings found, return the entire text as a single chapter
  if (headings.length === 0) {
    return [{ title: "Full Text", content: text.trim() }];
  }

  // If only one heading was found and it's near the start, treat everything
  // after it as a single chapter.
  // If multiple headings found, split between them.

  const chapters: RawChapter[] = [];

  // Anything before the first heading becomes a "Preface" if substantial
  const preContent = lines.slice(0, headings[0].lineIdx).join("\n").trim();
  if (wordCount(preContent) > 100) {
    chapters.push({ title: "Preface", content: preContent });
  }

  for (let h = 0; h < headings.length; h++) {
    const startLine = headings[h].lineIdx;
    const endLine = h + 1 < headings.length ? headings[h + 1].lineIdx : lines.length;

    // The title is the heading line itself. Sometimes the next non-blank line
    // is a subtitle — grab it if it's short.
    let title = headings[h].title;
    const nextNonBlank = lines.slice(startLine + 1, Math.min(startLine + 4, endLine))
      .find((l) => l.trim().length > 0);
    if (
      nextNonBlank &&
      nextNonBlank.trim().length < 80 &&
      nextNonBlank.trim().length > 0 &&
      // Don't grab body-text-looking lines
      !nextNonBlank.trim().match(/^[a-z]/)
    ) {
      // Check it's not the same style as the heading (avoid double-heading)
      const sub = nextNonBlank.trim();
      const alreadyInTitle = title.toLowerCase().includes(sub.toLowerCase());
      if (!alreadyInTitle && sub.length > 1) {
        title = `${title} — ${sub}`;
      }
    }

    const chapterContent = lines.slice(startLine, endLine).join("\n").trim();
    if (chapterContent.length > 0) {
      chapters.push({ title, content: chapterContent });
    }
  }

  return chapters;
}

// ---------------------------------------------------------------------------
// Word count helper
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// ---------------------------------------------------------------------------
// Delay helper
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main ingestion
// ---------------------------------------------------------------------------

interface TextRow {
  id: number;
  title: string;
  source_url: string;
}

async function ingest() {
  console.log("=== EsoPhilo Gutenberg Ingestion ===\n");

  // 1. Query all gutenberg texts with a source_url
  const { rows: texts } = await pool.query<TextRow>(
    `SELECT id, title, source_url
     FROM texts
     WHERE source = 'gutenberg'
       AND source_url IS NOT NULL
       AND source_url != ''
     ORDER BY id`
  );

  console.log(`Found ${texts.length} Gutenberg texts to process.\n`);

  let processed = 0;
  let skipped = 0;
  let errored = 0;

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const progress = `[${i + 1}/${texts.length}]`;

    console.log(`Processing ${progress}: ${text.title}`);

    // 2. Check if chapters already exist
    const existing = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM chapters WHERE text_id = $1",
      [text.id]
    );
    if (existing.rows[0].cnt > 0) {
      console.log(`  → Already has ${existing.rows[0].cnt} chapters, skipping.`);
      skipped++;
      continue;
    }

    // 3. Convert URL and fetch
    const urls = gutenbergTextUrls(text.source_url);
    if (urls.length === 0) {
      console.log(`  → No fetchable URL (author/subject page), skipping.`);
      skipped++;
      continue;
    }

    let rawText: string;
    try {
      rawText = await fetchWithFallbacks(urls);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  → ERROR fetching: ${msg}`);
      errored++;
      // Polite delay even on error
      await delay(1000);
      continue;
    }

    // 4. Strip boilerplate
    const cleanText = stripBoilerplate(rawText);
    if (cleanText.length < 50) {
      console.log(`  → WARNING: text too short after stripping boilerplate (${cleanText.length} chars), skipping.`);
      errored++;
      await delay(1000);
      continue;
    }

    // 5. Split into chapters
    const chapters = splitIntoChapters(cleanText);

    // 6. Insert chapters
    let totalWords = 0;
    let chapterNum = 0;

    for (const chapter of chapters) {
      chapterNum++;
      const wc = wordCount(chapter.content);
      totalWords += wc;

      try {
        await pool.query(
          `INSERT INTO chapters (text_id, chapter_number, title, content, word_count)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (text_id, chapter_number) DO NOTHING`,
          [text.id, chapterNum, chapter.title, chapter.content, wc]
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  → ERROR inserting chapter ${chapterNum}: ${msg}`);
      }
    }

    // 7. Update reading time (250 wpm)
    const readingTimeMin = Math.max(1, Math.round(totalWords / 250));
    await pool.query(
      "UPDATE texts SET reading_time_min = $1 WHERE id = $2",
      [readingTimeMin, text.id]
    );

    console.log(
      `  → Inserted ${chapterNum} chapter${chapterNum !== 1 ? "s" : ""} (${totalWords.toLocaleString()} words, ~${readingTimeMin} min read)`
    );
    processed++;

    // 8. Polite 1-second delay between requests
    if (i < texts.length - 1) {
      await delay(1000);
    }
  }

  console.log("\n=== Ingestion Complete ===");
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Errors:    ${errored}`);
  console.log(`  Total:     ${texts.length}`);

  await pool.end();
}

ingest().catch((err) => {
  console.error("Ingestion failed:", err);
  pool.end().finally(() => process.exit(1));
});
