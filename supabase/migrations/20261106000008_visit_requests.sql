-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT
-- Migration: 20261106000008_visit_requests.sql
-- Description: Schedule a visit requests table, RLS, and status updates
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.property_visit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    renter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    visit_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.property_visit_requests ENABLE ROW LEVEL SECURITY;

-- 1. Renters can insert visit requests for properties (requires user_role = 'RENTER')
DROP POLICY IF EXISTS "Renters can create visit requests" ON public.property_visit_requests;
CREATE POLICY "Renters can create visit requests"
    ON public.property_visit_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = renter_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND user_role = 'RENTER'
        )
    );

-- 2. Renters can view visit requests they created
DROP POLICY IF EXISTS "Renters can view their visit requests" ON public.property_visit_requests;
CREATE POLICY "Renters can view their visit requests"
    ON public.property_visit_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = renter_id);

-- 3. Owners can view visit requests for their properties
DROP POLICY IF EXISTS "Owners can view visit requests for their properties" ON public.property_visit_requests;
CREATE POLICY "Owners can view visit requests for their properties"
    ON public.property_visit_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

-- 4. Owners can update status (CONFIRMED/DECLINED) of visit requests for their properties
DROP POLICY IF EXISTS "Owners can update visit request status" ON public.property_visit_requests;
CREATE POLICY "Owners can update visit request status"
    ON public.property_visit_requests
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_visit_requests_owner ON public.property_visit_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_renter ON public.property_visit_requests(renter_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_property ON public.property_visit_requests(property_id);

NOTIFY pgrst, 'reload schema';

