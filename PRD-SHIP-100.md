# PRD: EsoPhilo.com — Ship to 100%

## Current State
- **LIVE** at https://esophilo.com
- **1,178 texts** across 15 traditions (bulk ingest ran successfully)
- Repo: ~/Projects/esophilo (Next.js 14, PostgreSQL, Azure OpenAI, Stripe)

## What Works ✅
- Homepage with tradition browser (15 traditions, all with text counts)
- Tradition pages (list texts per tradition)
- Text detail pages (title, author, description, chapter list)
- Chapter reading pages (full text content)
- Ask the Sages AI chat (GPT-5.2 via Azure, with RAG + citations) — excellent quality
- Daily Wisdom API (random passage)
- Auth login page
- Stripe checkout (returns valid Stripe session URL)
- Search page (UI exists with search input)

## What's Missing / Broken

### P0 — Must Fix (blocking production)

#### 1. Search API returns empty
- `/api/search?q=plato` returns nothing
- The search page exists at `/search` with a proper input field
- Check `src/app/api/search/route.ts` and `src/lib/texts.ts#searchTexts`
- Likely a query issue or the search function isn't wired correctly

#### 2. Stripe publishable key not exposed to frontend
- Pricing page renders but has no visible Stripe PK in the HTML
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` likely not set in Coolify env vars
- The checkout API works server-side (returns Stripe URL), but the frontend Subscribe buttons may not work if they need client-side Stripe.js
- Verify: does clicking Subscribe on /pricing actually redirect to Stripe?

#### 3. Missing pages: /library and /about
- Both return 404
- `/library` should be the main browsable catalog (all texts, filterable/searchable)
- `/about` should explain what EsoPhilo is

### P1 — Important for Launch

#### 4. SEO & Meta tags
- Each text page, tradition page, and the homepage should have proper og:title, og:description, og:image
- Add sitemap.xml generation for all 1,178 texts
- Add robots.txt

#### 5. Daily Wisdom on homepage
- The API works (`/api/daily-wisdom` returns a quote)
- Should be displayed on the homepage as a featured section

#### 6. Text slug quality
- Bulk-ingested texts have ugly slugs from Gutenberg titles (e.g., `a-discovrse-of-fire-and-salt-discovering-many-secret-mysteries-as-well-philosophicall-as-theologicall`)
- Consider generating shorter, cleaner slugs for the most popular texts

#### 7. Navigation
- Add a proper navbar/header with links to: Home, Library/Traditions, Search, Ask the Sages, Pricing
- Currently relies on in-page links only

### P2 — Nice to Have

#### 8. Pro tier gating
- Free users get 3 Ask the Sages questions/day (already implemented)
- Verify the Stripe webhook properly upgrades users to Pro
- Verify Pro users get unlimited questions

#### 9. Bookmark/favorites system
- Let logged-in users bookmark texts and track reading progress

#### 10. Social sharing
- Share buttons on text/chapter pages

#### 11. Mobile responsive audit
- Verify all pages look good on mobile

## Technical Notes
- Coolify UUID: `dc840o00kg48so8s0s848o4c`
- Coolify API token: `2|piSvLrwL1PeI3Y7TceSNsqEWjXTuLPrmx3Q7W4TO1c1e86d5`
- DB: PostgreSQL on 10.0.0.20:5432/esophilo
- Azure OpenAI endpoint: in Coolify env vars
- Stripe keys: in Coolify env vars (need to verify NEXT_PUBLIC_ prefix)

## Acceptance Criteria
- [ ] Search returns results for common queries (plato, alchemy, meditation)
- [ ] /library page exists with browsable catalog
- [ ] /about page exists
- [ ] Pricing page Subscribe buttons redirect to Stripe checkout
- [ ] sitemap.xml generated with all texts
- [ ] Navigation header on all pages
- [ ] Daily wisdom shown on homepage
