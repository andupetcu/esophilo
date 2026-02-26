import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const SEED_KEY = process.env.SEED_SECRET || "esophilo-seed-2026";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ key: "" }));
  
  if (body.key !== SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log: string[] = [];

  // Step 1: Test DB connection
  let pool: Pool;
  try {
    const dbUrl = process.env.DATABASE_URL || "not set";
    log.push(`DB URL: ${dbUrl.replace(/:[^@]+@/, ':***@')}`);
    pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    const test = await pool.query("SELECT 1 as ok");
    log.push(`DB connection: OK (${test.rows[0].ok})`);
  } catch (e) {
    log.push(`DB connection FAILED: ${e}`);
    return NextResponse.json({ error: "DB connection failed", log }, { status: 500 });
  }

  // Step 2: Check tables
  try {
    const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    log.push(`Tables: ${tables.rows.map(r => r.tablename).join(', ')}`);
  } catch (e) {
    log.push(`Table check failed: ${e}`);
  }

  // Step 3: Count existing data
  try {
    const tc = await pool.query("SELECT COUNT(*) as c FROM traditions");
    const txc = await pool.query("SELECT COUNT(*) as c FROM texts");
    const ac = await pool.query("SELECT COUNT(*) as c FROM authors");
    log.push(`Existing: ${tc.rows[0].c} traditions, ${ac.rows[0].c} authors, ${txc.rows[0].c} texts`);
    
    if (parseInt(txc.rows[0].c) > 10) {
      log.push("Already seeded, skipping");
      await pool.end();
      return NextResponse.json({ message: "Already seeded", log });
    }
  } catch (e) {
    log.push(`Count check failed: ${e}`);
  }

  // Step 4: Fetch CSV
  let csvContent = "";
  try {
    const resp = await fetch("http://localhost:3000/sources.csv");
    log.push(`CSV fetch status: ${resp.status}`);
    csvContent = await resp.text();
    log.push(`CSV length: ${csvContent.length} chars`);
    log.push(`CSV first 200: ${csvContent.slice(0, 200)}`);
  } catch (e) {
    log.push(`CSV fetch FAILED: ${e}`);
    // Try alternative: read from process.cwd()
    try {
      const fs = require("fs");
      csvContent = fs.readFileSync("/app/sources.csv", "utf-8");
      log.push(`Fallback fs read OK: ${csvContent.length} chars`);
    } catch (e2) {
      log.push(`Fallback fs also failed: ${e2}`);
      await pool.end();
      return NextResponse.json({ error: "Cannot read CSV", log }, { status: 500 });
    }
  }

  // Step 5: Parse CSV lines
  const lines = csvContent.split("\n");
  const dataLines = lines.filter(l => l.trim().startsWith('"'));
  log.push(`Total lines: ${lines.length}, Data lines: ${dataLines.length}`);

  if (dataLines.length === 0) {
    await pool.end();
    return NextResponse.json({ error: "No data lines found in CSV", log }, { status: 500 });
  }

  // Step 6: Get tradition map
  const tradMap: Record<string, number> = {};
  try {
    const traditions = await pool.query("SELECT id, name FROM traditions");
    for (const t of traditions.rows) {
      tradMap[t.name.toLowerCase()] = t.id;
    }
    log.push(`Tradition map: ${JSON.stringify(tradMap)}`);
  } catch (e) {
    log.push(`Tradition map failed: ${e}`);
    await pool.end();
    return NextResponse.json({ error: "Cannot load traditions", log }, { status: 500 });
  }

  // CSV tradition → display name mapping
  const csvTradToDisplay: Record<string, string> = {
    "hermetic": "Hermetic & Alchemical", "alchemical": "Hermetic & Alchemical",
    "gnostic": "Gnostic", "kabbalistic": "Kabbalistic",
    "buddhist": "Buddhist & Zen", "zen buddhist": "Buddhist & Zen",
    "hindu": "Hindu & Vedic", "hindu occult": "Hindu & Vedic",
    "sufi": "Sufi & Islamic Mysticism", "taoist": "Taoist",
    "platonic": "Greek Philosophy", "aristotelian": "Greek Philosophy", "ancient philosophy": "Greek Philosophy",
    "neoplatonic": "Neoplatonic & Stoic", "stoic": "Neoplatonic & Stoic",
    "christian platonist": "Medieval & Scholastic", "scholastic": "Medieval & Scholastic", "jewish aristotelian": "Medieval & Scholastic",
    "renaissance platonist": "Renaissance", "renaissance hermetic": "Renaissance", "renaissance humanist": "Renaissance",
    "rosicrucian": "Renaissance", "masonic": "Renaissance",
    "theosophical": "Theosophical", "anthroposophical": "Theosophical",
    "thelemic": "Western Occultism", "french occult": "Western Occultism", "golden dawn": "Western Occultism",
    "magical": "Western Occultism", "occultism": "Western Occultism",
    "swedenborgian": "Spiritualism & Mysticism", "spiritualist": "Spiritualism & Mysticism", "mysticism": "Spiritualism & Mysticism",
    "modern philosophy": "Modern Philosophy",
  };

  // Step 7: Insert texts
  let inserted = 0;
  let errors = 0;
  const errDetails: string[] = [];

  for (const line of dataLines.slice(0, 5)) { // Start with just 5 for testing
    try {
      const fields: string[] = [];
      let current = "";
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') { inQuote = !inQuote; }
        else if (line[i] === ',' && !inQuote) { fields.push(current.trim()); current = ""; }
        else { current += line[i]; }
      }
      fields.push(current.trim());

      const [title, author, tradition, language, type, source, url, date, translator, notes] = fields;
      
      const displayName = csvTradToDisplay[tradition?.toLowerCase()] || tradition;
      const traditionId = tradMap[displayName?.toLowerCase()];
      
      if (!traditionId) {
        errDetails.push(`No tradition for: "${tradition}" → "${displayName}"`);
        errors++;
        continue;
      }

      // Author
      const authorSlug = (author || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const ar = await pool.query(
        "INSERT INTO authors (name, slug, tradition_id) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = $1 RETURNING id",
        [author || "Unknown", authorSlug, traditionId]
      );
      const authorId = ar.rows[0].id;

      // Text
      const textSlug = (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);
      const tr = await pool.query(
        `INSERT INTO texts (title, slug, author_id, tradition_id, language, type, source, source_url, date_written, translator, notes, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'intermediate')
         ON CONFLICT (slug) DO NOTHING RETURNING id`,
        [title, textSlug, authorId, traditionId, language || "English", type || "book", source || "", url || "", date || "", translator || "", notes || ""]
      );

      if (tr.rows.length > 0) {
        inserted++;
        log.push(`✓ Inserted: "${title}"`);
      } else {
        log.push(`~ Already exists: "${title}"`);
      }
    } catch (e) {
      errors++;
      errDetails.push(`Error on line: ${String(e).slice(0, 200)}`);
    }
  }

  log.push(`Inserted: ${inserted}, Errors: ${errors}`);
  if (errDetails.length > 0) log.push(`Error details: ${errDetails.join(' | ')}`);

  // If test batch worked, do the rest
  if (inserted > 0 || errors === 0) {
    log.push("Test batch OK, processing remaining...");
    for (const line of dataLines.slice(5)) {
      try {
        const fields: string[] = [];
        let current = "";
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i] === '"') { inQuote = !inQuote; }
          else if (line[i] === ',' && !inQuote) { fields.push(current.trim()); current = ""; }
          else { current += line[i]; }
        }
        fields.push(current.trim());

        const [title, author, tradition, language, type, source, url, date, translator, notes] = fields;
        const displayName = csvTradToDisplay[tradition?.toLowerCase()] || tradition;
        const traditionId = tradMap[displayName?.toLowerCase()];
        if (!traditionId) { errors++; continue; }

        const authorSlug = (author || "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const ar = await pool.query(
          "INSERT INTO authors (name, slug, tradition_id) VALUES ($1, $2, $3) ON CONFLICT (slug) DO UPDATE SET name = $1 RETURNING id",
          [author || "Unknown", authorSlug, traditionId]
        );
        const authorId = ar.rows[0].id;

        const textSlug = (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);
        await pool.query(
          `INSERT INTO texts (title, slug, author_id, tradition_id, language, type, source, source_url, date_written, translator, notes, difficulty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'intermediate')
           ON CONFLICT (slug) DO NOTHING`,
          [title, textSlug, authorId, traditionId, language || "English", type || "book", source || "", url || "", date || "", translator || "", notes || ""]
        );
        inserted++;
      } catch {
        errors++;
      }
    }
  }

  // Final count
  const final = await pool.query("SELECT COUNT(*) as c FROM texts");
  log.push(`Final text count: ${final.rows[0].c}`);
  
  await pool.end();
  return NextResponse.json({ message: "Seed complete", inserted, errors, totalTexts: final.rows[0].c, log });
}
