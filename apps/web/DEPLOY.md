# 🇳🇵 Sarvabhoomi Capital & Investment — Production Deployment Runbook

> **Target Platform:** Vercel (Next.js 14 App Router) + Supabase (PostgreSQL 15, Auth, Storage)  
> **Repository:** Monorepo (`apps/web`, `packages/shared`, `supabase`)  
> **Primary Domain:** `https://sarvabhoomi.com` (or your Vercel deployment URL)

---

## 📋 Pre-Deployment Checklist Overview

Deploying Sarvabhoomi to production requires completing two sequential steps:
1. **Supabase Setup**: Apply database migrations in exact sequential order, configure folder-scoped storage bucket policies, configure Phone OTP, and whitelist redirect URLs.
2. **Vercel Setup**: Connect the GitHub repository, configure monorepo build settings, set the 3 public environment variables, and trigger the deployment.

---

## 🗄️ Step 1: Supabase Configuration (Execute First)

Navigate to your [Supabase Dashboard](https://supabase.com/dashboard/project/_):

### 1.1 Apply SQL Migrations in Sequential Order
Open **SQL Editor** (`/sql`) in your Supabase project dashboard. Run the migrations in `supabase/migrations/` one by one in this exact sequence:

1. `supabase/migrations/20261103000001_auth_and_onboarding.sql`  
   *(Creates `profiles`, `app_config`, `user_subscriptions`, and initial functions)*
2. `supabase/migrations/20261105000002_check_user_exists.sql`  
   *(Creates `check_user_status` RPC for instant phone verification)*
3. `supabase/migrations/20261105000003_properties.sql`  
   *(Creates core `properties`, `property_favourites`, `contact_unlocks` tables and unlock RPC)*
4. `supabase/migrations/20261105000004_lalpurja_verification_split.sql`  
   *(Splits owner declaration from admin Lalpurja GIS verification)*
5. `supabase/migrations/20261105000005_search_performance_indexes.sql`  
   *(Adds B-Tree and GIN indexes for fast geospatial and district queries)*
6. `supabase/migrations/20261106000006_two_roles_rent_only.sql`  
   *(Enforces two-role architecture: `RENTER` and `OWNER` with rental constraints)*
7. `supabase/migrations/20261106000007_rent_fields.sql`  
   *(Adds deposit, maintenance, furnishing, tenant preference, and subtype fields)*
8. `supabase/migrations/20261106000008_visit_requests.sql`  
   *(Creates `property_visit_requests` table with RLS for scheduling rental viewings)*
9. `supabase/migrations/20261106000009_lazy_profile_completion.sql`  
   *(Simplifies onboarding to 3 steps with lazy profile detail collection)*

### 1.2 (Optional) Seed Initial Rental Listings
If you want instant verified listings for Kathmandu, Lalitpur, and Pokhara, execute:
- `supabase/seed_properties.sql`

---

### 1.3 ⚠️ Storage Bucket & Security Policy Configuration

> [!CAUTION]
> **CRITICAL SECURITY WARNING:**  
> Do **NOT** run legacy scripts like `complete_setup.sql` or `fix_storage_bucket.sql` as-is. They contain permissive `TO public` rules that allow unauthorized anonymous users to upload or delete photos.  
> Run the **FIXED** authenticated, folder-scoped policy below:

Execute this script in the **Supabase SQL Editor**:

```sql
-- 1. Create or update the property-photos bucket (Public for reads, 5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-photos',
    'property-photos',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Public Read Access (Anyone can view property photos)
DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public can view property photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-photos');

-- 3. Authenticated Upload (Must be authenticated, folder-scoped to user ID)
DROP POLICY IF EXISTS "Allow authenticated uploads to property photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'property-photos' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 4. Authenticated Delete (Owners can only delete files in their own folder)
DROP POLICY IF EXISTS "Authenticated users can delete their property photos" ON storage.objects;
CREATE POLICY "Authenticated owners can delete their property photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'property-photos' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

---

### 1.4 Configure Phone OTP & Auth URLs

1. **Enable Phone Authentication**:
   - Go to **Authentication** → **Providers** → **Phone**.
   - Toggle **Enable Phone Provider** ON.
   - Choose your SMS Provider (Twilio, MessageBird, or Sparrow SMS for Nepal).
   - Enter your SMS Provider credentials.
2. **Whitelist Site URL & Redirect URLs**:
   - Go to **Authentication** → **URL Configuration**.
   - **Site URL**: `https://your-app.vercel.app` (or custom domain `https://sarvabhoomi.com`).
   - **Redirect URLs**:
     - `https://your-app.vercel.app/**`
     - `https://sarvabhoomi.com/**`
     - `http://localhost:3000/**` *(for local development)*

---

## 🚀 Step 2: Vercel Deployment Configuration

### 2.1 Import the Project
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import the GitHub repository: `Snehil208001/Sarvabhoomi`.

### 2.2 Configure Monorepo Build Settings

Vercel natively supports Turborepo monorepos. Choose **Option A (Recommended)**:

#### Option A: Deploy from Monorepo Root (Recommended)
- **Framework Preset**: `Next.js`
- **Root Directory**: `.` *(leave blank / repo root)*
- **Build Command**: `npx turbo run build` *(or `npm run build`)*
- **Output Directory**: `apps/web/.next`
- **Install Command**: `npm install`

#### Option B: Deploy with Root Directory Set to `apps/web`
- **Root Directory**: Click **Edit** and select `apps/web`.
- In project settings, ensure **Include files outside of the Root Directory in the Build Step** is **Checked / Enabled** (this allows Next.js to compile `@sarvabhoomi/shared` from `packages/shared`).
- **Build Command**: `npm run build`

---

### 2.3 Set Environment Variables

In the Vercel **Environment Variables** panel, add the following 3 variables:

| Variable Name | Description | Where to find in Supabase |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project API URL | Supabase Dashboard → **Project Settings** → **API** → **Project URL** (`https://xyz.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client API key | Supabase Dashboard → **Project Settings** → **API** → **Project API Keys** → `anon` `public` |
| `NEXT_PUBLIC_SITE_URL` | Canonical app URL | `https://your-app.vercel.app` (or `https://sarvabhoomi.com`) |

> [!IMPORTANT]
> `NEXT_PUBLIC_*` variables are baked into static JavaScript bundles at build time (`next build`).  
> If you add or modify these variables in Vercel after deployment, you **MUST trigger a Redeploy** for the new values to take effect.

---

## 🔍 Step 3: Post-Deployment Live URL Verification

After Vercel finishes building, visit the live deployment URL and test these core flows:

1. **Landing & Splash Screen**:
   - Open the homepage: The 3D embossed gold coin splash screen plays (thin ring draws → logo pops → Sarvabhoomi title → tagline → progress bar fills → fades out at 2.4s).
   - Refresh the page: The splash screen **does not show again** in the same session (single-session rule via `sessionStorage`).
2. **Search Rentals (`/search`)**:
   - Filter by district (Kathmandu, Lalitpur, Pokhara), property subtype (Flat, House, Room), or budget.
   - Confirm listing cards render with price in NPR, deposit, bedroom count, and verified badge.
3. **User Authentication Flow (`/auth`)**:
   - **Signup as Renter**: Enter Nepali mobile (+977 98XXXXXXXX) → enter 6-digit OTP → select role `RENTER` → redirected to `/dashboard` with 15 free contact credits.
   - **Signup as Owner**: Repeat with another mobile number → select role `OWNER` → redirected to `/dashboard`.
4. **Cross-Role Middleware Guardrails**:
   - While logged in as `RENTER`, visit `/post-property`: Verify you are redirected to `/dashboard?error=renter_cannot_post`.
   - While logged in as `OWNER`, visit `/search` or `/properties/:id`: Verify you are redirected to `/dashboard`.
5. **Post a Rental (`/post-property`)**:
   - Log in as `OWNER`, navigate to `/post-property`.
   - Complete 5-step wizard, upload at least one photo, and submit.
   - Verify listing is saved with status `PENDING_REVIEW` and image URL points to `property-photos` bucket.
6. **Contact Unlock & Visit Request (`/properties/[id]`)**:
   - Log in as `RENTER`, visit a listing detail page.
   - Click **"Contact Landlord"**: Modal opens, deducts 1 credit, unlocks landlord phone number.
   - Submit a **Schedule Viewing** request: Confirmation banner appears.
7. **Bilingual Verification**:
   - Click the language toggle (`नेपाली` / `English`) in the navbar.
   - Verify Nepali Devanagari text renders cleanly across hero, filters, and cards with no clipped text.

---

## 🛠️ Step 4: Troubleshooting Matrix

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Build fails with missing `NEXT_PUBLIC_SUPABASE_URL`** | Environment variables were not set before build in Vercel. | In Vercel Project Settings → Environment Variables, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy. *(Note: Our lazy proxy build allows build to complete without vars, but runtime access requires them).* |
| **Build fails resolving `@sarvabhoomi/shared`** | Root Directory set to `apps/web` without external file access. | In Vercel Project Settings → Root Directory, check **Include files outside of the Root Directory in the Build Step**, or deploy with Root Directory set to `.` (monorepo root). |
| **Database error when fetching rentals** | Migrations 06–09 not applied. | Run `20261106000006_two_roles_rent_only.sql` and `20261106000007_rent_fields.sql` in Supabase SQL editor. |
| **SMS OTP code is never delivered** | SMS Provider credentials missing or phone format invalid. | Ensure phone numbers are 10 digits starting with `98` or `97`. Check your SMS provider balance/configuration in Supabase Auth Settings. |
| **Authentication loops or redirects fail** | Site URL or Redirect URLs not configured in Supabase. | In Supabase Auth → URL Configuration, add your production Vercel domain to **Redirect URLs** (`https://your-domain.vercel.app/**`). |
| **Photo upload returns HTTP 403 Forbidden** | Storage bucket `property-photos` missing or RLS policy rejecting. | Run the storage policy script in Step 1.3 to ensure `property-photos` bucket exists and has authenticated insert policies. |

---

## 🚫 Step 5: Strict Security Rules ("Do NOTs")

- ❌ **DO NOT** commit `.env.local` or paste production keys into public repositories or chats.
- ❌ **DO NOT** set `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables. The client application only requires the public `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- ❌ **DO NOT** run `complete_setup.sql` as-is in production. It contains legacy permissive public policies.
- ❌ **DO NOT** leave the `property-photos` storage bucket with `TO public` write or delete permissions.

