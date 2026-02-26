# PRD: EsoPhilo P0 Launch Blockers

## Goal
Fix all 7 P0 issues identified in the Codex security review before launch.

## Fixes Required

### 1. Stop seed.ts from deleting data on restart
- **File**: `scripts/seed.ts` (lines ~189-192) + `start.sh`
- **Problem**: seed.ts hard-deletes chapters/texts/authors/traditions on every boot
- **Fix**: Make seed.ts idempotent — only INSERT if tables are empty. Use `INSERT ... ON CONFLICT DO NOTHING`. Remove any `DELETE FROM` or `TRUNCATE` statements. In start.sh, only run seed if texts table has 0 rows.

### 2. Add Stripe webhook signature verification
- **File**: `src/app/api/stripe/webhook/route.ts`
- **Problem**: Webhook parses raw JSON without verifying Stripe signature — anyone can forge events
- **Fix**: 
  - Add `STRIPE_WEBHOOK_SECRET` env var
  - Use `stripe.webhooks.constructEvent(body, sig, webhookSecret)` to verify
  - Reject requests with invalid signatures (return 400)
  - The `stripe` package is already installed

### 3. Pass user identity through Stripe checkout
- **File**: `src/app/api/stripe/checkout/route.ts`
- **Problem**: Checkout session doesn't include user email/id, so webhook can't match payment to user
- **Fix**: 
  - Accept `email` in the POST body (from logged-in user or form input)
  - Set `customer_email` on the Stripe checkout session
  - Optionally set `client_reference_id` to the user's DB id
  - Update webhook to use these fields reliably

### 4. Pro users bypass rate limit in Ask API
- **File**: `src/app/api/ask/route.ts`
- **Problem**: Rate limiting applies to everyone — Pro users still get 3/day
- **Fix**:
  - Check for auth token (JWT from cookie)
  - If valid Pro user → skip rate limit
  - If no auth or free user → apply 3/day limit
  - Import `verifyToken` from `@/lib/auth`

### 5. Magic link auth — add email sending
- **File**: `src/app/api/auth/magic-link/route.ts`
- **Problem**: Route generates magic link but doesn't send email (has a TODO comment)
- **Fix**:
  - Use Resend (add `resend` package) OR just return the magic link in the response for now (MVP: show link on screen, user clicks it)
  - For MVP, the simplest approach: return `{ verifyUrl }` in the JSON response and have the frontend show "Check your email" with the link visible (since we don't have email infra yet)
  - Add a TODO comment for proper email integration later

### 6. Add .dockerignore
- **File**: `.dockerignore` (create new)
- **Problem**: `COPY . .` in Dockerfile copies `.env.local` with live secrets into the image
- **Fix**: Create `.dockerignore` with:
  ```
  .env.local
  .env
  .git
  node_modules
  .next
  *.md
  ```

### 7. Remove seed endpoint default secret fallback
- **File**: `src/app/api/seed/route.ts` (line 4)
- **Problem**: `process.env.SEED_SECRET || "esophilo-seed-2026"` — predictable fallback
- **Fix**: If `SEED_SECRET` is not set, return 503 (service unavailable). No fallback.

## Constraints
- Do NOT break existing functionality
- Do NOT change the database schema
- All queries must remain parameterized (no SQL injection)
- Test that `npm run build` passes after all changes
- Commit with a clear message per fix or one combined commit

## Acceptance Criteria
- [ ] Restarting the container does NOT delete existing texts/chapters
- [ ] Stripe webhook rejects unsigned requests
- [ ] Checkout session includes customer_email
- [ ] Pro users can use Ask the Sages unlimited
- [ ] Free users still limited to 3/day
- [ ] .dockerignore prevents .env.local from being copied
- [ ] Seed endpoint returns 503 if no SEED_SECRET configured
- [ ] `npm run build` passes cleanly
