-- ==============================================================================
-- Migration: 20261105000004_lalpurja_verification_split.sql
-- Description: Split Lalpurja self-declaration from official administrative verification.
-- Hardens property update RLS to prevent unauthorized privilege escalation.
-- Hardens storage upload RLS with user folder prefix isolation.
-- ==============================================================================

-- 1. Add verification columns to public.properties
ALTER TABLE public.properties 
    ADD COLUMN IF NOT EXISTS owner_declared_lalpurja BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN DEFAULT FALSE;

-- 2. Migrate existing self-reported data to owner_declared_lalpurja
-- Existing records have not undergone administrative cadastral verification, so admin_verified remains FALSE.
UPDATE public.properties 
SET owner_declared_lalpurja = COALESCE(lalpurja_verified, FALSE),
    admin_verified = FALSE,
    lalpurja_verified = FALSE;

-- 3. Trigger to keep lalpurja_verified column synced with admin_verified for backwards compatibility
CREATE OR REPLACE FUNCTION public.sync_property_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize legacy lalpurja_verified column with official admin_verified status
    NEW.lalpurja_verified := COALESCE(NEW.admin_verified, FALSE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_property_verification_status ON public.properties;
CREATE TRIGGER trg_sync_property_verification_status
    BEFORE INSERT OR UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_property_verification_status();

-- 4. Harden Row Level Security on public.properties
DROP POLICY IF EXISTS "Owners can insert their properties" ON public.properties;
CREATE POLICY "Owners can insert their properties"
    ON public.properties
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id 
        AND (admin_verified IS FALSE OR admin_verified IS NULL)
    );

DROP POLICY IF EXISTS "Owners can update their properties" ON public.properties;
CREATE POLICY "Owners can update their properties"
    ON public.properties
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (
        auth.uid() = owner_id 
        AND (
            admin_verified IS NOT DISTINCT FROM (
                SELECT p.admin_verified 
                FROM public.properties p 
                WHERE p.id = properties.id
            )
        )
    );

-- 5. Harden storage.objects RLS for 'property-photos' bucket
-- Enforce user-isolated directory structure: property-photos/<user_id>/...
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

NOTIFY pgrst, 'reload schema';

