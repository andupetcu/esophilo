import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Display categories mapping
const displayCategories: Record<string, { name: string; icon: string; description: string; traditions: string[] }> = {
  "hermetic-alchemical": {
    name: "Hermetic & Alchemical",
    icon: "⚗️",
    description: "The ancient art of transformation — from the Emerald Tablet to the Philosopher's Stone. These texts explore the unity of matter and spirit through symbolic and practical alchemy.",
    traditions: ["Hermetic", "Alchemical"],
  },
  "gnostic": {
    name: "Gnostic",
    icon: "✨",
    description: "Texts of divine knowledge and spiritual liberation. Gnostic writings reveal hidden truths about the nature of the divine, the cosmos, and humanity's place within it.",
    traditions: ["Gnostic"],
  },
  "kabbalistic": {
    name: "Kabbalistic",
    icon: "🕎",
    description: "The mystical tradition of Jewish esoteric wisdom. From the Sefer Yetzirah to the Zohar, these texts map the hidden structure of creation.",
    traditions: ["Kabbalistic"],
  },
  "buddhist-zen": {
    name: "Buddhist & Zen",
    icon: "☸️",
    description: "Teachings on the nature of mind, suffering, and liberation. From the Diamond Sutra to Zen koans, these texts point toward awakening.",
    traditions: ["Buddhist", "Zen Buddhist"],
  },
  "hindu-vedic": {
    name: "Hindu & Vedic",
    icon: "🕉️",
    description: "The vast ocean of Indian wisdom — Vedas, Upanishads, Bhagavad Gita, and Yoga Sutras. Texts exploring dharma, karma, and the nature of the Self.",
    traditions: ["Hindu", "Hindu Occult"],
  },
  "sufi": {
    name: "Sufi & Islamic Mysticism",
    icon: "🌹",
    description: "The poetry and philosophy of divine love. Rumi, Hafiz, and Attar guide seekers on the path of the heart toward union with the Beloved.",
    traditions: ["Sufi"],
  },
  "taoist": {
    name: "Taoist",
    icon: "☯️",
    description: "The Way that cannot be spoken. Laozi, Zhuangzi, and the I Ching reveal the harmony of nature and the art of effortless action.",
    traditions: ["Taoist"],
  },
  "greek-philosophy": {
    name: "Greek Philosophy",
    icon: "🏛️",
    description: "The foundations of Western thought. Plato's dialogues, Aristotle's treatises, and the wisdom of ancient Athens.",
    traditions: ["Platonic", "Aristotelian", "Ancient Philosophy"],
  },
  "neoplatonic-stoic": {
    name: "Neoplatonic & Stoic",
    icon: "🌟",
    description: "From Plotinus's vision of the One to Marcus Aurelius's meditations on virtue. Philosophy as a way of life and spiritual ascent.",
    traditions: ["Neoplatonic", "Stoic"],
  },
  "medieval-scholastic": {
    name: "Medieval & Scholastic",
    icon: "📜",
    description: "Where faith meets reason. Boethius, Aquinas, and Maimonides wrestle with the deepest questions of existence, God, and the good life.",
    traditions: ["Christian Platonist", "Scholastic", "Jewish Aristotelian"],
  },
  "renaissance": {
    name: "Renaissance",
    icon: "🎨",
    description: "The rebirth of ancient wisdom. Ficino, Bruno, and Pico della Mirandola weave together Hermeticism, Platonism, and Christian mysticism.",
    traditions: ["Renaissance Platonist", "Renaissance Hermetic", "Renaissance Humanist", "Rosicrucian"],
  },
  "theosophical": {
    name: "Theosophical",
    icon: "👁️",
    description: "Blavatsky, Besant, and Steiner's synthesis of Eastern and Western esoteric traditions. The Secret Doctrine unveiled.",
    traditions: ["Theosophical", "Anthroposophical"],
  },
  "western-occultism": {
    name: "Western Occultism",
    icon: "🔮",
    description: "The hidden arts of the West — from Eliphas Levi to Aleister Crowley, the Golden Dawn to grimoires of power.",
    traditions: ["Thelemic", "French Occult", "Golden Dawn", "Masonic", "Magical", "Occultism"],
  },
  "spiritualism-mysticism": {
    name: "Spiritualism & Mysticism",
    icon: "🕊️",
    description: "Swedenborg's visions, Kardec's spirit communications, and the universal mystical experience across all traditions.",
    traditions: ["Swedenborgian", "Spiritualist", "Mysticism"],
  },
  "modern-philosophy": {
    name: "Modern Philosophy",
    icon: "💭",
    description: "The continuation of the philosophical tradition into the modern era. New perspectives on ancient questions.",
    traditions: ["Modern Philosophy"],
  },
};

interface CsvRow {
  title: string;
  author: string;
  tradition: string;
  language: string;
  type: string;
  source: string;
  url: string;
  date: string;
  translator: string;
  notes: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split("\n");
  const rows: CsvRow[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, headers, section markers
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("title,")) continue;

    // Must start with a quote to be a data row
    if (!trimmed.startsWith('"')) continue;

    const fields = parseCsvLine(trimmed);
    if (fields.length >= 10) {
      rows.push({
        title: fields[0],
        author: fields[1],
        tradition: fields[2],
        language: fields[3],
        type: fields[4],
        source: fields[5],
        url: fields[6],
        date: fields[7],
        translator: fields[8],
        notes: fields[9],
      });
    }
  }

  return rows;
}

async function seed() {
  const csvPath = path.join(__dirname, "..", "sources.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(csvContent);

  console.log(`Parsed ${rows.length} texts from CSV`);

  // Clear existing data
  await pool.query("DELETE FROM chapters");
  await pool.query("DELETE FROM texts");
  await pool.query("DELETE FROM authors");
  await pool.query("DELETE FROM traditions");

  // Insert display categories as traditions
  let sortOrder = 0;
  const traditionIdMap: Record<string, number> = {};

  for (const [slug, cat] of Object.entries(displayCategories)) {
    sortOrder++;
    const result = await pool.query(
      `INSERT INTO traditions (name, slug, description, icon, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (slug) DO UPDATE SET name = $1, description = $3, icon = $4, sort_order = $5
       RETURNING id`,
      [cat.name, slug, cat.description, cat.icon, sortOrder]
    );
    const traditionId = result.rows[0].id;
    // Map all sub-traditions to this display category
    for (const t of cat.traditions) {
      traditionIdMap[t] = traditionId;
    }
  }

  console.log(`Inserted ${Object.keys(displayCategories).length} traditions`);

  // Insert authors and texts
  const authorIdMap: Record<string, number> = {};
  let textCount = 0;

  for (const row of rows) {
    const traditionId = traditionIdMap[row.tradition];
    if (!traditionId) {
      console.warn(`Unknown tradition: "${row.tradition}" for "${row.title}"`);
      continue;
    }

    // Insert or get author
    const authorSlug = slugify(row.author);
    if (!authorIdMap[authorSlug]) {
      const existing = await pool.query("SELECT id FROM authors WHERE slug = $1", [authorSlug]);
      if (existing.rows.length > 0) {
        authorIdMap[authorSlug] = existing.rows[0].id;
      } else {
        const result = await pool.query(
          `INSERT INTO authors (name, slug, tradition_id) VALUES ($1, $2, $3) RETURNING id`,
          [row.author, authorSlug, traditionId]
        );
        authorIdMap[authorSlug] = result.rows[0].id;
      }
    }

    // Insert text
    const textSlug = slugify(row.title);
    try {
      await pool.query(
        `INSERT INTO texts (title, slug, author_id, tradition_id, language, type, source, source_url, date_written, translator, notes, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (slug) DO NOTHING`,
        [
          row.title,
          textSlug,
          authorIdMap[authorSlug],
          traditionId,
          row.language,
          row.type,
          row.source,
          row.url,
          row.date,
          row.translator,
          row.notes,
          "intermediate",
        ]
      );
      textCount++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`Failed to insert text "${row.title}": ${message}`);
    }
  }

  console.log(`Inserted ${textCount} texts`);
  console.log("Seed complete!");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
