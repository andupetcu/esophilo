#!/usr/bin/env tsx
/**
 * Bulk ingestion script for EsoPhilo
 * Fetches ALL relevant texts from Gutenberg via the Gutendex API
 * Groups them into traditions, downloads content, splits into chapters
 */

import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

// Gutendex API base
const GUTENDEX = "https://gutendex.com/books";

// Subject → Tradition mapping (Gutenberg subjects to our tradition slugs)
const SUBJECT_MAP: Record<string, string> = {
  // Greek Philosophy
  "Philosophy, Ancient": "greek-philosophy",
  "Plato": "greek-philosophy",
  "Aristotle": "greek-philosophy",
  "Socrates": "greek-philosophy",
  "Pythagoras": "greek-philosophy",
  "Greek literature": "greek-philosophy",
  
  // Stoic
  "Stoics": "neoplatonic-stoic",
  "Marcus Aurelius": "neoplatonic-stoic",
  "Epictetus": "neoplatonic-stoic",
  "Seneca": "neoplatonic-stoic",
  
  // Neoplatonic
  "Neoplatonism": "neoplatonic-stoic",
  "Plotinus": "neoplatonic-stoic",
  
  // Buddhist
  "Buddhism": "buddhist-zen",
  "Zen Buddhism": "buddhist-zen",
  "Buddha": "buddhist-zen",
  "Tripitaka": "buddhist-zen",
  "Sutras": "buddhist-zen",
  
  // Hindu
  "Hinduism": "hindu-vedic",
  "Vedas": "hindu-vedic",
  "Upanishads": "hindu-vedic",
  "Bhagavad Gita": "hindu-vedic",
  "Yoga": "hindu-vedic",
  "Sanskrit literature": "hindu-vedic",
  
  // Sufi/Islamic
  "Sufism": "sufi-islamic",
  "Rumi": "sufi-islamic",
  "Islamic philosophy": "sufi-islamic",
  "Koran": "sufi-islamic",
  "Quran": "sufi-islamic",
  
  // Taoist
  "Taoism": "taoist",
  "Lao Tzu": "taoist",
  "Confucianism": "taoist",
  "Chinese philosophy": "taoist",
  
  // Kabbalistic
  "Cabala": "kabbalistic",
  "Kabbalah": "kabbalistic",
  "Jewish mysticism": "kabbalistic",
  
  // Hermetic & Alchemical
  "Hermeticism": "hermetic-alchemical",
  "Alchemy": "hermetic-alchemical",
  "Hermes Trismegistus": "hermetic-alchemical",
  
  // Gnostic
  "Gnosticism": "gnostic",
  "Apocryphal books": "gnostic",
  
  // Theosophical
  "Theosophy": "theosophical",
  "Blavatsky": "theosophical",
  "Anthroposophy": "theosophical",
  "Steiner, Rudolf": "theosophical",
  
  // Western Occultism
  "Occultism": "western-occultism",
  "Magic": "western-occultism",
  "Freemasonry": "western-occultism",
  "Rosicrucians": "western-occultism",
  "Witchcraft": "western-occultism",
  "Demonology": "western-occultism",
  "Astrology": "western-occultism",
  "Tarot": "western-occultism",
  
  // Spiritualism & Mysticism
  "Spiritualism": "spiritualism-mysticism",
  "Mysticism": "spiritualism-mysticism",
  "Swedenborg": "spiritualism-mysticism",
  "Telepathy": "spiritualism-mysticism",
  "Psychical research": "spiritualism-mysticism",
  
  // Medieval & Scholastic
  "Scholasticism": "medieval-scholastic",
  "Thomas Aquinas": "medieval-scholastic",
  "Augustine": "medieval-scholastic",
  "Medieval philosophy": "medieval-scholastic",
  
  // Renaissance
  "Renaissance": "renaissance",
  "Giordano Bruno": "renaissance",
  
  // Modern Philosophy
  "Philosophy, Modern": "modern-philosophy",
  "Ethics": "modern-philosophy",
  "Metaphysics": "modern-philosophy",
  "Epistemology": "modern-philosophy",
  "Logic": "modern-philosophy",
  "Aesthetics": "modern-philosophy",
  "Political science": "modern-philosophy",
  "Utilitarianism": "modern-philosophy",
  "Existentialism": "modern-philosophy",
  "Phenomenology": "modern-philosophy",
  "Kant": "modern-philosophy",
  "Hegel": "modern-philosophy",
  "Nietzsche": "modern-philosophy",
  "Schopenhauer": "modern-philosophy",
  "Spinoza": "modern-philosophy",
  "Descartes": "modern-philosophy",
  "Locke, John": "modern-philosophy",
  "Hume, David": "modern-philosophy",
  "Rousseau": "modern-philosophy",
  "Voltaire": "modern-philosophy",
};

// Search queries to find relevant books
const SEARCH_TOPICS = [
  "philosophy", "religion", "mysticism", "occultism", "buddhism",
  "hinduism", "theosophy", "alchemy", "kabbalah", "hermeticism",
  "gnosticism", "sufism", "taoism", "stoicism", "neoplatonism",
  "metaphysics", "ethics", "spiritualism", "freemasonry", "rosicrucian",
  "vedas", "upanishads", "yoga", "zen", "confucianism",
  "swedenborg", "astrology", "magic", "esoteric",
];

// Subjects to EXCLUDE (fiction, children's, etc.)
const EXCLUDE_SUBJECTS = [
  "fiction", "novel", "adventure", "romance", "detective", "mystery",
  "children", "juvenile", "fairy tales", "fantasy", "science fiction",
  "humor", "comedy", "drama", "poetry" /* keep some poetry for Rumi/Hafiz */,
  "travel", "geography", "biography" /* keep for philosopher bios */,
  "cooking", "gardening", "sports", "games",
];

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year: number | null; death_year: number | null }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  next: string | null;
  results: GutendexBook[];
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

function matchTradition(subjects: string[], bookshelves: string[]): string | null {
  const allTags = [...subjects, ...bookshelves].map(s => s.toLowerCase());
  
  // Check each subject against our map
  for (const [keyword, tradition] of Object.entries(SUBJECT_MAP)) {
    const kw = keyword.toLowerCase();
    for (const tag of allTags) {
      if (tag.includes(kw) || kw.includes(tag)) {
        return tradition;
      }
    }
  }
  return null;
}

function shouldExclude(subjects: string[], bookshelves: string[]): boolean {
  const allTags = [...subjects, ...bookshelves].map(s => s.toLowerCase());
  const tagStr = allTags.join(" ");
  
  for (const excl of EXCLUDE_SUBJECTS) {
    if (tagStr.includes(excl)) {
      // But don't exclude if it also matches a wanted subject
      for (const wanted of Object.keys(SUBJECT_MAP)) {
        if (tagStr.includes(wanted.toLowerCase())) return false;
      }
      return true;
    }
  }
  return false;
}

async function fetchAllBooks(): Promise<GutendexBook[]> {
  const seen = new Set<number>();
  const books: GutendexBook[] = [];
  
  for (const topic of SEARCH_TOPICS) {
    console.log(`Fetching topic: ${topic}...`);
    let url: string | null = `${GUTENDEX}?topic=${encodeURIComponent(topic)}&languages=en`;
    let pageCount = 0;
    
    while (url && pageCount < 20) { // Max 20 pages per topic (640 books)
      try {
        const res = await fetch(url);
        if (!res.ok) { console.log(`  HTTP ${res.status} for ${url}`); break; }
        const data: GutendexResponse = await res.json();
        
        for (const book of data.results) {
          if (!seen.has(book.id)) {
            seen.add(book.id);
            
            // Only English texts
            if (!book.languages.includes("en")) continue;
            
            // Must match a tradition
            const tradition = matchTradition(book.subjects, book.bookshelves);
            if (!tradition) continue;
            
            // Skip excluded subjects
            if (shouldExclude(book.subjects, book.bookshelves)) continue;
            
            // Must have a text format
            const hasText = Object.keys(book.formats).some(f => 
              f.includes("text/plain") || f.includes("text/html")
            );
            if (!hasText) continue;
            
            books.push(book);
          }
        }
        
        url = data.next;
        pageCount++;
        await delay(500); // Be nice to the API
      } catch (err) {
        console.log(`  Error fetching: ${err}`);
        break;
      }
    }
    
    console.log(`  → ${books.length} total relevant books so far`);
  }
  
  return books;
}

async function getOrCreateAuthor(name: string, birthYear: number | null, deathYear: number | null, traditionId: number): Promise<number> {
  const slug = slugify(name);
  
  // Check if exists
  const existing = await pool.query("SELECT id FROM authors WHERE slug = $1", [slug]);
  if (existing.rows.length > 0) return existing.rows[0].id;
  
  const born = birthYear ? `${birthYear}` : null;
  const died = deathYear ? `${deathYear}` : null;
  
  const result = await pool.query(
    "INSERT INTO authors (name, slug, born, died, tradition_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO UPDATE SET name = $1 RETURNING id",
    [name, slug, born, died, traditionId]
  );
  return result.rows[0].id;
}

async function getTextContent(book: GutendexBook): Promise<string | null> {
  // Prefer plain text, fall back to HTML
  const textUrls = Object.entries(book.formats)
    .filter(([mime]) => mime.includes("text/plain"))
    .map(([, url]) => url);
  
  const htmlUrls = Object.entries(book.formats)
    .filter(([mime]) => mime.includes("text/html"))
    .map(([, url]) => url);
  
  const urls = [...textUrls, ...htmlUrls];
  
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) continue;
      let text = await res.text();
      
      // Strip HTML if needed
      if (url.includes("htm")) {
        text = text
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<[^>]+>/g, "\n")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"');
      }
      
      // Strip Gutenberg header/footer
      const startMarkers = ["*** START OF THE PROJECT GUTENBERG", "*** START OF THIS PROJECT GUTENBERG"];
      const endMarkers = ["*** END OF THE PROJECT GUTENBERG", "*** END OF THIS PROJECT GUTENBERG", "End of the Project Gutenberg", "End of Project Gutenberg"];
      
      for (const marker of startMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1) {
          const nlIdx = text.indexOf("\n", idx);
          if (nlIdx !== -1) text = text.slice(nlIdx + 1);
        }
      }
      
      for (const marker of endMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1) text = text.slice(0, idx);
      }
      
      text = text.trim();
      if (text.length > 500) return text; // Minimum viable content
    } catch {
      continue;
    }
  }
  return null;
}

function splitIntoChapters(text: string, title: string): { title: string; content: string }[] {
  // Try to split by chapter markers
  const chapterPatterns = [
    /^(CHAPTER\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(BOOK\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(Part\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(Section\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(TREATISE\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(DISCOURSE\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(ENNEAD\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(Meditation\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(SUTRA\s+[IVXLCDM\d]+[.\s]*.*)/gim,
    /^(Hymn\s+[IVXLCDM\d]+[.\s]*.*)/gim,
  ];
  
  for (const pattern of chapterPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 3) {
      const chapters: { title: string; content: string }[] = [];
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index!;
        const end = i < matches.length - 1 ? matches[i + 1].index! : text.length;
        const chTitle = matches[i][1].trim().replace(/\s+/g, " ");
        const content = text.slice(start, end).trim();
        if (content.length > 100) {
          chapters.push({ title: chTitle, content });
        }
      }
      if (chapters.length >= 3) return chapters;
    }
  }
  
  // If no chapters found, split by size (~5000 chars per chunk)
  const CHUNK_SIZE = 5000;
  if (text.length <= CHUNK_SIZE * 1.5) {
    return [{ title: title, content: text }];
  }
  
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: { title: string; content: string }[] = [];
  let current = "";
  let chunkNum = 1;
  
  for (const para of paragraphs) {
    if (current.length + para.length > CHUNK_SIZE && current.length > 500) {
      chunks.push({ title: `Part ${chunkNum}`, content: current.trim() });
      chunkNum++;
      current = "";
    }
    current += para + "\n\n";
  }
  if (current.trim().length > 100) {
    chunks.push({ title: `Part ${chunkNum}`, content: current.trim() });
  }
  
  return chunks;
}

async function main() {
  console.log("=== EsoPhilo Bulk Ingestion ===\n");
  
  // Get tradition name→id map
  const tradResult = await pool.query("SELECT id, slug FROM traditions");
  const tradMap: Record<string, number> = {};
  for (const row of tradResult.rows) {
    tradMap[row.slug] = row.id;
  }
  console.log(`Found ${Object.keys(tradMap).length} traditions in DB\n`);
  
  if (Object.keys(tradMap).length === 0) {
    console.error("No traditions found! Run seed.ts first.");
    process.exit(1);
  }
  
  // Get existing text gutenberg IDs to avoid duplicates
  const existingResult = await pool.query("SELECT source_url FROM texts WHERE source = 'gutenberg'");
  const existingUrls = new Set(existingResult.rows.map(r => r.source_url));
  console.log(`${existingUrls.size} texts already in DB\n`);
  
  // Fetch all relevant books from Gutendex
  console.log("Fetching books from Gutendex API...\n");
  const books = await fetchAllBooks();
  console.log(`\nFound ${books.length} relevant books total\n`);
  
  // Process each book
  let added = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const book of books) {
    const gutenbergUrl = `https://www.gutenberg.org/ebooks/${book.id}`;
    
    // Skip if already exists
    if (existingUrls.has(gutenbergUrl)) {
      skipped++;
      continue;
    }
    
    const tradition = matchTradition(book.subjects, book.bookshelves);
    if (!tradition || !tradMap[tradition]) {
      skipped++;
      continue;
    }
    
    const traditionId = tradMap[tradition];
    const authorName = book.authors[0]?.name || "Unknown";
    
    console.log(`[${added + 1}] ${book.title} by ${authorName} → ${tradition}`);
    
    try {
      // Get or create author
      const authorId = await getOrCreateAuthor(
        authorName,
        book.authors[0]?.birth_year || null,
        book.authors[0]?.death_year || null,
        traditionId
      );
      
      // Determine date
      const dateWritten = book.authors[0]?.birth_year
        ? `${book.authors[0].birth_year}-${book.authors[0].death_year || "?"}`
        : "Unknown";
      
      // Insert text
      const slug = slugify(book.title);
      const textResult = await pool.query(
        `INSERT INTO texts (title, slug, author_id, tradition_id, language, type, source, source_url, date_written, notes, difficulty)
         VALUES ($1, $2, $3, $4, 'English', 'book', 'gutenberg', $5, $6, $7, 'intermediate')
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [book.title, slug, authorId, traditionId, gutenbergUrl, dateWritten, book.subjects.join(", ")]
      );
      
      if (textResult.rows.length === 0) {
        skipped++;
        continue;
      }
      
      const textId = textResult.rows[0].id;
      
      // Fetch content
      const content = await getTextContent(book);
      if (!content) {
        console.log(`  ⚠ No content available, metadata only`);
        added++;
        continue;
      }
      
      // Split into chapters
      const chapters = splitIntoChapters(content, book.title);
      
      // Insert chapters
      for (let i = 0; i < chapters.length; i++) {
        const wordCount = chapters[i].content.split(/\s+/).length;
        await pool.query(
          `INSERT INTO chapters (text_id, chapter_number, title, content, word_count)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (text_id, chapter_number) DO NOTHING`,
          [textId, i + 1, chapters[i].title, chapters[i].content, wordCount]
        );
      }
      
      // Update reading time
      const totalWords = chapters.reduce((sum, c) => sum + c.content.split(/\s+/).length, 0);
      await pool.query(
        "UPDATE texts SET reading_time_min = $1 WHERE id = $2",
        [Math.ceil(totalWords / 250), textId]
      );
      
      console.log(`  ✓ ${chapters.length} chapters, ${totalWords} words`);
      added++;
      
      // Be nice to Gutenberg servers
      await delay(1000);
      
    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
      failed++;
    }
  }
  
  console.log(`\n=== Done ===`);
  console.log(`Added: ${added}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  // Print final counts
  const textCount = await pool.query("SELECT COUNT(*) FROM texts");
  const chapterCount = await pool.query("SELECT COUNT(*) FROM chapters");
  console.log(`\nTotal in DB: ${textCount.rows[0].count} texts, ${chapterCount.rows[0].count} chapters`);
  
  await pool.end();
}

main().catch(console.error);
