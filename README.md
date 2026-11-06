# 🇳🇵 Sarvabhoomi Capital & Investment (सर्वभूमि)

> **Nepal's Institutional Zero-Brokerage P2P Real Estate Marketplace & Wealth Tracker**  
> Direct Peer-to-Peer real estate transactions connecting verified landowners and buyers across all 77 districts of Nepal. 100% Free Owner Listings • 0% Broker Commission • Government Cadastral Lalpurja Verification.

---

## 🏗️ Architecture & Monorepo Layout

Sarvabhoomi is architected as a high-performance monorepo powered by **Turborepo** and **npm workspaces**:

```text
Sarvabhoomi/
├── apps/
│   └── web/                               # Next.js 14 App Router Application
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/auth/check-user/   # Throttled user lookup endpoint
│       │   │   ├── auth/                  # Phone OTP & 4-step onboarding
│       │   │   ├── dashboard/             # Console (Listings, Shortlist, Wallet, Profile)
│       │   │   ├── post-property/         # 5-step property submission wizard
│       │   │   ├── properties/[id]/       # Dynamic listing detail & contact unlock
│       │   │   ├── search/                # Paginated filter & discovery marketplace
│       │   │   ├── layout.tsx             # Root layout with metadata
│       │   │   ├── page.tsx               # High-converting landing & hero search
│       │   │   ├── error.tsx              # Global error boundary
│       │   │   ├── loading.tsx            # Global Suspense fallback
│       │   │   ├── not-found.tsx          # Branded 404 handler
│       │   │   ├── sitemap.ts             # Dynamic search engine sitemap
│       │   │   └── robots.ts              # Crawler indexing directives
│       │   ├── components/                # Reusable UI components
│       │   │   ├── Navbar.tsx             # Unified responsive navigation
│       │   │   ├── Footer.tsx             # Institutional footer
│       │   │   ├── PropertyCard.tsx       # Standardized marketplace card
│       │   │   ├── PropertyImage.tsx      # Optimized Next.js image with SVG fallback
│       │   │   ├── LandCalculator.tsx     # Ropani <-> Bigha conversion engine
│       │   │   └── ContactUnlockModal.tsx # Atomic credit-deduction modal
│       │   └── lib/
│       │       └── supabase.ts            # Type-safe isomorphic client & RPC handlers
│       └── next.config.mjs                # Remote patterns & security headers
├── packages/
│   └── shared/                            # Isomorphic TypeScript shared package
│       └── src/
│           ├── i18n/                      # Bilingual dictionaries (EN & नेपाली)
│           │   ├── authDict.ts            # Authentication & onboarding strings
│           │   ├── searchDict.ts          # Search & filter dictionaries
│           │   ├── propertyDict.ts        # Listing detail & specs strings
│           │   └── dashboardDict.ts       # Console & wallet strings
│           ├── units/                     # Cadastral land measurement systems
│           │   ├── districtMap.ts         # All 77 districts with Hilly/Terai tags
│           │   └── conversion.ts          # Ropani, Aana, Bigha, Kattha, Sq. Ft. math
│           └── validators/                # Zod schemas & shared TypeScript types
│               ├── auth.ts                # Phone regex, role enums, profile schemas
│               └── property.ts            # Property types, filter params, create schemas
├── supabase/                              # PostgreSQL Database & Migrations
│   ├── migrations/                        # Sequential SQL migrations
│   │   ├── 20261103000001_auth_and_onboarding.sql
│   │   ├── 20261105000002_check_user_exists.sql
│   │   ├── 20261105000003_properties.sql
│   │   ├── 20261105000004_lalpurja_verification_split.sql
│   │   ├── 20261105000005_search_performance_indexes.sql
│   │   ├── 20261106000006_two_roles_rent_only.sql
│   │   ├── 20261106000007_rent_fields.sql
│   │   ├── 20261106000008_visit_requests.sql
│   │   └── 20261106000009_lazy_profile_completion.sql
│   ├── fix_storage_bucket.sql             # Storage bucket & RLS policies setup
│   ├── init_sarvabhoomi.sql               # Single-script bootstrap for fresh DB
│   └── seed_properties.sql                # 12 active realistic seed listings
└── .github/
    └── workflows/
        └── ci.yml                         # Automated lint, type-check, and build CI
```

---

## 👥 Two-Role Model & Rent-Only Architecture

Sarvabhoomi operates strictly as a **Rent-Only P2P Real Estate Marketplace** with **strict two-role separation**:

1. **`RENTER` (भाडामा लिने):**
   - Workflow: Search & filter rent listings across Nepal, view verified rental specs, shortlist favorites, unlock owner contact info using 15 free launch credits, and schedule property visits.
   - Guardrails: Cannot post properties, cannot view owner-only dashboard screens, cannot access listing creation APIs.
2. **`OWNER` (घरधनी / घरबेटी):**
   - Workflow: List residential/commercial rental units (Rooms, Flats, Houses, Commercial Shops) 100% free with cadastral details, manage rental listings, review visit requests and enquiries.
   - Guardrails: Cannot browse/search listings, cannot shortlist or unlock contacts. Console defaults to My Listings.
3. **One Role Per Account Rule:**
   - Role selection is captured during onboarding or via the one-time migration modal for existing accounts.
   - Enforced at the database level via PostgreSQL triggers (`trg_enforce_immutable_user_role`) and Row Level Security (RLS). Users cannot alter their role once chosen; users requiring both roles must register with separate phone numbers.

---

## 🇳🇵 Domain Features & Nepal Context

1. **Zero Broker Commission (शून्य दलाली):**
   - Traditional brokers in Nepal charge 2%–4% commission per transaction (NPR 4–8 Lakhs on an average NPR 2 Crore property). Sarvabhoomi eliminates middlemen by connecting buyers and sellers directly.
2. **Dual Regional Land Measurement Systems:**
   - **Hilly & Valley Region (पहाड र काठमाडौँ उपत्यका):** Ropani (रोपनी), Aana (आना), Paisa (पैसा), Daam (दाम).
     - 1 Ropani = 16 Aana = 64 Paisa = 256 Daam = 5,476 sq. ft.
     - 1 Aana = 342.25 sq. ft.
   - **Terai Region (तराई मधेश):** Bigha (बिघा), Kattha (कट्ठा), Dhur (धुर).
     - 1 Bigha = 20 Kattha = 400 Dhur = 72,900 sq. ft.
     - 1 Kattha = 3,645 sq. ft.
   - All 77 districts are mapped to their respective regional measurement standard with automatic auto-detection.
3. **Lalpurja Trust Split (लालपुर्जा प्रमाणीकरण):**
   - Listings distinguish between owner self-declarations (`owner_declared_lalpurja`) and official cadastral inspections (`admin_verified`). Row-Level Security (RLS) prevents self-escalation.
4. **15 Free Contact-Unlock Credits:**
   - Every newly onboarded user receives 15 free contact unlock credits valid for 90 days to contact genuine landowners without upfront fees.

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0
- Supabase Project (Postgres 15+)

### 1. Clone the repository
```bash
git clone https://github.com/Snehil208001/Sarvabhoomi.git
cd Sarvabhoomi
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### 4. Setup Database
Run the consolidated schema script in your Supabase SQL Editor:
- Execute `supabase/init_sarvabhoomi.sql`
- (Optional) Execute `supabase/seed_properties.sql` to populate 12 active seed listings.

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📋 Owner Listing Review & Activation Workflow

Like NoBroker's quality control, new rental listings submitted by owners default to `status = 'PENDING_REVIEW'` and are hidden from public `/search` until approved by an administrator:

1. **Owner View:** Newly posted properties display an amber badge: `Pending Review / Under Admin Review` on the Owner Dashboard.
2. **Admin Activation via Supabase Studio:**
   Execute the following SQL in your Supabase SQL Editor to verify Lalpurja documentation and publish the listing:
   ```sql
   UPDATE public.properties
   SET status = 'ACTIVE',
       admin_verified = TRUE
   WHERE id = '<property-uuid>';
   ```
3. Once marked `ACTIVE`, the property automatically appears in `/search`, on the homepage, and in district recommendations.

---

## 🧪 Available Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server on `localhost:3000` |
| `npm run build` | Builds `@sarvabhoomi/shared` and optimizes Next.js for production |
| `npm run type-check` | Runs `tsc --noEmit` across all workspace packages |
| `npm run build --workspace=@sarvabhoomi/shared` | Recompiles the shared TypeScript package |

---

## 🛡️ Security & Privacy
- **Row-Level Security (RLS):** All tables enforce strict RLS policies.
- **Storage Directory Isolation:** User photo uploads are isolated under `property-photos/<user_id>/...`.
- **API Throttling:** Sliding-window rate limiting on `/api/auth/check-user` (max 5 requests/min per IP/phone).
- **HTTP Security Headers:** Content-Type nosniff, Frame Options DENY, Referrer Policy strict-origin-when-cross-origin.

---

## 📄 License
© 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. Kathmandu, Nepal. All rights reserved.

