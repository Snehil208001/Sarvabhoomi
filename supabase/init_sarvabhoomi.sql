-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT — ONE-CLICK SUPABASE SCHEMA INITIALIZATION
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qmwrkhjtbbleskjmeauo/sql/new
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Platform Configuration Singleton (app_config)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    launch_free_credits INT NOT NULL DEFAULT 15,
    is_gis_polygon_free BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Singleton Row
INSERT INTO public.app_config (id, launch_free_credits, is_gis_polygon_free)
VALUES (1, 15, TRUE)
ON CONFLICT (id) DO UPDATE
SET launch_free_credits = EXCLUDED.launch_free_credits,
    is_gis_polygon_free = EXCLUDED.is_gis_polygon_free;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to app_config" ON public.app_config;
CREATE POLICY "Allow public read access to app_config"
    ON public.app_config
    FOR SELECT
    USING (true);

-- ------------------------------------------------------------------------------
-- 3. Core User Profiles Table (profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_np VARCHAR(15) UNIQUE NOT NULL,
    full_name TEXT,
    user_intent VARCHAR(30) CHECK (user_intent IN ('BUYER', 'OWNER', 'INVESTOR_NRN', 'AGENT_BROKER')),
    preferred_region VARCHAR(10) DEFAULT 'HILLY' CHECK (preferred_region IN ('HILLY', 'TERAI')),
    preferred_district VARCHAR(60) DEFAULT 'Kathmandu',
    preferred_lang VARCHAR(2) DEFAULT 'en' CHECK (preferred_lang IN ('en', 'ne')),
    role VARCHAR(15) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_np);
CREATE INDEX IF NOT EXISTS idx_profiles_user_intent ON public.profiles(user_intent);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_district ON public.profiles(preferred_district);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4. User Subscriptions Table (user_subscriptions)
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
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. Automatic 15 Free Credits Trigger (handle_new_user_subscription)
-- ------------------------------------------------------------------------------
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
-- 6. Dynamic User Check RPC (check_user_status)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_status(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exists BOOLEAN := FALSE;
    v_onboarded BOOLEAN := FALSE;
    v_user_intent TEXT := NULL;
    v_clean_phone TEXT;
BEGIN
    v_clean_phone := regexp_replace(trim(p_phone), '^(\+?977)', '');

    SELECT TRUE, COALESCE(is_onboarded, FALSE), user_intent
    INTO v_exists, v_onboarded, v_user_intent
    FROM public.profiles
    WHERE phone_np = p_phone
       OR phone_np = ('+977' || v_clean_phone)
       OR phone_np = v_clean_phone
    LIMIT 1;

    RETURN jsonb_build_object(
        'exists', COALESCE(v_exists, FALSE),
        'is_onboarded', COALESCE(v_onboarded, FALSE),
        'user_intent', v_user_intent
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_status(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 7. Properties Table (properties)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    listing_type VARCHAR(30) NOT NULL CHECK (listing_type IN ('BUY_LAND', 'BUY_HOUSE', 'RENT_HOUSE', 'COMMERCIAL')),
    price_npr NUMERIC NOT NULL CHECK (price_npr > 0),
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
    lalpurja_verified BOOLEAN DEFAULT FALSE,
    kitta_no VARCHAR(50),
    photos TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'SOLD', 'PAUSED')),
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_district ON public.properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price_npr);
CREATE INDEX IF NOT EXISTS idx_properties_area_sqft ON public.properties(area_sqft);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
CREATE POLICY "Public can view active properties"
    ON public.properties FOR SELECT
    USING (status = 'ACTIVE' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their properties" ON public.properties;
CREATE POLICY "Owners can insert their properties"
    ON public.properties FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
CREATE POLICY "Owners can update their properties"
    ON public.properties FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their properties" ON public.properties;
CREATE POLICY "Owners can delete their properties"
    ON public.properties FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- 8. Property Favourites Table (property_favourites)
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
    ON public.property_favourites FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favourites" ON public.property_favourites;
CREATE POLICY "Users can add favourites"
    ON public.property_favourites FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favourites" ON public.property_favourites;
CREATE POLICY "Users can remove favourites"
    ON public.property_favourites FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. Contact Unlocks Table (contact_unlocks)
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
    ON public.contact_unlocks FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. Atomic Stored Procedure: unlock_property_contact
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
    v_owner_intent TEXT;
    v_credits INT;
    v_already_unlocked BOOLEAN := FALSE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Authentication required to unlock contact details.');
    END IF;

    SELECT owner_id INTO v_owner_id FROM public.properties WHERE id = p_property_id;
    IF v_owner_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property listing not found.');
    END IF;

    SELECT phone_np, full_name, user_intent INTO v_owner_phone, v_owner_name, v_owner_intent
    FROM public.profiles WHERE id = v_owner_id;

    IF v_user_id = v_owner_id THEN
        RETURN jsonb_build_object(
            'success', true,
            'is_owner', true,
            'owner_phone', v_owner_phone,
            'owner_name', COALESCE(v_owner_name, 'Verified Owner'),
            'owner_intent', v_owner_intent,
            'credits_remaining', 15
        );
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.contact_unlocks WHERE user_id = v_user_id AND property_id = p_property_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        SELECT COALESCE(credits_remaining, 0) INTO v_credits
        FROM public.user_subscriptions WHERE user_id = v_user_id;

        RETURN jsonb_build_object(
            'success', true,
            'already_unlocked', true,
            'owner_phone', v_owner_phone,
            'owner_name', COALESCE(v_owner_name, 'Verified Owner'),
            'owner_intent', v_owner_intent,
            'credits_remaining', COALESCE(v_credits, 0)
        );
    END IF;

    SELECT credits_remaining INTO v_credits
    FROM public.user_subscriptions WHERE user_id = v_user_id FOR UPDATE;

    IF v_credits IS NULL OR v_credits <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient credits. You have 0 credits remaining.',
            'credits_remaining', 0
        );
    END IF;

    UPDATE public.user_subscriptions
    SET credits_remaining = credits_remaining - 1, updated_at = NOW()
    WHERE user_id = v_user_id;

    INSERT INTO public.contact_unlocks (user_id, property_id)
    VALUES (v_user_id, p_property_id)
    ON CONFLICT (user_id, property_id) DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'unlocked_now', true,
        'owner_phone', v_owner_phone,
        'owner_name', COALESCE(v_owner_name, 'Verified Owner'),
        'owner_intent', v_owner_intent,
        'credits_remaining', v_credits - 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_property_contact(UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 11. Storage Bucket for Property Photos
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
CREATE POLICY "Public can view property photos"
    ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property photos"
    ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-photos');

-- ------------------------------------------------------------------------------
-- 12. Notify PostgREST to immediately refresh its schema cache
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

