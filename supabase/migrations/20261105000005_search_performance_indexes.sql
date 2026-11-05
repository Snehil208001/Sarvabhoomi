-- ==============================================================================
-- Migration: 20261105000005_search_performance_indexes.sql
-- Description: Composite and partial indexes for high-throughput marketplace search
-- ==============================================================================

-- Enable trigram extension for fast text search on locality and title
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Primary composite search index covering status, listing_type, district, and price
CREATE INDEX IF NOT EXISTS idx_properties_search 
    ON public.properties (status, listing_type, district, price_npr);

-- 2. Partial indexes for verified and claimed Lalpurja properties
CREATE INDEX IF NOT EXISTS idx_properties_admin_verified 
    ON public.properties (admin_verified) 
    WHERE admin_verified = TRUE;

CREATE INDEX IF NOT EXISTS idx_properties_owner_declared 
    ON public.properties (owner_declared_lalpurja) 
    WHERE owner_declared_lalpurja = TRUE;

-- 3. Trigram GIN indexes for fast server-side ILIKE text search on locality and title
CREATE INDEX IF NOT EXISTS idx_properties_locality_trgm 
    ON public.properties USING gin (locality gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_title_trgm 
    ON public.properties USING gin (title gin_trgm_ops);

-- 4. Fast composite index on owner_id and created_at for dashboard listings
CREATE INDEX IF NOT EXISTS idx_properties_owner_created 
    ON public.properties (owner_id, created_at DESC);

NOTIFY pgrst, 'reload schema';

