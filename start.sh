#!/bin/sh
set -e

echo "=== EsoPhilo Startup ==="

# Run DB setup (creates tables if they don't exist)
echo "Running database setup..."
tsx scripts/setup-db.ts 2>&1 || echo "DB setup skipped (may already exist)"

# Run seed (inserts traditions/authors/texts from CSV if empty)
echo "Running seed..."
tsx scripts/seed.ts 2>&1 || echo "Seed skipped (may already be populated)"

# Run CSV-based ingestion (fetches Gutenberg texts from the seed list)
echo "Running CSV content ingestion..."
tsx scripts/ingest.ts 2>&1 || echo "CSV ingestion skipped or partially completed"

# Run bulk ingestion in background (fetches thousands more from Gutendex API)
echo "Starting bulk ingestion in background..."
nohup tsx scripts/bulk-ingest.ts > /tmp/bulk-ingest.log 2>&1 &

echo "=== Starting Next.js server ==="
exec node server.js
