-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT
-- Migration: 20261103000001_auth_and_onboarding.sql
-- Description: Core Schema for Platform Configuration, User Profiles,
--              Tier Subscriptions, and Launch Promotional Credit Trigger
-- ==============================================================================

-- Ensure PostGIS and pgcrypto extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Table: public.app_config
-- Global platform configuration singleton (id = 1)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    launch_free_credits INT NOT NULL DEFAULT 15,
    is_gis_polygon_free BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Singleton Row (Stage 1 Launch Seeding Mode: 15 free landowner contact unlock credits)
INSERT INTO public.app_config (id, launch_free_credits, is_gis_polygon_free)
VALUES (1, 15, TRUE)
ON CONFLICT (id) DO UPDATE
SET launch_free_credits = EXCLUDED.launch_free_credits,
    is_gis_polygon_free = EXCLUDED.is_gis_polygon_free;

-- Enable Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access to platform configuration
CREATE POLICY "Allow public read access to app_config"
    ON public.app_config
    FOR SELECT
    USING (true);

-- ------------------------------------------------------------------------------
-- 2. Table: public.profiles
-- Core user profile linked to Supabase auth.users
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_np VARCHAR(15) UNIQUE NOT NULL,
    full_name TEXT,
    user_intent VARCHAR(20) CHECK (user_intent IN ('BUYER', 'OWNER', 'INVESTOR_NRN')),
    preferred_region VARCHAR(10) DEFAULT 'HILLY' CHECK (preferred_region IN ('HILLY', 'TERAI')),
    preferred_district VARCHAR(60) DEFAULT 'Kathmandu',
    preferred_lang VARCHAR(2) DEFAULT 'en' CHECK (preferred_lang IN ('en', 'ne')),
    role VARCHAR(15) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_np);
CREATE INDEX IF NOT EXISTS idx_profiles_user_intent ON public.profiles(user_intent);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_district ON public.profiles(preferred_district);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles: Users manage their own profile data
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. Table: public.user_subscriptions
-- Tracks user subscription tier, contact unlock credit balances, and expiration
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

-- Index for querying subscription by user
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated read for user_subscriptions
CREATE POLICY "Users can view their own subscription"
    ON public.user_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Trigger & Function: handle_new_user_subscription
-- Automatically seeds 15 free promotional credits into user_subscriptions
-- when a new profile is registered.
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
    -- Read current promotional allocation from singleton platform configuration
    SELECT COALESCE(launch_free_credits, 15)
    INTO v_launch_credits
    FROM public.app_config
    WHERE id = 1;

    -- Fallback safety
    IF v_launch_credits IS NULL THEN
        v_launch_credits := 15;
    END IF;

    -- Automatically initialize promotional subscription record
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

-- Attach trigger to public.profiles table
DROP TRIGGER IF EXISTS trg_on_profile_created ON public.profiles;

CREATE TRIGGER trg_on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_subscription();
