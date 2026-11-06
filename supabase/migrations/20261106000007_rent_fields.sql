-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT
-- Migration: 20261106000007_rent_fields.sql
-- Description: Add specialized rental fields, backfill monthly_rent_npr,
--              and create performance indexes for rental discovery.
-- ==============================================================================

-- 1. Add rental fields to properties table
ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS monthly_rent_npr NUMERIC,
    ADD COLUMN IF NOT EXISTS deposit_npr NUMERIC,
    ADD COLUMN IF NOT EXISTS maintenance_npr NUMERIC,
    ADD COLUMN IF NOT EXISTS maintenance_included BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS furnishing TEXT CHECK (furnishing IN ('FULLY', 'SEMI', 'UNFURNISHED')),
    ADD COLUMN IF NOT EXISTS property_subtype TEXT CHECK (property_subtype IN ('HOUSE', 'FLAT', 'ROOM', 'SHOP')),
    ADD COLUMN IF NOT EXISTS preferred_tenant TEXT CHECK (preferred_tenant IN ('FAMILY', 'BACHELOR', 'BACHELOR_MALE', 'BACHELOR_FEMALE', 'COMPANY', 'ANY')),
    ADD COLUMN IF NOT EXISTS available_from DATE,
    ADD COLUMN IF NOT EXISTS floor_no INT,
    ADD COLUMN IF NOT EXISTS total_floors INT,
    ADD COLUMN IF NOT EXISTS parking BOOLEAN;

-- 2. Backfill monthly_rent_npr from price_npr for all existing rent listings
UPDATE public.properties
SET monthly_rent_npr = price_npr
WHERE listing_type = 'RENT_HOUSE' AND monthly_rent_npr IS NULL;

-- 3. Constraint: For ACTIVE rental listings, monthly_rent_npr must not be null and > 0
ALTER TABLE public.properties
    ADD CONSTRAINT chk_rent_monthly_amount
    CHECK (listing_type != 'RENT_HOUSE' OR (monthly_rent_npr IS NOT NULL AND monthly_rent_npr > 0));

-- 4. Composite indexes for fast rent search and filtering
CREATE INDEX IF NOT EXISTS idx_properties_status_monthly_rent 
    ON public.properties (status, monthly_rent_npr);

CREATE INDEX IF NOT EXISTS idx_properties_status_district_rent 
    ON public.properties (status, district, monthly_rent_npr);

CREATE INDEX IF NOT EXISTS idx_properties_subtype 
    ON public.properties (property_subtype);

CREATE INDEX IF NOT EXISTS idx_properties_furnishing 
    ON public.properties (furnishing);

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
