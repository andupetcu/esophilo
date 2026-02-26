# EsoPhilo.com — Build Spec

## Overview
A beautiful digital library of 120+ public domain philosophy and esoteric texts with AI-powered understanding. "Ancient Wisdom, Modern Understanding."

Target: Non-technical spiritual seekers, philosophy enthusiasts, students, meditators.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui, dark mode default
- **Backend:** Next.js API routes (keep it simple, one deployable)
- **Database:** PostgreSQL on 10.0.0.20 (`postgres://user:password@host:5432/esophilo`)
- **AI:** Azure OpenAI GPT-5.2 (`https://footprints-ai-ml.openai.azure.com/openai/responses?api-version=2025-04-01-preview`, key: `YOUR_AZURE_OPENAI_KEY`)
- **Auth:** Simple email magic link (no heavy auth provider needed)
- **Payments:** Stripe (reuse existing account)
- **Deploy:** Coolify on existing server

## Database Schema

```sql
CREATE DATABASE esophilo;

-- Traditions (Hermetic, Gnostic, Buddhist, Stoic, etc.)
CREATE TABLE traditions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- emoji or icon name
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Authors
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  born TEXT, -- "6th century BCE" etc, not a date
  died TEXT,
  tradition_id INT REFERENCES traditions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Texts (the actual works)
CREATE TABLE texts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  author_id INT REFERENCES authors(id),
  tradition_id INT REFERENCES traditions(id),
  language TEXT DEFAULT 'English',
  type TEXT, -- treatise, dialogue, poem, sutra, etc.
  source TEXT, -- gutenberg, archive_org, wikisource
  source_url TEXT,
  date_written TEXT, -- "380 BCE", "13th century", etc.
  translator TEXT,
  notes TEXT,
  description TEXT, -- AI-generated summary
  difficulty TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced
  reading_time_min INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters/sections of each text
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  text_id INT REFERENCES texts(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT,
  content TEXT NOT NULL, -- the actual text content (markdown)
  word_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(text_id, chapter_number)
);

-- Full-text search index
CREATE INDEX idx_chapters_content_fts ON chapters USING GIN (to_tsvector('english', content));
CREATE INDEX idx_texts_title_fts ON texts USING GIN (to_tsvector('english', title));

-- Users (simple)
CREATE TABLE users (
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

-- Magic link tokens
CREATE TABLE magic_links (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bookmarks
CREATE TABLE bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  chapter_id INT REFERENCES chapters(id) ON DELETE CASCADE,
  highlight_text TEXT, -- optional highlighted passage
  note TEXT, -- user's note
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI chat conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  sources_json JSONB, -- [{text_id, chapter_id, quote}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily wisdom
CREATE TABLE daily_wisdom (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  chapter_id INT REFERENCES chapters(id),
  passage TEXT NOT NULL,
  modern_interpretation TEXT,
  tradition_id INT REFERENCES traditions(id),
  image_url TEXT, -- generated quote card
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Content Ingestion

### Phase 1: Seed from CSV
The attached CSV has 120+ texts with URLs. Create a seed script that:
1. Parses the CSV into traditions, authors, texts tables
2. For each text with a Gutenberg URL: fetch the HTML/text, split into chapters, store in `chapters` table
3. For texts without fetchable URLs: store metadata only, mark as "coming soon"

The traditions from the CSV:
- Hermetic, Gnostic, Alchemical, Kabbalistic, Buddhist, Zen Buddhist, Hindu, Sufi, Taoist
- Platonic, Aristotelian, Neoplatonic, Stoic, Ancient Philosophy
- Christian Platonist, Scholastic, Jewish Aristotelian, Renaissance (Platonist, Hermetic, Humanist)
- Theosophical, Thelemic, French Occult, Golden Dawn, Rosicrucian, Masonic
- Swedenborgian, Spiritualist, Magical, Anthroposophical, Mysticism, Occultism, Hindu Occult, Modern Philosophy

Group these into display categories:
1. **Hermetic & Alchemical** (Hermetic + Alchemical)
2. **Gnostic** 
3. **Kabbalistic**
4. **Buddhist & Zen**
5. **Hindu & Vedic** (Hindu + Hindu Occult)
6. **Sufi & Islamic Mysticism**
7. **Taoist**
8. **Greek Philosophy** (Platonic + Aristotelian + Ancient Philosophy)
9. **Neoplatonic & Stoic**
10. **Medieval & Scholastic** (Christian Platonist + Scholastic + Jewish Aristotelian)
11. **Renaissance** (Renaissance * + Rosicrucian)
12. **Theosophical** (Theosophical + Anthroposophical)
13. **Western Occultism** (Thelemic + French Occult + Golden Dawn + Masonic + Magical + Occultism)
14. **Spiritualism & Mysticism** (Swedenborgian + Spiritualist + Mysticism)
15. **Modern Philosophy**

### Phase 2: Gutenberg Scraper
Create a script `scripts/ingest.ts` that:
1. For each text with a gutenberg URL, fetches the page
2. Extracts clean text (strip HTML boilerplate, headers, footers, licensing)
3. Splits into chapters (by heading patterns, "CHAPTER", "Book", section breaks)
4. Stores each chapter in the DB
5. Calculates word count and reading time (250 wpm)
6. Falls back to storing as single chapter if no chapter markers found

Handle gracefully: 404s, rate limiting (add delays between requests), encoding issues.

## Pages

### `/` — Homepage
- Hero: "Ancient Wisdom, Modern Understanding" with subtle animated background (stars/constellation pattern CSS only)
- Daily Wisdom card (today's passage + interpretation)
- Browse by tradition (grid of 15 tradition cards with icons)
- Featured texts (curated selection)
- "Ask the Sages" CTA
- Footer with "120+ texts • 16 traditions • Thousands of years of wisdom"

### `/traditions` — All traditions
- Grid of tradition cards, each with: icon/emoji, name, text count, brief description
- Click → tradition detail page

### `/tradition/[slug]` — Tradition detail
- Tradition description, historical context
- List of all texts in this tradition
- Related traditions

### `/text/[slug]` — Text detail / reading page
- Text metadata: author, date, tradition, translator, description
- Table of contents (chapters)
- Start reading button
- Bookmark button (Pro)

### `/text/[slug]/[chapter]` — Reading page
- Beautiful typography (serif font, proper line height, generous margins)
- Dark mode by default, toggle to light
- Chapter navigation (prev/next)
- Progress indicator
- "Explain this passage" button on text selection (Pro — opens AI sidebar)
- Bookmark/highlight feature (Pro)
- Share quote button (generates image card)

### `/search` — Search
- Full-text search across all texts
- Filter by tradition, author, era
- Results show: text title, matching passage with highlight, tradition badge

### `/ask` — Ask the Sages (the money feature)
- Chat interface (clean, like ChatGPT but with ancient aesthetic)
- Free users: 3 queries/day, see a "Upgrade to Pro" after limit
- Pro users: unlimited
- AI grounded in the actual texts, always cites sources
- Suggested questions: "What is the nature of reality?", "How do I find inner peace?", "What did Plato think about justice?"
- Source citations link to the actual passage in the reading view

### `/pricing` — Pricing page
- Free tier: Read all texts, search, 3 AI queries/day, daily wisdom
- Pro ($7/mo or $49/year): Unlimited AI queries, passage explainer, bookmarks & notes, reading paths, daily wisdom email, no ads
- Stripe checkout

### `/auth/login` — Magic link login
- Email input, "Send magic link" button
- Check your email page
- Token verification page

## API Routes

### Public
- `GET /api/traditions` — list all traditions with text counts
- `GET /api/texts?tradition=X&search=X` — list/search texts
- `GET /api/texts/[slug]` — get text with chapters
- `GET /api/texts/[slug]/[chapter]` — get chapter content
- `GET /api/search?q=X` — full-text search
- `GET /api/daily-wisdom` — today's wisdom
- `POST /api/auth/magic-link` — send magic link email
- `GET /api/auth/verify?token=X` — verify magic link, return JWT

### Authenticated
- `POST /api/ask` — Ask the Sages (AI chat) — rate limited for free users
- `GET /api/conversations` — list user's conversations
- `POST /api/bookmarks` — save bookmark
- `GET /api/bookmarks` — list bookmarks
- `POST /api/stripe/checkout` — create Stripe checkout session
- `POST /api/stripe/webhook` — handle Stripe events
- `POST /api/stripe/portal` — create customer portal session

## AI Implementation ("Ask the Sages")

### System Prompt
```
You are EsoPhilo's "Ask the Sages" — an AI guide to humanity's ancient wisdom traditions. You have deep knowledge of 120+ texts spanning Hermetic, Gnostic, Kabbalistic, Buddhist, Hindu, Sufi, Taoist, Greek, Stoic, Neoplatonic, Medieval, Renaissance, Theosophical, and Western Occult traditions.

When answering questions:
1. Draw from SPECIFIC texts and passages — always cite your sources
2. Present multiple traditions' perspectives when relevant
3. Use plain, accessible language — explain archaic concepts clearly
4. Be reverent but not preachy — treat all traditions with equal respect
5. Format citations as: [Author, "Title", Chapter/Section]
6. If asked about a specific text, quote relevant passages directly
7. Never invent quotes — only reference actual texts in the library
8. Suggest related readings from the library

You speak with warmth and depth, like a wise librarian who has read everything and remembers it all.
```

### RAG Pipeline (simplified for MVP)
For MVP, use the PostgreSQL full-text search to find relevant passages, then include them in the prompt context. This is simpler than vector embeddings and good enough for launch:

1. User asks question
2. Extract key terms, search `chapters` table with `ts_rank`
3. Take top 5 matching passages
4. Include in system prompt as context
5. Generate response with citations

### Passage Explainer
When user selects text and clicks "Explain":
1. Send the selected passage + surrounding context
2. AI returns: plain English explanation, historical context, cross-references to other traditions

## Design

### Typography
- Headings: `Playfair Display` or `Cormorant Garamond` (elegant serif)
- Body text: `Crimson Text` or `Lora` (readable serif)
- UI elements: `Inter` (clean sans-serif)

### Color Palette (Dark Mode Default)
- Background: `#0a0a0f` (near black with blue tint)
- Card background: `#141420`
- Text: `#e8e6e3` (warm white)
- Accent: `#c9a96e` (warm gold — feels "ancient")
- Secondary accent: `#7c6c8a` (muted purple — mystical)
- Links: `#d4a853`

### Light Mode
- Background: `#faf8f5` (warm cream)
- Card: `#ffffff`
- Text: `#1a1a2e`
- Accent: `#8b6914` (darker gold)

### Vibe
Think: ancient library meets modern reader app. Subtle, elegant, no visual clutter. The content is the star. Gentle animations on page transitions. Star/constellation pattern as subtle background texture.

## Stripe Integration

Create new products in Stripe via API on first run:
- Product: "EsoPhilo Pro"
- Price: $7/month (monthly)
- Price: $49/year (yearly, ~42% savings)

Use Stripe Checkout for payment, Customer Portal for management.

Webhook handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

## Email (Magic Links + Daily Wisdom)

For MVP, use a simple SMTP approach or Resend.com. The magic link email just needs:
- Subject: "Your EsoPhilo login link"
- Body: "Click here to sign in: {link}" (link expires in 15 min)

Daily wisdom email for Pro users (Phase 2, skip for MVP).

## Deployment

### Dockerfile
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/next.config.* ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Variables
```
DATABASE_URL=postgres://user:password@host:5432/esophilo
AZURE_OPENAI_ENDPOINT=https://footprints-ai-ml.openai.azure.com/openai/responses?api-version=2025-04-01-preview
AZURE_OPENAI_KEY=YOUR_AZURE_OPENAI_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
JWT_SECRET=esophilo-jwt-secret-change-me-in-prod
SITE_URL=https://esophilo.com
```

## Build Priority (what to build first)

### MVP (Day 1-2) — GET THIS LIVE
1. Next.js project setup with Tailwind + shadcn/ui
2. Database schema + seed script (traditions, authors, texts from CSV)
3. Homepage with tradition grid + daily wisdom placeholder
4. Tradition pages listing texts
5. Text detail pages with chapter reading
6. Full-text search
7. Dark mode by default, beautiful typography

### Day 3 — AI + Auth
8. Magic link auth
9. "Ask the Sages" chat with RAG
10. Passage explainer (text selection → explain)
11. Rate limiting (3 free AI queries/day)

### Day 4 — Money
12. Stripe integration (Pro tier $7/mo, $49/yr)
13. Pricing page
14. Upgrade flow + paywall on AI features
15. Bookmarks (Pro feature)

### Day 5 — Growth
16. Daily wisdom generator (cron job)
17. Quote card image generation (shareable)
18. SEO optimization (meta tags, structured data, sitemap)
19. Dockerfile + deploy to Coolify

## Content CSV Location
The CSV data is at: `/Users/andrei/.openclaw/media/inbound/file_42---3a79c054-b46f-49b2-974f-3eb1502d6c3a.md`

Parse it as pipe-delimited or detect the actual format. Each row has: title, author, tradition, language, type, source, url, date, translator, notes

## Git
Initialize a git repo in the working directory. Commit frequently. Push to GitHub `andupetcu/esophilo` (create if needed).

## IMPORTANT
- Use `pg` package directly (raw SQL), NO ORM
- Dark mode default, warm gold accents
- Serif fonts for reading, sans-serif for UI
- Mobile-first responsive design
- The reading experience is THE product — make it beautiful
- Every text and chapter gets its own URL (SEO)
- Traditions get their own landing pages (SEO)
- Test: `npm run build` must pass before committing
