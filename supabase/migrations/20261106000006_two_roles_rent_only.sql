-- ==============================================================================
-- 🇳🇵 SARVABHOOMI MIGRATION: TWO-ROLE ARCHITECTURE & RENT-ONLY REPOSITORY
-- Migration: 20261106000006_two_roles_rent_only.sql
-- ==============================================================================

-- 1. Add user_role column to profiles (RENTER vs OWNER)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_role TEXT CHECK (user_role IN ('RENTER', 'OWNER'));

CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);

-- Backfill legacy user_intent:
-- Existing 'OWNER' maps to 'OWNER'; all others become NULL (must choose on next login)
UPDATE public.profiles
SET user_role = 'OWNER'
WHERE user_intent = 'OWNER' AND user_role IS NULL;

UPDATE public.profiles
SET user_role = NULL
WHERE user_intent IN ('BUYER', 'INVESTOR_NRN', 'AGENT_BROKER') AND user_role IS NULL;

-- 2. Trigger to enforce immutable user_role (can be chosen once; cannot be altered by user)
CREATE OR REPLACE FUNCTION public.enforce_immutable_user_role()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.user_role IS NOT NULL AND NEW.user_role IS DISTINCT FROM OLD.user_role THEN
        IF current_user NOT IN ('postgres', 'service_role') AND (OLD.role IS DISTINCT FROM 'ADMIN') THEN
            RAISE EXCEPTION 'user_role is permanent and cannot be modified once set. A separate phone number is required for the other role.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_immutable_user_role ON public.profiles;
CREATE TRIGGER trg_enforce_immutable_user_role
    BEFORE UPDATE OF user_role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_immutable_user_role();

-- 3. Restrict listing_type to RENT_HOUSE only
-- Pause all existing non-rental seed rows (do not delete)
UPDATE public.properties
SET status = 'PAUSED'
WHERE listing_type IN ('BUY_LAND', 'BUY_HOUSE', 'COMMERCIAL');

-- Update listing_type check constraint
ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_listing_type_check;

ALTER TABLE public.properties
ADD CONSTRAINT properties_listing_type_check
CHECK (
    listing_type = 'RENT_HOUSE'
    OR (status = 'PAUSED' AND listing_type IN ('BUY_LAND', 'BUY_HOUSE', 'COMMERCIAL'))
);

-- 4. Enforce RLS on properties table
-- RENTERS & public can view ACTIVE rentals; Owners can always view their own
DROP POLICY IF EXISTS "Public can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Renters and owners can view active properties" ON public.properties;
CREATE POLICY "Renters and owners can view active properties"
    ON public.properties FOR SELECT
    USING (
        (status = 'ACTIVE' AND (
            EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_role = 'RENTER')
            OR auth.uid() = owner_id
            OR auth.uid() IS NULL -- allow initial public browsing
        ))
        OR auth.uid() = owner_id
    );

-- Only OWNERS can insert properties
DROP POLICY IF EXISTS "Owners can insert their properties" ON public.properties;
DROP POLICY IF EXISTS "Only owners can insert properties" ON public.properties;
CREATE POLICY "Only owners can insert properties"
    ON public.properties FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = owner_id
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.user_role = 'OWNER'
        )
        AND (admin_verified IS FALSE OR admin_verified IS NULL)
    );

-- Only OWNERS can update their properties
DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
DROP POLICY IF EXISTS "Only owners can update their properties" ON public.properties;
CREATE POLICY "Only owners can update their properties"
    ON public.properties FOR UPDATE TO authenticated
    USING (
        auth.uid() = owner_id
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.user_role = 'OWNER'
        )
    )
    WITH CHECK (
        auth.uid() = owner_id
        AND admin_verified IS NOT DISTINCT FROM (
            SELECT p.admin_verified FROM public.properties p WHERE p.id = properties.id
        )
    );

-- Only OWNERS can delete their properties
DROP POLICY IF EXISTS "Owners can delete their properties" ON public.properties;
DROP POLICY IF EXISTS "Only owners can delete their properties" ON public.properties;
CREATE POLICY "Only owners can delete their properties"
    ON public.properties FOR DELETE TO authenticated
    USING (
        auth.uid() = owner_id
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.user_role = 'OWNER'
        )
    );

-- 5. Enforce RLS on contact_unlocks (Only RENTERS can unlock contacts)
DROP POLICY IF EXISTS "Authenticated users can insert contact unlocks" ON public.contact_unlocks;
DROP POLICY IF EXISTS "Only renters can insert contact unlocks" ON public.contact_unlocks;
CREATE POLICY "Only renters can insert contact unlocks"
    ON public.contact_unlocks FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.user_role = 'RENTER'
        )
    );

-- 6. Enforce RLS on property_favourites (Only RENTERS can shortlist)
DROP POLICY IF EXISTS "Users can insert favourites" ON public.property_favourites;
DROP POLICY IF EXISTS "Only renters can insert favourites" ON public.property_favourites;
CREATE POLICY "Only renters can insert favourites"
    ON public.property_favourites FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.user_role = 'RENTER'
        )
    );

-- 7. Update unlock_property_contact RPC to enforce RENTER role
CREATE OR REPLACE FUNCTION public.unlock_property_contact(p_property_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
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

    -- Verify user is a RENTER
    SELECT user_role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
    IF v_user_role IS DISTINCT FROM 'RENTER' THEN
        RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_ROLE', 'message', 'Only verified Renter accounts can unlock landowner contacts.');
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

-- 8. Notify schema reload
NOTIFY pgrst, 'reload schema';
