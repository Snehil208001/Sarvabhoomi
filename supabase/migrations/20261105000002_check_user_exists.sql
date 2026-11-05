-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT
-- Migration: 20261105000002_check_user_exists.sql
-- Description: Stored procedure / RPC to check if a phone number exists,
--              is onboarded, and retrieve user intent for dynamic login/signup flow
-- ==============================================================================

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
    -- Normalize phone input: strip any leading +977 or 977 and trim whitespace
    v_clean_phone := regexp_replace(trim(p_phone), '^(\+?977)', '');

    -- Query public.profiles matching exact input or normalized Nepal phone formats
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

-- Allow public/anon and authenticated access to execute the check function
GRANT EXECUTE ON FUNCTION public.check_user_status(TEXT) TO anon, authenticated;

-- Comment for PostgREST & Database Documentation
COMMENT ON FUNCTION public.check_user_status(TEXT) IS 'Checks user existence, onboarding status, and role/intent by phone number for dynamic login/signup flow.';
