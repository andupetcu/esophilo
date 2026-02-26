#!/bin/sh
set -e

echo "=== EsoPhilo Startup ==="

# Run DB setup (creates tables if they don't exist)
echo "Running database setup..."
tsx scripts/setup-db.ts 2>&1 || echo "DB setup skipped (may already exist)"

# Run seed (inserts traditions/authors/texts if empty)
echo "Running seed..."
tsx scripts/seed.ts 2>&1 || echo "Seed skipped (may already be populated)"

# Run content ingestion (fetches Gutenberg texts if chapters table is empty)
echo "Running content ingestion (this may take a while on first run)..."
tsx scripts/ingest.ts 2>&1 || echo "Ingestion skipped or partially completed"

echo "=== Starting Next.js server ==="
exec node server.js
