-- ==============================================================================
-- 🇳🇵 SARVABHOOMI — PROPERTIES, FAVOURITES, UNLOCKS & STORAGE SETUP
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ------------------------------------------------------------------------------
-- 2. Properties Table (properties)
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
    owner_declared_lalpurja BOOLEAN DEFAULT FALSE,
    admin_verified BOOLEAN DEFAULT FALSE,
    kitta_no VARCHAR(50),
    photos TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DRAFT', 'SOLD', 'PAUSED')),
    views_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync trigger between admin_verified and legacy lalpurja_verified
CREATE OR REPLACE FUNCTION public.sync_property_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.admin_verified IS TRUE THEN
        NEW.lalpurja_verified := TRUE;
    ELSE
        NEW.lalpurja_verified := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_property_verification_status ON public.properties;
CREATE TRIGGER trg_sync_property_verification_status
    BEFORE INSERT OR UPDATE OF admin_verified ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_property_verification_status();

-- Search & Performance Indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_district ON public.properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price_npr);
CREATE INDEX IF NOT EXISTS idx_properties_area_sqft ON public.properties(area_sqft);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties(status, listing_type, district, price_npr);
CREATE INDEX IF NOT EXISTS idx_properties_locality_trgm ON public.properties USING gin (locality gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON public.properties USING gin (title gin_trgm_ops);

-- Properties Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
CREATE POLICY "Public can view active properties"
    ON public.properties FOR SELECT
    USING (status = 'ACTIVE' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can insert their properties" ON public.properties;
CREATE POLICY "Owners can insert their properties"
    ON public.properties FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = owner_id
        AND (admin_verified IS FALSE OR admin_verified IS NULL)
    );

DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
CREATE POLICY "Owners can update their properties"
    ON public.properties FOR UPDATE TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (
        auth.uid() = owner_id
        AND admin_verified IS NOT DISTINCT FROM (
            SELECT p.admin_verified FROM public.properties p WHERE p.id = properties.id
        )
    );

DROP POLICY IF EXISTS "Owners can delete their properties" ON public.properties;
CREATE POLICY "Owners can delete their properties"
    ON public.properties FOR DELETE TO authenticated
    USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- 3. Property Favourites Table (property_favourites)
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
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert favourites" ON public.property_favourites;
CREATE POLICY "Users can insert favourites"
    ON public.property_favourites FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their favourites" ON public.property_favourites;
CREATE POLICY "Users can delete their favourites"
    ON public.property_favourites FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Contact Unlocks Table (contact_unlocks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    credits_spent INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_unlocks_user ON public.contact_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_unlocks_prop ON public.contact_unlocks(property_id);

ALTER TABLE public.contact_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their contact unlocks" ON public.contact_unlocks;
CREATE POLICY "Users can view their contact unlocks"
    ON public.contact_unlocks FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated users can insert contact unlocks" ON public.contact_unlocks;
CREATE POLICY "Authenticated users can insert contact unlocks"
    ON public.contact_unlocks FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 5. Atomic Contact Unlock Stored Procedure (unlock_property_contact)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.unlock_property_contact(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_owner_id UUID;
    v_owner_phone TEXT;
    v_owner_name TEXT;
    v_credits INT;
    v_already_unlocked BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED', 'message', 'You must be logged in.');
    END IF;

    SELECT owner_id INTO v_owner_id FROM public.properties WHERE id = p_property_id;
    IF v_owner_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'PROPERTY_NOT_FOUND', 'message', 'Property not found.');
    END IF;

    IF v_owner_id = v_user_id THEN
        SELECT phone_np, full_name INTO v_owner_phone, v_owner_name FROM public.profiles WHERE id = v_owner_id;
        RETURN jsonb_build_object(
            'success', true,
            'ownerPhone', v_owner_phone,
            'ownerName', v_owner_name,
            'isOwnListing', true,
            'creditsRemaining', (SELECT credits_remaining FROM public.user_subscriptions WHERE user_id = v_user_id)
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.contact_unlocks
        WHERE user_id = v_user_id AND property_id = p_property_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        SELECT phone_np, full_name INTO v_owner_phone, v_owner_name FROM public.profiles WHERE id = v_owner_id;
        SELECT credits_remaining INTO v_credits FROM public.user_subscriptions WHERE user_id = v_user_id;
        RETURN jsonb_build_object(
            'success', true,
            'ownerPhone', v_owner_phone,
            'ownerName', v_owner_name,
            'alreadyUnlocked', true,
            'creditsRemaining', v_credits
        );
    END IF;

    SELECT credits_remaining INTO v_credits
    FROM public.user_subscriptions
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_credits IS NULL OR v_credits < 1 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'message', 'Insufficient unlock credits. Please upgrade.');
    END IF;

    UPDATE public.user_subscriptions
    SET credits_remaining = credits_remaining - 1, updated_at = NOW()
    WHERE user_id = v_user_id;

    INSERT INTO public.contact_unlocks (user_id, property_id, owner_id, credits_spent)
    VALUES (v_user_id, p_property_id, v_owner_id, 1);

    SELECT phone_np, full_name INTO v_owner_phone, v_owner_name FROM public.profiles WHERE id = v_owner_id;

    RETURN jsonb_build_object(
        'success', true,
        'ownerPhone', v_owner_phone,
        'ownerName', v_owner_name,
        'creditsRemaining', v_credits - 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.unlock_property_contact(UUID) TO authenticated;

-- ------------------------------------------------------------------------------
-- 6. Storage Bucket for Property Photos
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

DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'property-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Authenticated users can update their property photos" ON storage.objects;
CREATE POLICY "Authenticated users can update their property photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'property-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Authenticated users can delete their property photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete their property photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'property-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ------------------------------------------------------------------------------
-- 7. Notify PostgREST to reload schema cache
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

