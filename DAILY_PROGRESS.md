# 🇳🇵 Sarvabhoomi Capital & Investment — Daily Engineering Progress

> **Platform:** Nepal's Zero-Brokerage P2P Property Marketplace & Wealth Tracker  
> **Repository:** Monorepo (`apps/web`, `packages/shared`, `supabase`)  
> **Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide Icons, Turborepo, Supabase Auth & Database

---

## 📌 Executive Summary

This log tracks all architectural decisions, feature implementations, verification results, and upcoming technical milestones for **Sarvabhoomi Capital & Investment**.

---

## 🗓️ Engineering Log

### 📅 Session: November 3–4, 2026

#### 🎯 Focus: Production Bilingual Auth, Nepal Onboarding & Live Supabase Verification

---

### ✅ Completed Milestones

#### 1. Unified 3-Step Authentication & Onboarding State Machine (`apps/web/src/app/auth/page.tsx`)
- **Aesthetic:** Institutional fintech dark mode (`bg-slate-950`, `bg-slate-900/90` frosted cards, `border-slate-800`, emerald-500 accents, ambient glow).
- **Header:**
  - Sarvabhoomi Devanagari emblem (**"स"**) with emerald gradient ring.
  - **Instant 1-Click Bilingual Toggle (`EN` ↔ `NE`)** powered by `@sarvabhoomi/shared` without page reload.
- **Top 3-Step Progress Bar:** Dynamic visual indicator tracking `PHONE` ➔ `OTP` ➔ `ONBOARDING` with animated connecting emerald progress tracks.
- **Step 1 (Mobile Input):**
  - Fixed `🇳🇵 +977` badge.
  - 10-digit validation against `nepalPhoneRegex`.
  - Dynamic carrier detection: **Nepal Telecom (NTC)** (`984`, `985`, `986`, `974`, `975`) and **Ncell Axiata** (`980`, `981`, `982`, `970`).
  - Pre-fill Dev Test helper (`9841000000` / OTP `123456`) with 1-click Quick Fill.
- **Step 2 (6-Digit OTP Verification):**
  - High-contrast 6-digit segmented input grid with auto-advance, backspace navigation, and clipboard paste support.
  - "Change Number" back action and 30-second resend countdown timer.
- **Step 3 (Nepal-Specific Onboarding):**
  - Full Legal Name *(as per Citizenship / Lalpurja)*.
  - Interactive Role Selector cards:
    - `BUYER`: Direct Property Buyer (0% Commission)
    - `OWNER`: Property Owner / Seller (100% Free Listing)
    - `INVESTOR_NRN`: Institutional / NRN Investor (Wealth Tracker)
  - Grouped District Selector (`Hilly & Valley Districts` vs `Terai & Inner Terai Districts`).
  - **Auto-Detection Logic:** Selecting a district automatically switches the measurement system:
    - Hilly (Kathmandu, Lalitpur, Kaski, Kavre) ➔ `HILLY: Ropani - Aana - Paisa - Daam`
    - Terai (Chitwan, Jhapa, Morang, Rupandehi) ➔ `TERAI: Bigha - Kattha - Dhur`
    - Interactive 1-click manual override cards.

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
- **Target Number:** `+9779820770232` (Ncell)
- **Supabase Instance:** `https://qmwrkhjtbbleskjmeauo.supabase.co`
- **Result:**
  - `signInWithOtp({ phone: '+9779820770232' })` returned `200 OK`.
  - `verifyOtp({ phone: '+9779820770232', token: '123456', type: 'sms' })` returned **`SUCCESS (200 OK)`**.
  - Authenticated User ID: `5dcb6e16-69a8-4acd-8d81-644f032c901b`.
  - Session JWT successfully created and persisted.
  - Schema resilience added to frontend to seamlessly handle pending remote database migrations.

---

## 🛠️ Verification & Build Status

| Check | Tool | Status |
| :--- | :--- | :--- |
| TypeScript Compilation | `turbo type-check` | ✅ **Passed (0 errors)** |
| Next.js Production Build | `turbo build` | ✅ **Compiled & Optimized** |
| Local Development Server | `next dev -p 3000` | ✅ **Running on port 3000** |
| Route `/auth` | HTTP Probe | ✅ **200 OK** |
| Route `/dashboard` | HTTP Probe | ✅ **200 OK** |
| Live OTP Verification | Supabase Auth API | ✅ **200 OK Authenticated** |

---

## 📋 Next Priorities & Action Items

- [ ] **Run SQL Migration:** Execute [`20261103000001_auth_and_onboarding.sql`](supabase/migrations/20261103000001_auth_and_onboarding.sql) in the Supabase Dashboard SQL Editor for project `qmwrkhjtbbleskjmeauo`.
- [ ] **Direct Property Listing Wizard:** Build multi-step property upload form supporting Lalpurja ownership verification and photos.
- [ ] **Cadastral GIS Map Sheets:** Integrate MapLibre/Leaflet with cadastral parcel boundary overlays for Kathmandu Valley and Terai.
- [ ] **Contact Unlock Modal:** Deduct 1 credit per landowner phone unlock and log transaction in `user_subscriptions`.

