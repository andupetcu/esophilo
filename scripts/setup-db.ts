import { Pool } from "pg";

const baseUrl = process.env.DATABASE_URL || "postgres://postgres:8hfb0G6VzobRRJQ26vH47blxIrTI430p3bqv19NrcQAUezTRUONkLmZLHyyOqKEI@10.0.0.20:5432/postgres";

async function setup() {
  // Connect to default 'postgres' database to create esophilo database
  const adminUrl = baseUrl.replace(/\/esophilo$/, "/postgres");
  const adminPool = new Pool({ connectionString: adminUrl });

  try {
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'esophilo'"
    );
    if (dbCheck.rows.length === 0) {
      await adminPool.query("CREATE DATABASE esophilo");
      console.log("Created database: esophilo");
    } else {
      console.log("Database esophilo already exists");
    }
  } finally {
    await adminPool.end();
  }

  // Connect to esophilo database and create tables
  const appUrl = baseUrl.replace(/\/postgres$/, "/esophilo").includes("/esophilo")
    ? baseUrl.includes("/esophilo") ? baseUrl : baseUrl.replace(/\/[^/]*$/, "/esophilo")
    : baseUrl;
  const pool = new Pool({
    connectionString: "postgres://postgres:8hfb0G6VzobRRJQ26vH47blxIrTI430p3bqv19NrcQAUezTRUONkLmZLHyyOqKEI@10.0.0.20:5432/esophilo",
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS traditions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS authors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        bio TEXT,
        born TEXT,
        died TEXT,
        tradition_id INT REFERENCES traditions(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS texts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        author_id INT REFERENCES authors(id),
        tradition_id INT REFERENCES traditions(id),
        language TEXT DEFAULT 'English',
        type TEXT,
        source TEXT,
        source_url TEXT,
        date_written TEXT,
        translator TEXT,
        notes TEXT,
        description TEXT,
        difficulty TEXT DEFAULT 'intermediate',
        reading_time_min INT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chapters (
        id SERIAL PRIMARY KEY,
        text_id INT REFERENCES texts(id) ON DELETE CASCADE,
        chapter_number INT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        word_count INT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(text_id, chapter_number)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        is_pro BOOLEAN DEFAULT FALSE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        ai_queries_today INT DEFAULT 0,
        ai_queries_reset_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS magic_links (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
        highlight_text TEXT,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS daily_wisdom (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        chapter_id INT REFERENCES chapters(id),
        passage TEXT NOT NULL,
        modern_interpretation TEXT,
        tradition_id INT REFERENCES traditions(id),
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Created all tables");

    // Create full-text search indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chapters_content_fts ON chapters USING GIN (to_tsvector('english', content));
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_texts_title_fts ON texts USING GIN (to_tsvector('english', title));
    `);
    console.log("Created full-text search indexes");

  } finally {
    await pool.end();
  }

  console.log("Database setup complete!");
}

setup().catch(console.error);
