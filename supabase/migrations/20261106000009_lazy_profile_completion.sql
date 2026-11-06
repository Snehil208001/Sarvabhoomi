-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT
-- Migration: 20261106000009_lazy_profile_completion.sql
-- Description: Adds profile_completed boolean flag to profiles table.
--              Profiles become lazy: full_name & district are requested only
--              on-demand (first unlock/visit for Renters; listing publish for Owners).
-- ==============================================================================

-- 1. Add profile_completed flag
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- 2. Backfill existing profiles that already have full_name and preferred_district set
UPDATE public.profiles
SET profile_completed = TRUE
WHERE full_name IS NOT NULL
  AND TRIM(full_name) != ''
  AND preferred_district IS NOT NULL
  AND TRIM(preferred_district) != '';

-- 3. Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_completed ON public.profiles(profile_completed);

-- 4. Documentation
COMMENT ON COLUMN public.profiles.profile_completed IS 'True when user has provided both full_name and preferred_district. Collected on-demand, not blocking signup.';
