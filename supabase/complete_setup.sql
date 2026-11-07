-- ==============================================================================
-- 🇳🇵 SARVABHOOMI — COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- Paste this ENTIRE script into the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- Click "RUN" to initialize or repair all tables, indexes, policies, and storage.
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------------------------
-- 1. Table: public.app_config
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    launch_free_credits INT NOT NULL DEFAULT 15,
    is_gis_polygon_free BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.app_config (id, launch_free_credits, is_gis_polygon_free)
VALUES (1, 15, TRUE)
ON CONFLICT (id) DO UPDATE
SET launch_free_credits = EXCLUDED.launch_free_credits,
    is_gis_polygon_free = EXCLUDED.is_gis_polygon_free;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to app_config" ON public.app_config;
CREATE POLICY "Allow public read access to app_config"
    ON public.app_config FOR SELECT
    USING (true);

-- ------------------------------------------------------------------------------
-- 2. Table: public.profiles
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_np VARCHAR(15) UNIQUE NOT NULL,
    full_name TEXT,
    user_intent VARCHAR(30) CHECK (user_intent IN ('BUYER', 'OWNER', 'INVESTOR_NRN', 'AGENT_BROKER')),
    user_role TEXT CHECK (user_role IN ('RENTER', 'OWNER')),
    preferred_region VARCHAR(10) DEFAULT 'HILLY' CHECK (preferred_region IN ('HILLY', 'TERAI')),
    preferred_district VARCHAR(60) DEFAULT 'Kathmandu',
    preferred_lang VARCHAR(2) DEFAULT 'en' CHECK (preferred_lang IN ('en', 'ne')),
    role VARCHAR(15) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_onboarded BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if table was previously created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('RENTER', 'OWNER'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_np);
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_district ON public.profiles(preferred_district);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public can view owner profile summary" ON public.profiles;
CREATE POLICY "Public can view owner profile summary"
    ON public.profiles FOR SELECT
    USING (user_role = 'OWNER');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. Table: public.user_subscriptions (15 Free Promotional Credits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_tier VARCHAR(20) DEFAULT 'LAUNCH_PROMO',
    credits_remaining INT NOT NULL DEFAULT 15,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
    ON public.user_subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_launch_credits INT;
BEGIN
    SELECT COALESCE(launch_free_credits, 15)
    INTO v_launch_credits
    FROM public.app_config
    WHERE id = 1;

    IF v_launch_credits IS NULL THEN
        v_launch_credits := 15;
    END IF;

    INSERT INTO public.user_subscriptions (
        user_id,
        plan_tier,
        credits_remaining,
        expires_at
    )
    VALUES (
        NEW.id,
        'LAUNCH_PROMO',
        v_launch_credits,
        NOW() + INTERVAL '90 days'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_profile_created ON public.profiles;
CREATE TRIGGER trg_on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_subscription();

-- ------------------------------------------------------------------------------
-- 4. Table: public.properties
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    listing_type VARCHAR(30) NOT NULL DEFAULT 'RENT_HOUSE',
    price_npr NUMERIC NOT NULL CHECK (price_npr > 0),
    monthly_rent_npr NUMERIC,
    deposit_npr NUMERIC,
    maintenance_npr NUMERIC,
    maintenance_included BOOLEAN DEFAULT FALSE,
    furnishing TEXT CHECK (furnishing IN ('FULLY', 'SEMI', 'UNFURNISHED')),
    property_subtype TEXT CHECK (property_subtype IN ('HOUSE', 'FLAT', 'ROOM', 'SHOP')),
    preferred_tenant TEXT CHECK (preferred_tenant IN ('FAMILY', 'BACHELOR', 'BACHELOR_MALE', 'BACHELOR_FEMALE', 'COMPANY', 'ANY')),
    available_from DATE,
    floor_no INT,
    total_floors INT,
    parking BOOLEAN,
    district VARCHAR(60) NOT NULL,
    municipality VARCHAR(100),
    ward INT,
    locality TEXT NOT NULL,
    area_value NUMERIC NOT NULL CHECK (area_value > 0),
    area_unit VARCHAR(20) NOT NULL CHECK (area_unit IN ('ROPANI', 'AANA', 'BIGHA', 'KATTHA', 'SQFT')),
    area_sqft NUMERIC NOT NULL CHECK (area_sqft > 0),
    road_access TEXT,
    facing VARCHAR(30) CHECK (facing IN ('EAST', 'WEST', 'NORTH', 'SOUTH', 'NORTH_EAST', 'SOUTH_EAST', 'NORTH_WEST', 'SOUTH_WEST')),
    bedrooms INT,
    bathrooms INT,
    owner_declared_lalpurja BOOLEAN DEFAULT FALSE,
    admin_verified BOOLEAN DEFAULT FALSE,
    lalpurja_verified BOOLEAN DEFAULT FALSE,
    kitta_no VARCHAR(50),
    photos TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_REVIEW', 'DRAFT', 'SOLD', 'PAUSED')),
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all rental columns exist
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS monthly_rent_npr NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deposit_npr NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_npr NUMERIC;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS maintenance_included BOOLEAN DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnishing TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_subtype TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS preferred_tenant TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_no INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_floors INT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking BOOLEAN;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_declared_lalpurja BOOLEAN DEFAULT FALSE;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_district ON public.properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent ON public.properties(monthly_rent_npr);
CREATE INDEX IF NOT EXISTS idx_properties_subtype ON public.properties(property_subtype);
CREATE INDEX IF NOT EXISTS idx_properties_furnishing ON public.properties(furnishing);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Renters and owners can view active properties" ON public.properties;
CREATE POLICY "Renters and owners can view active properties"
    ON public.properties FOR SELECT
    USING (status = 'ACTIVE' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their properties" ON public.properties;
DROP POLICY IF EXISTS "Only owners can insert properties" ON public.properties;
CREATE POLICY "Only owners can insert properties"
    ON public.properties FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
DROP POLICY IF EXISTS "Only owners can update their properties" ON public.properties;
CREATE POLICY "Only owners can update their properties"
    ON public.properties FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their properties" ON public.properties;
CREATE POLICY "Owners can delete their properties"
    ON public.properties FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- 5. Table: public.property_favourites
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_user_id ON public.property_favourites(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_property_id ON public.property_favourites(property_id);

ALTER TABLE public.property_favourites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their favourites" ON public.property_favourites;
CREATE POLICY "Users can view their favourites"
    ON public.property_favourites FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favourites" ON public.property_favourites;
CREATE POLICY "Users can add favourites"
    ON public.property_favourites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favourites" ON public.property_favourites;
CREATE POLICY "Users can remove favourites"
    ON public.property_favourites FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6. Table: public.contact_unlocks
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_unlocks_user ON public.contact_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_property ON public.contact_unlocks(property_id);

ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their contact unlocks" ON public.contact_unlocks;
CREATE POLICY "Users can view their contact unlocks"
    ON public.contact_unlocks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. Stored Procedure: unlock_property_contact
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unlock_property_contact(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_owner_id UUID;
    v_owner_phone TEXT;
    v_owner_name TEXT;
    v_credits INT;
    v_already_unlocked BOOLEAN := FALSE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required to unlock contact details.');
    END IF;

    SELECT owner_id INTO v_owner_id
    FROM public.properties
    WHERE id = p_property_id;

    IF v_owner_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property listing not found.');
    END IF;

    SELECT phone_np, full_name
    INTO v_owner_phone, v_owner_name
    FROM public.profiles
    WHERE id = v_owner_id;

    IF v_user_id = v_owner_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_owner', true,
            'owner_phone', v_owner_phone,
            'owner_name', COALESCE(v_owner_name, 'Verified Landlord'),
            'credits_remaining', 15
        );
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.contact_unlocks
        WHERE user_id = v_user_id AND property_id = p_property_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        SELECT COALESCE(credits_remaining, 0) INTO v_credits
        FROM public.user_subscriptions
        WHERE user_id = v_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_unlocked', true,
            'owner_phone', v_owner_phone,
            'owner_name', COALESCE(v_owner_name, 'Verified Landlord'),
            'credits_remaining', COALESCE(v_credits, 0)
        );
    END IF;

    SELECT credits_remaining INTO v_credits
    FROM public.user_subscriptions
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_credits IS NULL OR v_credits <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits. You have 0 credits remaining.',
            'credits_remaining', 0
        );
    END IF;

    UPDATE public.user_subscriptions
    SET credits_remaining = credits_remaining - 1,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    INSERT INTO public.contact_unlocks (user_id, property_id)
    VALUES (v_user_id, p_property_id)
    ON CONFLICT (user_id, property_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'unlocked_now', true,
        'owner_phone', v_owner_phone,
        'owner_name', COALESCE(v_owner_name, 'Verified Landlord'),
        'credits_remaining', v_credits - 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_property_contact(UUID) TO authenticated, anon;

-- ------------------------------------------------------------------------------
-- 8. Table: public.property_visit_requests
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.property_visit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    renter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    visit_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.property_visit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Renters can create visit requests" ON public.property_visit_requests;
CREATE POLICY "Renters can create visit requests"
    ON public.property_visit_requests FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = renter_id);

DROP POLICY IF EXISTS "Renters can view their visit requests" ON public.property_visit_requests;
CREATE POLICY "Renters can view their visit requests"
    ON public.property_visit_requests FOR SELECT TO authenticated
    USING (auth.uid() = renter_id);

DROP POLICY IF EXISTS "Owners can view visit requests for their properties" ON public.property_visit_requests;
CREATE POLICY "Owners can view visit requests for their properties"
    ON public.property_visit_requests FOR SELECT TO authenticated
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update visit request status" ON public.property_visit_requests;
CREATE POLICY "Owners can update visit request status"
    ON public.property_visit_requests FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_visit_requests_owner ON public.property_visit_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_renter ON public.property_visit_requests(renter_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_property ON public.property_visit_requests(property_id);

-- ------------------------------------------------------------------------------
-- 9. Storage Bucket: property-photos
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-photos',
    'property-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public can view property photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Allow authenticated uploads to property photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload property photos" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to property photos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Public can upload property photos"
    ON storage.objects FOR INSERT TO public
    WITH CHECK (bucket_id = 'property-photos');

-- ------------------------------------------------------------------------------
-- 10. Grant Table Permissions & Force Schema Cache Reload
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
