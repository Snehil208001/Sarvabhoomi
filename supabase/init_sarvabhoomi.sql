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
-- 7. Notify PostgREST to immediately refresh its schema cache
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
