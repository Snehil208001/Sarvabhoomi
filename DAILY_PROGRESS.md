# 🇳🇵 Sarvabhoomi Capital & Investment — Daily Engineering Progress

> **Platform:** Nepal's Zero-Brokerage P2P Property Marketplace & Wealth Tracker  
> **Repository:** Monorepo (`apps/web`, `packages/shared`, `supabase`)  
> **Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide Icons, Turborepo, Supabase Auth & Database

---

## 📌 Executive Summary

This log tracks all architectural decisions, feature implementations, verification results, and upcoming technical milestones for **Sarvabhoomi Capital & Investment**.

---

## 🗓️ Engineering Log

### 📅 Session: November 5, 2026 (Phases 3, 4, 5 & 6 — Structure, Hygiene, Features & Quality Gates)

#### 🎯 Focus: Component Modularization, SEO & Project Hygiene, Real Valuation Engine & Map References, Vitest Unit Testing & ESLint Gates

---

### ✅ Completed Milestones

#### 1. Component Extraction & Structure (Phase 3)
- **`<Navbar>` (`apps/web/src/components/Navbar.tsx`)**: Reusable institutional header with bilingual EN/नेपाली toggle, active tab indicators, authenticated user state with credits counter pill, and responsive mobile navigation drawer.
- **`<Footer>` (`apps/web/src/components/Footer.tsx`)**: Clean institutional footer featuring district coverage, legal disclaimer, 0% brokerage badge, and copyright notices.
- **`<PropertyCard>` (`apps/web/src/components/PropertyCard.tsx`)**: Standardized property listing card featuring `PropertyImage` fallback, Lalpurja verification badge (Admin vs Claimed), price formatting in NPR Lakh/Crore, area formatting in Ropani/Kattha, and instant contact modal trigger.
- **`<LandCalculator>` (`apps/web/src/components/LandCalculator.tsx`)**: Interactive bidirectional converter between Hilly units (Ropani, Aana, Paisa, Daam) and Terai units (Bigha, Kattha, Dhur) with square feet calculation.
- **Shared i18n Dictionaries (`packages/shared/src/i18n/`)**: Extracted `searchDict.ts`, `propertyDict.ts`, and `dashboardDict.ts` into shared package to eliminate duplicated strings across client routes.

#### 2. SEO, Next.js & Project Hygiene (Phase 4)
- **Root `README.md`**: Comprehensive developer guide documenting architecture, directory layout, installation steps, database migrations, and scripts.
- **Next.js App Router Hygiene**:
  - `apps/web/src/app/error.tsx`: Global error boundary with retry trigger and home fallback.
  - `apps/web/src/app/loading.tsx`: Clean Suspense loading skeleton for fast initial paint.
  - `apps/web/src/app/not-found.tsx`: Institutional 404 page with navigation to Home and Search.
  - `apps/web/src/app/sitemap.ts` & `apps/web/src/app/robots.ts`: Dynamic XML sitemap and crawler directive generator for search indexing.
  - `apps/web/src/app/icon.svg`: Custom SVG brand favicon with Nepali "स" glyph in emerald green.
- **GitHub Actions CI (`.github/workflows/ci.yml`)**: Automated CI pipeline running unit tests, ESLint, TypeScript check, and Next.js production build on push and PRs to `main`.
- **Inline Alert Notification**: Replaced browser `alert()` in `ContactUnlockModal.tsx` with non-blocking inline warning card.

#### 3. Real Valuation Engine & Honest GIS Mapping (Phase 5)
- **Interactive Valuation Engine (`apps/web/src/app/valuation/page.tsx` & `packages/shared/src/units/valuationRates.ts`)**:
  - Replaced dead links with live interactive valuation calculator.
  - Computes Government Minimum Land Rate vs. Estimated Market Rate across representative Nepal districts (Kathmandu, Lalitpur, Bhaktapur, Kaski, Chitwan, Rupandehi, Morang, etc.).
  - Calculates estimated Municipal Registration Tax (4.5%) and instant 0% Brokerage Savings (3% saved vs traditional brokers).
- **Honest Cadastral & Location Card (`apps/web/src/app/properties/[id]/page.tsx`)**:
  - Replaced fake "GIS Polygon #KITTA-102" simulation copy with an honest "Cadastral Survey & Location Reference" header.
  - Added interactive Google Maps exploration links for the property locality and nearby amenities (healthcare, banks, schools).
- **Portfolio Valuation & Brokerage Savings Tracker (`apps/web/src/app/dashboard/page.tsx`)**:
  - Added real-time portfolio summary card summing asking values across user listings and computing total brokerage commission saved.

#### 4. Quality Gates & Vitest Testing (Phase 6)
- **Unit Tests (`packages/shared/src/__tests__/`)**:
  - `conversion.test.ts`: Verified land conversions (`toSqFt`, `fromSqFt`, `formatArea`) and price formatting (`formatPriceNPR`, `formatPricePerUnit`).
  - `valuation.test.ts`: Verified government vs market valuation rates, 3% savings, and 77 Nepal district region mappings.
  - 100% test pass rate (16/16 tests passing in Vitest).
- **ESLint & Turborepo Verification**:
  - Installed ESLint and `eslint-config-next` in `apps/web`.
  - Configured `apps/web/.eslintrc.json` with `next/core-web-vitals`.
  - Added `test` task to `turbo.json` and root `package.json`.
  - Verified `npm test` (16 passed), `npm run lint` (0 errors), `npm run type-check` (3/3 packages clean), and `npm run build` (all 13 routes compiled).

---

### 📅 Session: November 5, 2026 (Phase 2 — P0: Correctness & Performance)

#### 🎯 Focus: Search Server-Side Pagination & ILIKE Text Search, Compound Database Indexes Migration, and Next.js Image Optimization with Graceful SVG Fallbacks

---

### ✅ Completed Milestones

#### 1. Server-Side Search Pagination & Range Queries (`apps/web/src/app/search/page.tsx`)
- Replaced unconstrained client-side array filtering with Supabase `.range(from, to)` paging (12 listings per page).
- Implemented exact count tracking `{ count: 'exact' }` to determine accurate global page totals.
- Migrated locality and title filtering from client-side arrays to server-side Postgres pattern matching (`query.or('locality.ilike.%...%,title.ilike.%...%,district.ilike.%...%,municipality.ilike.%...%')`).
- Built responsive pagination controls (Previous, Page X of Y, Next, Item range indicator) with automatic scroll-to-top on page change.
- Added 1-click filter reset on empty states when zero properties match applied filters.

#### 2. Composite Database Search Indexes (`supabase/migrations/20261105000005_search_performance_indexes.sql`)
- Enabled PostgreSQL trigram extension (`pg_trgm`).
- Created composite index `idx_properties_search` on `(status, listing_type, district, price_npr)` for multi-dimensional search queries.
- Added partial indexes:
  - `idx_properties_admin_verified` on `(admin_verified) WHERE admin_verified = TRUE`.
  - `idx_properties_owner_declared` on `(owner_declared_lalpurja) WHERE owner_declared_lalpurja = TRUE`.
- Created GIN trigram indexes `idx_properties_locality_trgm` and `idx_properties_title_trgm` for high-throughput substring searches.
- Created dashboard index `idx_properties_owner_created` on `(owner_id, created_at DESC)`.

#### 3. Next.js Image Optimization & Graceful Fallbacks (`apps/web/src/components/PropertyImage.tsx`, `next.config.mjs`)
- Configured `next.config.mjs` with `images.remotePatterns` for `images.unsplash.com`, `plus.unsplash.com`, and `*.supabase.co`.
- Added security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- Created unified `<PropertyImage>` component wrapping Next.js `<Image>` with:
  - Responsive `sizes` and `fill` or explicit dimensions.
  - Custom SVG cadastral blurDataURL and placeholder.
  - Automatic error catching (`onError`) rendering clean, branded fallback icons without broken image outlines.
- Replaced all raw `<img>` tags across `/search`, `/properties/[id]`, `/dashboard`, `/post-property`, and `ContactUnlockModal`.

---

### 📅 Session: November 5, 2026 (Phase 1 — P0: Trust & Safety Hardening)

#### 🎯 Focus: Secrets Eradication, Lalpurja Verification Authority Split, Supabase Fail-Fast Config, API Enumeration Rate Limiting, and Scoped Storage Upload Policies

---

### ✅ Completed Milestones

#### 1. Secrets Eradication from Public Documentation
- Scrubbed all real test phone numbers, Supabase project URLs, test UUIDs, and verification OTPs across `DAILY_PROGRESS.md`, `supabase/init_sarvabhoomi.sql`, and API route comments.
- Replaced with generic placeholders (`<your-test-phone>`, `<your-supabase-url>`, `<test-user-uuid>`, `98XXXXXXXX`).
- Real environment secrets remain strictly in `apps/web/.env.local` (untracked by git).
- **Security Notice on Git History**: While working tree files are sanitized, older commits in git history still contain previously committed secrets. *Note: Git history rewriting requires explicit authorization and repository coordination.*

#### 2. Lalpurja Self-Declaration vs. Administrative Verification Split
- **Database Migration (`supabase/migrations/20261105000004_lalpurja_verification_split.sql`)**:
  - Added `owner_declared_lalpurja BOOLEAN DEFAULT FALSE` and `admin_verified BOOLEAN DEFAULT FALSE`.
  - Migrated legacy `lalpurja_verified` data into `owner_declared_lalpurja`.
  - Created PL/pgSQL sync trigger `trg_sync_property_verification_status` to ensure backwards-compatibility.
  - **RLS Enforcement**:
    - `INSERT`: Owners can set `owner_declared_lalpurja`, but `admin_verified` is restricted (`admin_verified IS FALSE OR admin_verified IS NULL`).
    - `UPDATE`: Owners can update details but cannot modify `admin_verified` (`admin_verified IS NOT DISTINCT FROM (SELECT p.admin_verified FROM public.properties p WHERE p.id = properties.id)`). Only administrative/service roles can certify cadastral verification.
- **Shared Package Types (`packages/shared/src/validators/property.ts`)**:
  - Updated `Property`, `createPropertySchema`, and `PropertyFilterParams` with `owner_declared_lalpurja` and `admin_verified`.
- **UI Trust Signals**:
  - Search cards (`/search`), Property Details (`/properties/[id]`), and Dashboard (`/dashboard`) now display the emerald **"Lalpurja Verified"** badge ONLY if `admin_verified === true` (with tooltip "Government cadastral verified by Sarvabhoomi").
  - If `owner_declared_lalpurja === true && !admin_verified`, the badge renders as an amber/slate tag: **"Lalpurja Claimed (Pending Verification)"**.
  - Property submission form (`/post-property`) updated: checkbox text changed to *"I possess a legal Lalpurja (Land Ownership Certificate) for this property (subject to verification)"*.

#### 3. Fail-Fast Supabase Runtime Config (`apps/web/src/lib/supabase.ts`)
- Replaced silent fallback dummy URLs (`'https://placeholder-project.supabase.co'`) with runtime validation in `createClient()`.
- Explicitly throws descriptive error at startup if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing or placeholder.

#### 4. User Enumeration & Abuse Throttling (`/api/auth/check-user`)
- Implemented sliding-window in-memory rate-limiter in `apps/web/src/app/api/auth/check-user/route.ts`:
  - Enforces max 5 requests per 60 seconds per IP address and per phone number.
  - Returns HTTP `429 Too Many Requests` with dynamic `Retry-After` header.
- **Removed Security Bypass**: Removed direct `public.profiles` query fallback in `checkUserStatus` (`apps/web/src/lib/supabase.ts`) that previously bypassed RPC checks.
- **Residual Risk & Mitigation**: Phone enumeration remains theoretically possible below the 5 req/min threshold. For production public launch, an anti-bot challenge (such as Cloudflare Turnstile) and SMS carrier fraud scoring are recommended.

#### 5. Storage Upload Hardening (`apps/web/src/app/post-property/page.tsx` & Migration)
- Client-side validation:
  - Allowed MIME types strictly limited to `image/jpeg`, `image/png`, and `image/webp`.
  - Max file size limited to 5 MB per image.
  - Max file count capped at 10 images per listing.
- Storage path isolation:
  - Switched file path structure to `${userId}/${Date.now()}-${cleanFileName}`.
- Storage RLS Policy (`20261105000004_lalpurja_verification_split.sql`):
  - Enforced `(storage.foldername(name))[1] = auth.uid()::text` for `INSERT`, `UPDATE`, and `DELETE` on the `property-photos` bucket, preventing user cross-directory file overwrites.

---

### 📅 Session: November 5, 2026 (UI/UX Refactor via `ui-ux-pro-max` Skill)

#### 🎯 Focus: UI/UX-Only Institutional Polish, NoBroker Clean Aesthetic, Zero Emojis as Icons, Accessible Keyboard Navigation, 360px Mobile Responsiveness, and Semantic Design Tokens

---

### ✅ Completed Milestones

#### 1. Skill Verification & Generated Design Authority
- Verified installation of `ui-ux-pro-max` at `.agents/skills/ui-ux-pro-max/SKILL.md`.
- Executed `python .agents/skills/ui-ux-pro-max/scripts/search.py "real estate marketplace P2P Nepal property" --design-system -p "Sarvabhoomi"`:
  - **Pattern**: Marketplace / Directory (Search bar is the CTA; reduce friction to search; popular search suggestions; hero search + navbar 'Post Free Property').
  - **Style**: Exaggerated Minimalism (bold minimalism, high contrast, negative space, clean typography, whitespace).
  - **Colors**: Primary Emerald/Teal `#059669` / `#0F766E`, Background `#F8FAFC`, Foreground `#0F172A`, Muted `#F1F5F9`, Border `#E2E8F0`, Destructive `#DC2626`, Ring `#10B981`.
  - **Pre-Delivery Checklist**: No emojis as icons (Heroicons/Lucide only), cursor-pointer on all clickables, hover states with smooth transitions, text contrast 4.5:1 minimum, visible focus states for keyboard navigation, `prefers-reduced-motion` respected, responsive at 360px, 375px, 768px, 1024px, 1440px.

#### 2. Design Tokens & Styling Foundation (`apps/web/tailwind.config.ts`, `globals.css`)
- **Semantic Color Tokens**: Added full `brand` palette (50–950), `surface` semantic layers (`surface-subtle`, `surface-muted`, `surface-border`, `surface-borderHover`).
- **Touch Target Dimensions**: Added `min-h-touch: 44px` and `min-w-touch: 44px` for mobile touch target compliance.
- **Card Shadows**: Standardized `shadow-subtle`, `shadow-card`, and `shadow-cardHover`.
- **Global Accessible Focus & Interactions (`globals.css`)**:
  - Global `cursor: pointer` on all buttons, links, selects, and checkboxes.
  - Global `*:focus-visible` with `2px solid #059669` and `2px outline-offset`.
  - `@media (prefers-reduced-motion: reduce)` disabling non-essential transitions for accessibility.
  - Subpixel antialiasing and smooth scrolling defaults.
  - Responsive scrollbar utility `.scrollbar-none`.

#### 3. Route-by-Route Polish
- **Landing & Navbar (`apps/web/src/app/page.tsx`)**:
  - Fixed navbar crowding across desktop and mobile; consolidated navigation items with responsive priorities.
  - Clean CTA hierarchy: High-contrast "Post Free Property" + unified "Sign In" / User chip + bilingual switcher.
  - Converted category search tabs from emojis (`🏔️`, `🏡`, `🏢`, `📈`) to Lucide icons (`Mountain`, `Home`, `Building2`, `TrendingUp`).
  - Search category tabs now smoothly swipe with one thumb on mobile (`overflow-x-auto scrollbar-none flex-nowrap`).
  - Search inputs and buttons adhere to touch targets >= 44px (`min-h-touch`).
  - Replaced hardcoded `/auth` links on featured property cards with direct links to `/search` with district query parameters.
- **Auth Flow (`apps/web/src/app/auth/page.tsx`)**:
  - Optimized 6-digit OTP grid for 360px mobile viewports (`gap-1.5 sm:gap-3`, `w-10 sm:w-12 h-12 sm:h-14`) preventing horizontal container blowouts.
  - Balanced 4-card role selector to equal minimum heights (`min-h-[165px]`) to eliminate jagged layouts across English and longer Devanagari text.
  - Ensured all role cards and interactive toggles feature high-contrast visible focus rings.
- **Search & Property Cards (`apps/web/src/app/search/page.tsx`)**:
  - Removed emoji icons from property cards (`🛣️`, `🧭`, `🛏️`), replacing them with Lucide SVGs (`Milestone`, `Compass`, `Bed`).
  - Enhanced badge alignment to prevent clipping on mobile or narrow grid columns.
  - Contact Owner and favorite actions feature minimum 44px touch targets.
- **Listing Details (`apps/web/src/app/properties/[id]/page.tsx`)**:
  - Sticky right-column landowner contact card optimized to avoid viewport lock on mobile screens.
  - Full Lucide SVG icon hierarchy across specifications matrix, landmark distances, and cadastral survey simulator.
- **Post Property Wizard (`apps/web/src/app/post-property/page.tsx`)**:
  - Clear multi-step wizard progress tracker with responsive active titles.
  - Clean photo upload dropzone with preview grid and dismiss buttons.
  - Clear error feedback banners with inline validation guidance.
- **Dashboard (`apps/web/src/app/dashboard/page.tsx`)**:
  - Horizontally swipeable tabs with touch targets >= 44px (`min-h-touch`).
  - Wallet balance and 90-day expiration tracker with high-contrast emerald styling.

#### 4. Verification
- `turbo type-check`: **0 errors** across both packages (`@sarvabhoomi/shared` and `web`).
- `turbo build`: **0 errors**, all 7 routes compiled with static & dynamic optimization.

---

### 📅 Session: November 5, 2026 (Phase 1–6: Full Zero-Brokerage NoBroker-Style Marketplace Architecture)

#### 🎯 Focus: End-to-End Direct Owner-to-Buyer Real Estate Marketplace for Nepal with Lalpurja Verification, Cadastral Maps, Credits Wallet, and Multi-Step Listing Flow

---

### ✅ Completed Milestones

#### 1. Phase 1 — Property Data Model, Units & Seed Data
- **Supabase Schema (`supabase/migrations/20261105000003_properties.sql`):**
  - Created `public.properties` table supporting `listing_type` (`BUY_LAND`, `BUY_HOUSE`, `RENT_HOUSE`, `COMMERCIAL`), `area_unit` (`ROPANI`, `AANA`, `BIGHA`, `KATTHA`, `SQFT`), `area_sqft`, `road_access`, `facing`, `lalpurja_verified`, `kitta_no`, `photos text[]`, and `status` (`ACTIVE`, `DRAFT`, `SOLD`, `PAUSED`).
  - Created `public.property_favourites` table for persisted user bookmarks.
  - Created `public.contact_unlocks` table logging unlocks, timestamp, and credits spent.
  - Implemented atomic `unlock_property_contact(p_property_id)` stored procedure in PL/pgSQL: validates caller authentication, checks if owner or already unlocked, decrements 1 credit atomically from `user_subscriptions`, logs into `contact_unlocks`, increments property `unlocks_count`, and returns owner contact details safely.
  - Created `property-photos` storage bucket with public read access and authenticated upload policies.
- **Shared Schemas & Conversions (`packages/shared`):**
  - Created `packages/shared/src/validators/property.ts` with Zod validation, TypeScript definitions, and filter params.
  - Created `packages/shared/src/units/conversion.ts` with accurate mathematical conversions: `toSqFt`, `fromSqFt`, `formatArea` (e.g. `1-2-1-0 Ropani` or `0-15-5 Bigha`), `formatPriceNPR` (with Lakh/Crore notation), and `formatPricePerUnit`.
- **Seed Listings (`supabase/seed_properties.sql`):**
  - Authored 12 realistic ACTIVE listings across Kathmandu Valley (Budhanilkantha, Imadol, New Baneshwor, Tokha, Sanepa, Suryabinayak, Bhaisepati), Pokhara, Chitwan, Butwal, Biratnagar, and Dhulikhel with Unsplash real estate image placeholders.
- **Consolidated Setup (`supabase/init_sarvabhoomi.sql`):**
  - Unified script containing `app_config`, `profiles`, `user_subscriptions`, `properties`, `property_favourites`, `contact_unlocks`, triggers, RPCs, and PostgREST schema reloads for 1-click execution.

#### 2. Phase 2 — Search & Listings Marketplace (`/search`)
- **Interactive Search Engine (`apps/web/src/app/search/page.tsx`):**
  - Tabs: `Buy Land (Ghaderi)`, `Buy House`, `Rent House`, `Commercial`, `All Properties`.
  - Search inputs with debounced locality query, Nepal district dropdown (all 77 districts), price presets (Under 50 Lakhs, 50L - 1 Cr, 1 - 2.5 Cr, 2.5 - 5 Cr, 5 Cr+), and Lalpurja Verified filter.
  - Sorting: Newest First, Price (Low to High), Price (High to Low), Area (Largest First).
  - High-converting property cards: photo badge, NPR price in Lakh/Cr with per-unit rates, area in local units + sq ft, facing & road width, Lalpurja Verified trust badge, 0% Brokerage badge, shortlist heart button, and "Contact Owner" CTA.
  - Landing page hero search connected to `/search` with parameters.

#### 3. Phase 3 — Detail Page & Contact Unlock Modal (`/properties/[id]`)
- **Comprehensive Listing View (`apps/web/src/app/properties/[id]/page.tsx`):**
  - Photo gallery with active thumbnail selector and full preview.
  - Prominent price header with per-aana / per-kattha calculation.
  - Technical specifications grid: property type, plot area in local units + sq ft + m², road access, facing, bedrooms/bathrooms, cadastral Kitta plot number, and listing date.
  - Interactive Cadastral Survey & Boundary Visualization card simulating government land survey sheet coordinates.
  - Sticky right-column Landowner Contact Card:
    - Locked state: displays "Unlock Landowner Contact with 1 Free Credit" with security guarantees.
    - Unlocked state: displays verified phone number, 1-click Direct Call (`tel:`) and WhatsApp chat (`wa.me`) buttons.
  - Similar properties section matching district and listing type.
- **Reusable Modal (`apps/web/src/components/ContactUnlockModal.tsx`):**
  - Handles 4 states: Unauthenticated (redirects to `/auth`), Active user with credits (confirms 1 credit unlock), Already unlocked / Owner (direct contact revealed), Zero credits (upgrade prompt).

#### 4. Phase 4 — Post Free Property 5-Step Wizard (`/post-property`)
- **Auth-Protected Listing Engine (`apps/web/src/app/post-property/page.tsx`):**
  - Step 1: Type & Location (Listing type, District auto-detecting measurement unit, Municipality, Ward, Locality).
  - Step 2: Area & Specifications (Area value + unit, road access, facing, house specs, title, description).
  - Step 3: Photos (Direct upload to Supabase Storage bucket `property-photos` with preview grid, max 10 photos).
  - Step 4: Price & Ownership (NPR price with live Lakh/Cr formatting, Kitta number, Lalpurja verification checkbox, and legal non-brokerage declaration).
  - Step 5: Review & Publish (Summary card, "Publish Free Property" sets `ACTIVE` and routes to listing page, "Save as Draft" sets `DRAFT`).

#### 5. Phase 5 — Dashboard / Investor Console (`/dashboard`)
- **4-Tab P2P Console (`apps/web/src/app/dashboard/page.tsx`):**
  - **Tab 1: My Listings:** Manage active, paused, or sold listings, view impressions, contact unlock counts, and quick-status actions.
  - **Tab 2: My Shortlist:** Persisted bookmarks from `property_favourites` with 1-click Contact Landowner modal and removal action.
  - **Tab 3: Credits Wallet:** Live credits counter (15 promotional credits), 90-day expiry tracker, and table of unlocked landowner contacts with direct call and WhatsApp buttons.
  - **Tab 4: Profile & Land Units:** Profile details, primary district selector, Hilly ↔ Terai unit system switcher, and interactive 3-way converter between Ropani, Bigha, Sq Ft, and Sq Meters.
  - **Deep Link Route (`apps/web/src/app/dashboard/shortlist/page.tsx`):** Seamless client redirect to `/dashboard?tab=shortlist`.

#### 6. Phase 6 — Verification & Polish
- **Type-Check Verification:** `npm run type-check` (via Turborepo) passed with **0 errors** across both packages (`@sarvabhoomi/shared` and `web`).
- **Production Build Verification:** `npm run build` completed in 46.2s with static prerendering for all 7 routes:
  - `○ /` (Landing Page)
  - `○ /auth` (Mobile OTP & Role Onboarding)
  - `○ /search` (Filterable Marketplace)
  - `ƒ /properties/[id]` (Dynamic Listing Details)
  - `○ /post-property` (5-Step Listing Wizard)
  - `○ /dashboard` (P2P Investor Console)
  - `○ /dashboard/shortlist` (Shortlist Deep Link)
  - `ƒ /api/auth/check-user` (Dynamic Branching API)

---

### 📅 Session: November 5, 2026 (Auth Refactor)

#### 🎯 Focus: Dynamic "Check User" Branching Flow, Dynamic OTP Routing, and White/Emerald Institutional Auth Refactor

---

### ✅ Completed Milestones

#### 1. Dynamic "Check User" Branching Architecture (`apps/web/src/app/auth/page.tsx`)
- **Step State Machine Aligned:**
  - Defined strict state union: `type AuthStep = 'PHONE' | 'OTP' | 'ROLE_SELECT' | 'PROFILE_FORM';`.
  - State variables: `step = 'PHONE'`, clean `phoneLocal = ''`, `otpDigits = ['', '', '', '', '', '']`, `isExistingUser = false`, `userIntent = 'BUYER'`, `fullName = ''`, `district = 'Kathmandu'`, `regionSystem = 'HILLY'`.
- **Pre-flight Dynamic User Lookup (`/api/auth/check-user`):**
  - As user enters their 10-digit Nepali mobile number, real-time debounced check runs against `/api/auth/check-user`.
  - On Step 1 submit, performs `POST /api/auth/check-user` with `{ phone: '+977' + phoneLocal }` to determine `exists` and `isOnboarded`.
- **CASE A: Existing & Onboarded User (`isExistingUser === true`):**
  - Dispatches OTP via `supabase.auth.signInWithOtp`.
  - Shows 2-step progress bar: `1. Mobile` ── `2. Verify & Sign In`.
  - Step 2 OTP displays badge: *"Welcome Back! Enter your 6-digit code to sign in."*
  - Upon successful `supabase.auth.verifyOtp()`, routes **directly to `/dashboard`**, skipping redundant role/profile screens.
- **CASE B: New User or Incomplete Onboarding (`isExistingUser === false`):**
  - Dispatches OTP via `supabase.auth.signInWithOtp`.
  - Shows 4-step progress bar: `1. Mobile` ── `2. OTP` ── `3. Select Role` ── `4. Profile Details`.
  - Step 2 OTP displays badge: *"New Account Verification: Enter code to verify your phone."* (with 15 Free Credits callout).
  - Upon successful `supabase.auth.verifyOtp()`, advances strictly to **Step 3 (`ROLE_SELECT`)**.
- **Step 3: Role Selection (`step === 'ROLE_SELECT'`):**
  - Standalone screen presenting 4 distinct roles (`BUYER`, `OWNER`, `INVESTOR_NRN`, `AGENT_BROKER`).
  - Interactive selection with emerald checkmarks, badges, and bilingual descriptions.
  - "Continue to Profile Setup" button sets `step = 'PROFILE_FORM'`.
- **Step 4: Profile Details & Unit Preference (`step === 'PROFILE_FORM'`):**
  - Selected role summary badge with "Change Role" link back to Step 3.
  - Inputs for Full Legal Name (as per Citizenship/Lalpurja).
  - District dropdown for all 77 districts, auto-configuring `regionSystem` via `DISTRICT_REGION_MAP`.
  - 1-click manual toggle between Hilly (Ropani-Aana-Paisa-Daam) and Terai (Bigha-Kattha-Dhur) with explanatory details.
  - Promotional 15 Free Credits claim card.
  - Submitting calls `supabase.from('profiles').upsert(...)` with `is_onboarded: true` and redirects to `/dashboard`.
- **Suspense Prerendering Boundary:** Wrapped in `<Suspense fallback={<AuthLoading />}>` to ensure Next.js 14 App Router static prerendering (`○ (Static)`) builds cleanly without bailouts.

---

### 📅 Session: November 3–4, 2026

#### 🎯 Focus: Production Bilingual Auth, Nepal Onboarding, Live Supabase Verification & Clean White/Emerald UI Overhaul

---

### ✅ Completed Milestones

#### 1. White & Emerald Green Institutional Theme Overhaul
- **Base Background:** Crisp `bg-slate-50` with slate borders `border-slate-200`.
- **Containers & Cards:** Elevated white cards `bg-white`, subtle borders, crisp modern typography.
- **Brand Colors:** Emerald primary (`bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white`, `text-emerald-700`, `border-emerald-600`, `ring-emerald-100`).
- **Typography:** `text-slate-900` headings and high-contrast readable copy.
- **Removal of Mocks:**
  - Removed all mock test numbers, pre-filled states, and dummy tokens.
  - Inputs start clean (`phone = ""`, `otpDigits = ["", "", "", "", "", ""]`).
  - Direct live integration with `@sarvabhoomi/shared` and Supabase Auth.

#### 2. Strict 4-Step Authentication & Onboarding Architecture (`apps/web/src/app/auth/page.tsx`)
- **Differentiated Log In vs Sign Up Experiences:**
  - Segmented `[ 🔐 Log In ]` and `[ ✨ Sign Up ]` tab toggle directly above the mobile input card.
  - **Log In Mode (`/auth?mode=login`):** Streamlined 2-step verification (`1. Mobile` ➔ `2. Verify OTP`). Upon verification, existing onboarded users are immediately routed to the dashboard without unnecessary role/profile screens.
  - **Sign Up Mode (`/auth?mode=signup`):** Full 4-step onboarding journey (`1. Mobile` ➔ `2. OTP` ➔ `3. Select Role` ➔ `4. Profile Details`) granting the 15 free promotional credits.
  - Instant bottom mode-switchers (*"New to Sarvabhoomi? Create an Account"* / *"Already registered? Log In here"*).
- **State-Skipping Bug Resolved:** Hard-reset state machine so `step` strictly initializes to `'PHONE'`. Removed the `useEffect` auto-forwarding bug so users always start at Step 1 unless already onboarded (`is_onboarded === true`).
- **4-Step Visual Progress Bar:** Clean responsive tracker (`1. Mobile` ➔ `2. OTP` ➔ `3. Select Role` ➔ `4. Profile Details`) with emerald progress tracks and checkmark indicators.
- **Step 1: Phone Input (`step === 'PHONE'`):** Fixed `🇳🇵 +977` prefix, 10-digit validation against `nepalPhoneRegex`, real-time NTC/Ncell carrier detection, and live `signInWithOtp`.
- **Step 2: OTP Verification (`step === 'OTP'`):** 6-digit segmented input grid, 30s resend timer, "Change Number" link, and live `verifyOtp` triggering transition to Step 3.
- **Step 3: Dedicated Role Selection (`step === 'ROLE_SELECTION'`):** Standalone view with 4 distinct roles:
  1. `BUYER`: Direct Property Buyer (0% Commission)
  2. `OWNER`: Property Owner / Seller (100% Free Listing)
  3. `INVESTOR_NRN`: Institutional / NRN Investor (Wealth & Portfolio Tracker)
  4. `AGENT_BROKER`: Licensed Real Estate Agent / Facilitator (Multi-Client GIS Portfolio)
  - Updated `@sarvabhoomi/shared`, `authDict`, and Supabase migration schema to support `AGENT_BROKER`.
- **Step 4: Profile & Preferences (`step === 'ONBOARDING_FORM'`):**
  - Role summary pill with 1-click "Change Role" link back to Step 3.
  - Full Legal Name (as per Citizenship / Lalpurja).
  - Primary District selector auto-configuring measurement systems (Hilly: Ropani-Aana vs. Terai: Bigha-Kattha) with manual override.
  - Submitting upserts profile with `is_onboarded: true` and redirects immediately to `/dashboard`.

---

#### 2. Verification Landing Shell (`apps/web/src/app/dashboard/page.tsx`)
- **Session Protection:** Validates authenticated Supabase session; unauthenticated traffic redirects to `/auth`.
- **Top Navigation Bar:**
  - Sarvabhoomi Devanagari emblem & branding.
  - User Full Name chip with avatar initial.
  - District Badge (`📍 Kathmandu`).
  - Active Measurement System Badge (`🏔️ HILLY: Ropani-Aana` or `🌾 TERAI: Bigha-Kattha`).
  - **Glowing Wallet Pill:** Live countdown: **"15 Free Contact Credits Remaining (Launch Offer)"** fetched from `user_subscriptions.credits_remaining`.
  - Sign Out action (`supabase.auth.signOut()`).
- **Dashboard Features:**
  - Identity Verified & Onboarding Complete hero card.
  - Promotional Credit Wallet card with expiration countdown.
  - User Profile & Preferences overview.
  - Active Land Units breakdown reference (Ropani conversion scale vs Bigha conversion scale).
  - Direct P2P Marketplace quick-action cards.
  - Interactive Nepal Land Measurement Area Calculator (Ropani/Aana ↔ Bigha/Kattha ↔ Sq. Ft. / m²).

---

#### 3. Database Schema & Migration (`supabase/migrations/20261103000001_auth_and_onboarding.sql`)
- Created migration covering:
  - `public.app_config`: Platform singleton with default `launch_free_credits = 15`.
  - `public.profiles`: User profile table with RLS policies (`auth.uid() = id`).
  - `public.user_subscriptions`: Subscription tracking table with 90-day expiry.
  - `trg_on_profile_created`: PostgreSQL trigger that automatically seeds 15 Free Credits upon profile creation.

---

#### 4. Live Verification & End-to-End QA Test
- **Target Number:** `<your-test-phone>` (Ncell / NTC)
- **Supabase Instance:** `<your-supabase-url>`
- **Result:**
  - `signInWithOtp({ phone: '<your-test-phone>' })` returned `200 OK`.
  - `verifyOtp({ phone: '<your-test-phone>', token: '<test-otp>', type: 'sms' })` returned **`SUCCESS (200 OK)`**.
  - Authenticated User ID: `<test-user-uuid>`.
  - Session JWT successfully created and persisted.
  - Schema resilience added to frontend to seamlessly handle pending remote database migrations.

#### 5. Consumer Marketplace Landing Page Redesign (`apps/web/src/app/page.tsx`)
- **NoBroker-Inspired Consumer UX:** Completely stripped internal developer debug benches, DB schema cards, and workspace topologies from `localhost:3000`.
- **Top App Bar Actions (NoBroker Pattern):**
  - **Spacious & Clean Layout:** Eliminated multi-line text wrapping on common 1080p scaled laptop screens by applying `whitespace-nowrap`, `shrink-0`, and responsive link thresholds.
  - **Brand Header:** Streamlined to `Sarvabhoomi` + `0% Brokerage` pill.
  - **"Post Free Property"** direct badge.
  - Distinct **"Log In"** link with Lucide icon.
  - Highlighted **"Sign Up"** emerald primary CTA button.
  - Authenticated session state: shows User Name, remaining credits, and a 1-click **Log Out** button that immediately switches back to the guest actions.
  - 1-click bilingual switch (`EN` ↔ `नेपाली`).
- **Hero Search Engine:**
  - Category selector tabs: `Buy Land / Ghaderi`, `Buy House / Villa`, `Commercial Land`, and `Valuation Tracker`.
  - District dropdown filter (Kathmandu, Lalitpur, Bhaktapur, Pokhara, Chitwan, Butwal, etc.).
  - Locality, ward, and landmark search bar with instant feedback.
- **Value Proposition & Pillars:**
  - 0% Brokerage badge, 100% Verified Lalpurja Kitta boundaries, and Direct Owner contacts.
  - Three core audience cards: For Landowners, For Property Buyers, and For NRN / Wealth Trackers.
  - Direct Savings Comparison matrix showing NPR 2–5 Lakhs saved compared to traditional Nepali middlemen/agents.
- **Featured Verified Plots:**
  - Realistic verified land cards in Budhanilkantha, Imadol, and Bharatpur with authentic local units (Aana / Kattha), road access (Pitched vs. Dhalan), and Mohada facing directions.
- **Trust Reassurance & Nepali Real Estate FAQs:**
  - Answers regarding Lalpurja verification, zero brokerage business model, and cadastral parcel accuracy.

---

### 📅 Session: November 5, 2026

#### 🎯 Focus: Server-Side Check-User Verification Endpoint, Database RPC & Dynamic Auth Branching

---

### ✅ Completed Milestones

#### 1. Database Stored Procedure / RPC Migration (`supabase/migrations/20261105000002_check_user_exists.sql`)
- Implemented `public.check_user_status(p_phone TEXT)` returning `JSONB` (`exists`, `is_onboarded`, `user_intent`).
- Enhanced query matching to support both international `+977` and raw 10-digit formats using `regexp_replace`.
- Configured `SECURITY DEFINER` and explicitly set `search_path = public` for security hardening.
- Granted execution rights to both `anon` and `authenticated` roles for pre-flight auth branching.

#### 2. Typed Supabase Database Helper & Resilient Client (`apps/web/src/lib/supabase.ts`)
- Added `check_user_status` RPC signature and `CheckUserStatusResult` interface to the typed database schema.
- Built reusable `checkUserStatus(phone, client?)` utility.
- Integrated dual-layer resilience: seamlessly falls back to direct profile table queries if the remote database migration is still pending execution in Supabase.

#### 3. Server-Side Verification Endpoint (`apps/web/src/app/api/auth/check-user/route.ts`)
- Created Next.js App Router dynamic route supporting both `POST` and `GET`.
- Strict input validation against 10-digit Nepal mobile operators (NTC: `984`, `985`, `986`, `974`, `975` & Ncell: `980`, `981`, `982`, `970`).
- Provides dynamic branching suggestions (`suggestedMode`: `'login'` vs `'signup'`) and context-aware messaging:
  - Existing & onboarded: `'login'` (skip straight to OTP and dashboard).
  - Existing but not onboarded: `'signup'` (guide to role selection & profile details).
  - New user: `'signup'` (promote 15 free promotional credits).
- Error handling returning clean HTTP 400 JSON on invalid/missing parameters and HTTP 500 on unexpected errors with `no-store` caching headers.

#### 4. Real-time Frontend Dynamic Auth Branching (`apps/web/src/app/auth/page.tsx`)
- Added 400ms debounced user verification while typing a 10-digit number.
- Visual real-time indicator cards notifying users whether an existing account was found or if they are eligible for the 15 free launch credits.
- Automatic auth mode switching during OTP dispatch (`handleSendOtp`), ensuring users are routed to the proper journey.

---

## 🛠️ Verification & Build Status

| Check | Tool | Status |
| :--- | :--- | :--- |
| TypeScript Compilation | `turbo type-check` | ✅ **Passed (0 errors across monorepo)** |
| Next.js Production Build | `turbo build` | ✅ **Compiled & Optimized (Static Prerender 6/6 + Dynamic API)** |
| Route `/api/auth/check-user` | Production Server Probe (GET & POST) | ✅ **200 OK & 400 Validation Tested** |
| Dynamic Auth Branching | Interactive UI Test | ✅ **Tested & Verified** |

---

## 📋 Next Priorities & Action Items

- [ ] **Run SQL Migrations:** Execute [`20261103000001_auth_and_onboarding.sql`](supabase/migrations/20261103000001_auth_and_onboarding.sql) and [`20261105000002_check_user_exists.sql`](supabase/migrations/20261105000002_check_user_exists.sql) in the Supabase Dashboard SQL Editor for your project (`<your-supabase-project-ref>`).
- [ ] **Direct Property Listing Wizard:** Build multi-step property upload form supporting Lalpurja ownership verification and photos.
- [ ] **Cadastral GIS Map Sheets:** Integrate MapLibre/Leaflet with cadastral parcel boundary overlays for Kathmandu Valley and Terai.
- [ ] **Contact Unlock Modal:** Deduct 1 credit per landowner phone unlock and log transaction in `user_subscriptions`.

