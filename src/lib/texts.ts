import { safeQuery } from "@/lib/db";

export interface TextRecord {
  id: number;
  title: string;
  slug: string;
  author_name: string;
  author_slug: string;
  tradition_name: string;
  tradition_slug: string;
  tradition_icon: string;
  language: string;
  type: string;
  source: string;
  source_url: string;
  date_written: string;
  translator: string;
  notes: string;
  description: string;
  difficulty: string;
  reading_time_min: number;
  chapter_count?: number;
}

export interface ChapterRecord {
  id: number;
  text_id: number;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
}

/**
 * Returns all texts belonging to a given tradition.
 * Falls back to an empty array when the database is unavailable.
 */
export async function getTextsByTradition(
  traditionSlug: string,
): Promise<TextRecord[]> {
  const result = await safeQuery(
    `SELECT
       t.id,
       t.title,
       t.slug,
       a.name        AS author_name,
       a.slug        AS author_slug,
       tr.name       AS tradition_name,
       tr.slug       AS tradition_slug,
       tr.icon       AS tradition_icon,
       t.language,
       t.type,
       t.source,
       t.source_url,
       t.date_written,
       t.translator,
       t.notes,
       t.description,
       t.difficulty,
       t.reading_time_min,
       (SELECT COUNT(*) FROM chapters c WHERE c.text_id = t.id) AS chapter_count
     FROM texts t
     JOIN authors a     ON a.id  = t.author_id
     JOIN traditions tr ON tr.id = t.tradition_id
     WHERE tr.slug = $1
     ORDER BY t.title`,
    [traditionSlug],
  );

  if (!result) return [];
  return result.rows as TextRecord[];
}

/**
 * Returns a single text by its slug, including author and tradition info.
 * Returns null when the database is unavailable or the text is not found.
 */
export async function getTextBySlug(
  slug: string,
): Promise<TextRecord | null> {
  const result = await safeQuery(
    `SELECT
       t.id,
       t.title,
       t.slug,
       a.name        AS author_name,
       a.slug        AS author_slug,
       tr.name       AS tradition_name,
       tr.slug       AS tradition_slug,
       tr.icon       AS tradition_icon,
       t.language,
       t.type,
       t.source,
       t.source_url,
       t.date_written,
       t.translator,
       t.notes,
       t.description,
       t.difficulty,
       t.reading_time_min,
       (SELECT COUNT(*) FROM chapters c WHERE c.text_id = t.id) AS chapter_count
     FROM texts t
     JOIN authors a     ON a.id  = t.author_id
     JOIN traditions tr ON tr.id = t.tradition_id
     WHERE t.slug = $1
     LIMIT 1`,
    [slug],
  );

  if (!result || result.rows.length === 0) return null;
  return result.rows[0] as TextRecord;
}

/**
 * Returns all chapters for a given text, ordered by chapter number.
 * Falls back to an empty array when the database is unavailable.
 */
export async function getChaptersByTextId(
  textId: number,
): Promise<ChapterRecord[]> {
  const result = await safeQuery(
    `SELECT id, text_id, chapter_number, title, content, word_count
     FROM chapters
     WHERE text_id = $1
     ORDER BY chapter_number`,
    [textId],
  );

  if (!result) return [];
  return result.rows as ChapterRecord[];
}

/**
 * Returns a specific chapter by text slug and chapter number, along with
 * the parent text metadata. Returns null when unavailable or not found.
 */
export async function getChapter(
  textSlug: string,
  chapterNumber: number,
): Promise<{ chapter: ChapterRecord; text: TextRecord } | null> {
  const text = await getTextBySlug(textSlug);
  if (!text) return null;

  const result = await safeQuery(
    `SELECT id, text_id, chapter_number, title, content, word_count
     FROM chapters
     WHERE text_id = $1 AND chapter_number = $2
     LIMIT 1`,
    [text.id, chapterNumber],
  );

  if (!result || result.rows.length === 0) return null;
  return { chapter: result.rows[0] as ChapterRecord, text };
}

/**
 * Full-text search across text titles, authors, descriptions, and chapter content.
 * Uses ILIKE for metadata and EXISTS subquery for chapter content to avoid
 * expensive cross-joins. Falls back to an empty array.
 */
export async function searchTexts(
  query: string,
): Promise<TextRecord[]> {
  const result = await safeQuery(
    `SELECT
       t.id,
       t.title,
       t.slug,
       a.name        AS author_name,
       a.slug        AS author_slug,
       tr.name       AS tradition_name,
       tr.slug       AS tradition_slug,
       tr.icon       AS tradition_icon,
       t.language,
       t.type,
       t.source,
       t.source_url,
       t.date_written,
       t.translator,
       t.notes,
       t.description,
       t.difficulty,
       t.reading_time_min
     FROM texts t
     JOIN authors a     ON a.id  = t.author_id
     JOIN traditions tr ON tr.id = t.tradition_id
     WHERE
       t.title ILIKE '%' || $1 || '%'
       OR a.name  ILIKE '%' || $1 || '%'
       OR t.description ILIKE '%' || $1 || '%'
       OR t.notes ILIKE '%' || $1 || '%'
       OR EXISTS (
         SELECT 1 FROM chapters c
         WHERE c.text_id = t.id
         AND c.content ILIKE '%' || $1 || '%'
       )
     ORDER BY
       CASE WHEN t.title ILIKE '%' || $1 || '%' THEN 0
            WHEN a.name ILIKE '%' || $1 || '%' THEN 1
            ELSE 2
       END,
       t.title
     LIMIT 50`,
    [query],
  );

  if (!result) return [];
  return result.rows as TextRecord[];
}

/**
 * Returns all texts in the library with basic metadata.
 * Used by the /library page for the browsable catalog.
 */
export async function getAllTexts(): Promise<TextRecord[]> {
  const result = await safeQuery(
    `SELECT
       t.id,
       t.title,
       t.slug,
       a.name        AS author_name,
       a.slug        AS author_slug,
       tr.name       AS tradition_name,
       tr.slug       AS tradition_slug,
       tr.icon       AS tradition_icon,
       t.language,
       t.type,
       t.source,
       t.source_url,
       t.date_written,
       t.translator,
       t.notes,
       t.description,
       t.difficulty,
       t.reading_time_min,
       (SELECT COUNT(*) FROM chapters c WHERE c.text_id = t.id) AS chapter_count
     FROM texts t
     JOIN authors a     ON a.id  = t.author_id
     JOIN traditions tr ON tr.id = t.tradition_id
     ORDER BY t.title`,
  );

  if (!result) return [];
  return result.rows as TextRecord[];
}

/**
 * Returns all text slugs. Used for sitemap generation.
 */
export async function getAllTextSlugs(): Promise<string[]> {
  const result = await safeQuery(
    `SELECT slug FROM texts ORDER BY slug`,
  );

  if (!result) return [];
  return result.rows.map((r: { slug: string }) => r.slug);
}

/** Hardcoded slugs for well-known featured texts used as a fallback. */
const FEATURED_TEXT_SLUGS = [
  "the-kybalion",
  "dhammapada",
  "tao-te-ching",
  "the-republic",
  "meditations",
  "bhagavad-gita",
  "the-mesnevi",
  "isis-unveiled",
];

/**
 * Returns a curated selection of well-known texts for the homepage.
 * Falls back to a hardcoded list of featured work stubs when the
 * database is unavailable.
 */
export async function getFeaturedTexts(): Promise<TextRecord[]> {
  const placeholders = FEATURED_TEXT_SLUGS.map((_, i) => `$${i + 1}`).join(", ");

  const result = await safeQuery(
    `SELECT
       t.id,
       t.title,
       t.slug,
       a.name        AS author_name,
       a.slug        AS author_slug,
       tr.name       AS tradition_name,
       tr.slug       AS tradition_slug,
       tr.icon       AS tradition_icon,
       t.language,
       t.type,
       t.source,
       t.source_url,
       t.date_written,
       t.translator,
       t.notes,
       t.description,
       t.difficulty,
       t.reading_time_min,
       (SELECT COUNT(*) FROM chapters c WHERE c.text_id = t.id) AS chapter_count
     FROM texts t
     JOIN authors a     ON a.id  = t.author_id
     JOIN traditions tr ON tr.id = t.tradition_id
     WHERE t.slug IN (${placeholders})
     ORDER BY t.title`,
    FEATURED_TEXT_SLUGS,
  );

  if (!result || result.rows.length === 0) {
    return FEATURED_TEXT_SLUGS.map((slug, i) => ({
      id: -(i + 1),
      title: formatSlugAsTitle(slug),
      slug,
      author_name: "",
      author_slug: "",
      tradition_name: "",
      tradition_slug: "",
      tradition_icon: "",
      language: "en",
      type: "",
      source: "",
      source_url: "",
      date_written: "",
      translator: "",
      notes: "",
      description: "",
      difficulty: "",
      reading_time_min: 0,
    }));
  }

  return result.rows as TextRecord[];
}

export interface DailyWisdom {
  passage: string;
  author?: string;
  source?: string;
  modern_interpretation?: string;
  tradition_name?: string;
  tradition_icon?: string;
}

/**
 * Fetches the daily wisdom quote. Tries the DB first, falls back to a
 * hardcoded quote.
 */
export async function getDailyWisdom(): Promise<DailyWisdom> {
  const result = await safeQuery(
    `SELECT dw.passage, dw.modern_interpretation, t.name as tradition_name, t.icon as tradition_icon
     FROM daily_wisdom dw
     LEFT JOIN traditions t ON t.id = dw.tradition_id
     WHERE dw.date = CURRENT_DATE
     LIMIT 1`,
  );

  if (result && result.rows.length > 0) {
    return result.rows[0] as DailyWisdom;
  }

  return {
    passage: "The unexamined life is not worth living.",
    author: "Socrates",
    source: "Apology by Plato",
    tradition_name: "Greek Philosophy",
    tradition_icon: "🏛️",
  };
}

/** Converts a slug like "tao-te-ching" to "Tao Te Ching". */
function formatSlugAsTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
