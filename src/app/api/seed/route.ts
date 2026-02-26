import { NextRequest, NextResponse } from "next/server";
import { query, safeQuery } from "@/lib/db";

// Secret key to prevent unauthorized seeding
const SEED_KEY = process.env.SEED_SECRET || "esophilo-seed-2026";

export async function POST(request: NextRequest) {
  const { key } = await request.json().catch(() => ({ key: "" }));
  
  if (key !== SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Check current state
    const textCount = await query("SELECT COUNT(*) as c FROM texts");
    results.push(`Current texts: ${textCount.rows[0].c}`);

    if (parseInt(textCount.rows[0].c) > 0) {
      return NextResponse.json({ message: "Already seeded", results });
    }

    // Parse the CSV data
    const csvUrl = `${process.env.SITE_URL || "https://esophilo.com"}/sources.csv`;
    results.push(`Fetching CSV from: ${csvUrl}`);
    
    // Fetch CSV from public folder via localhost (external URL unreachable from inside container)
    const csvRes = await fetch("http://localhost:3000/sources.csv");
    if (!csvRes.ok) {
      return NextResponse.json({ error: `Failed to fetch CSV: ${csvRes.status}`, results }, { status: 500 });
    }
    const csvContent = await csvRes.text();
    results.push(`Fetched CSV: ${csvContent.length} bytes`);

    // Parse CSV
    const lines = csvContent.split("\n");
    const dataLines = lines.filter(l => l.trim().startsWith('"'));
    results.push(`Found ${dataLines.length} data rows`);

    // Get tradition map
    const traditions = await query("SELECT id, name FROM traditions");
    const tradMap: Record<string, number> = {};
    for (const t of traditions.rows) {
      tradMap[t.name.toLowerCase()] = t.id;
    }
    
    // Also map raw tradition names from CSV to display categories
    const csvTradToDisplay: Record<string, string> = {
      "hermetic": "Hermetic & Alchemical",
      "alchemical": "Hermetic & Alchemical",
      "gnostic": "Gnostic",
      "kabbalistic": "Kabbalistic",
      "buddhist": "Buddhist & Zen",
      "zen buddhist": "Buddhist & Zen",
      "hindu": "Hindu & Vedic",
      "hindu occult": "Hindu & Vedic",
      "sufi": "Sufi & Islamic Mysticism",
      "taoist": "Taoist",
      "platonic": "Greek Philosophy",
      "aristotelian": "Greek Philosophy",
      "ancient philosophy": "Greek Philosophy",
      "neoplatonic": "Neoplatonic & Stoic",
      "stoic": "Neoplatonic & Stoic",
      "christian platonist": "Medieval & Scholastic",
      "scholastic": "Medieval & Scholastic",
      "jewish aristotelian": "Medieval & Scholastic",
      "renaissance platonist": "Renaissance",
      "renaissance hermetic": "Renaissance",
      "renaissance humanist": "Renaissance",
      "rosicrucian": "Renaissance",
      "masonic": "Renaissance",
      "theosophical": "Theosophical",
      "anthroposophical": "Theosophical",
      "thelemic": "Western Occultism",
      "french occult": "Western Occultism",
      "golden dawn": "Western Occultism",
      "magical": "Western Occultism",
      "occultism": "Western Occultism",
      "swedenborgian": "Spiritualism & Mysticism",
      "spiritualist": "Spiritualism & Mysticism",
      "mysticism": "Spiritualism & Mysticism",
      "modern philosophy": "Modern Philosophy",
    };

    let inserted = 0;
    let errors = 0;

    for (const line of dataLines) {
      try {
        // Parse quoted CSV
        const fields: string[] = [];
        let current = "";
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            inQuote = !inQuote;
          } else if (ch === ',' && !inQuote) {
            fields.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
        fields.push(current.trim());

        if (fields.length < 7) continue;

        const [title, author, tradition, language, type, source, url, date, translator, notes] = fields;
        
        if (!title || !tradition) continue;

        // Find tradition ID
        const displayName = csvTradToDisplay[tradition.toLowerCase()] || tradition;
        const traditionId = tradMap[displayName.toLowerCase()];
        
        if (!traditionId) {
          results.push(`No tradition match for: "${tradition}" → "${displayName}"`);
          errors++;
          continue;
        }

        // Create author
        const authorSlug = author.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const authorResult = await safeQuery(
          `INSERT INTO authors (name, slug, tradition_id) VALUES ($1, $2, $3) 
           ON CONFLICT (slug) DO UPDATE SET name = $1 RETURNING id`,
          [author || "Unknown", authorSlug || "unknown", traditionId]
        );
        const authorId = authorResult?.rows[0]?.id;
        if (!authorId) { errors++; continue; }

        // Create text
        const textSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);
        const textResult = await safeQuery(
          `INSERT INTO texts (title, slug, author_id, tradition_id, language, type, source, source_url, date_written, translator, notes, difficulty)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'intermediate')
           ON CONFLICT (slug) DO NOTHING RETURNING id`,
          [title, textSlug, authorId, traditionId, language || "English", type || "book", source || "unknown", url || "", date || "", translator || "", notes || ""]
        );

        if (textResult?.rows[0]?.id) {
          inserted++;
        }
      } catch (err) {
        errors++;
      }
    }

    results.push(`Inserted: ${inserted}, Errors: ${errors}`);

    // Final count
    const finalCount = await query("SELECT COUNT(*) as c FROM texts");
    results.push(`Total texts now: ${finalCount.rows[0].c}`);

    return NextResponse.json({ message: "Seed complete", inserted, errors, results });
  } catch (err) {
    return NextResponse.json({ error: String(err), results }, { status: 500 });
  }
}
