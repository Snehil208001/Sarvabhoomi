-- ==============================================================================
-- 🇳🇵 Sarvabhoomi Storage Bucket Setup
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Create the public bucket for property photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-photos',
    'property-photos',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Allow public read access to property photos
DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public can view property photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'property-photos');

-- 3. Allow authenticated users to upload photos into their own folder (user_id/...)
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'property-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 4. Allow authenticated users to update their own photos
DROP POLICY IF EXISTS "Authenticated users can update their property photos" ON storage.objects;
CREATE POLICY "Authenticated users can update their property photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'property-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 5. Allow authenticated users to delete their own photos
DROP POLICY IF EXISTS "Authenticated users can delete their property photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete their property photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'property-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

NOTIFY pgrst, 'reload schema';
