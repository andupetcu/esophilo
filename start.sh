#!/bin/sh
set -e

echo "=== EsoPhilo Startup ==="

# Run DB setup (creates tables if they don't exist)
echo "Running database setup..."
tsx scripts/setup-db.ts 2>&1 || echo "DB setup skipped (may already exist)"

# Run seed (inserts traditions/authors/texts from CSV if empty)
echo "Checking seed state..."
TEXT_COUNT=$(node -e "const { Client } = require('pg'); (async () => { const c = new Client({ connectionString: process.env.DATABASE_URL }); try { await c.connect(); const r = await c.query('SELECT COUNT(*)::int AS count FROM texts'); console.log(r.rows[0].count ?? 0); } catch { console.log('0'); } finally { await c.end().catch(() => {}); } })();")
if [ "$TEXT_COUNT" = "0" ]; then
  echo "Running seed..."
  tsx scripts/seed.ts 2>&1 || echo "Seed skipped (may already be populated)"
else
  echo "Seed skipped: texts table has $TEXT_COUNT rows."
fi

# Run CSV-based ingestion (fetches Gutenberg texts from the seed list)
echo "Running CSV content ingestion..."
tsx scripts/ingest.ts 2>&1 || echo "CSV ingestion skipped or partially completed"

# Run bulk ingestion in background (fetches thousands more from Gutendex API)
echo "Starting bulk ingestion in background..."
nohup tsx scripts/bulk-ingest.ts > /tmp/bulk-ingest.log 2>&1 &

echo "=== Starting Next.js server ==="
exec node server.js
