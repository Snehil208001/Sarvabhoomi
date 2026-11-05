-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT
-- Migration: 20261105000003_properties.sql
-- Description: Core Properties Schema, Favorites, Contact Unlocks,
--              RLS Policies, and Atomic Contact Unlock Stored Procedure
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Table: public.properties
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_district ON public.properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price_npr);
CREATE INDEX IF NOT EXISTS idx_properties_area_sqft ON public.properties(area_sqft);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties Policies
DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
CREATE POLICY "Public can view active properties"
    ON public.properties
    FOR SELECT
    USING (status = 'ACTIVE' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their properties" ON public.properties;
CREATE POLICY "Owners can insert their properties"
    ON public.properties
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
CREATE POLICY "Owners can update their properties"
    ON public.properties
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their properties" ON public.properties;
CREATE POLICY "Owners can delete their properties"
    ON public.properties
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- 2. Table: public.property_favourites
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
    ON public.property_favourites
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favourites" ON public.property_favourites;
CREATE POLICY "Users can add favourites"
    ON public.property_favourites
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favourites" ON public.property_favourites;
CREATE POLICY "Users can remove favourites"
    ON public.property_favourites
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 3. Table: public.contact_unlocks
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
    ON public.contact_unlocks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Stored Procedure: unlock_property_contact
-- Atomically checks credit balance, decrements 1 credit, logs unlock, and reveals owner contact
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

    -- Lookup property owner
    SELECT owner_id INTO v_owner_id
    FROM public.properties
    WHERE id = p_property_id;

    IF v_owner_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property listing not found.');
    END IF;

    -- Fetch owner details
    SELECT phone_np, full_name, user_intent
    INTO v_owner_phone, v_owner_name, v_owner_intent
    FROM public.profiles
    WHERE id = v_owner_id;

    -- If the user is the owner, return details directly without charging credits
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

    -- Check if already unlocked
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
            'owner_name', COALESCE(v_owner_name, 'Verified Owner'),
            'owner_intent', v_owner_intent,
            'credits_remaining', COALESCE(v_credits, 0)
        );
    END IF;

    -- Check user credits
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

    -- Deduct 1 credit
    UPDATE public.user_subscriptions
    SET credits_remaining = credits_remaining - 1,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- Record unlock
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
-- 5. Storage Bucket Configuration for Property Photos
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
CREATE POLICY "Public can view property photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'property-photos');

NOTIFY pgrst, 'reload schema';

