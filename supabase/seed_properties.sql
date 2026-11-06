-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT — SEED PROPERTIES DATASET
-- 6 Active Rent Listings across Kathmandu, Lalitpur, Pokhara, Chitwan, Butwal
-- Historical BUY/COMMERCIAL rows marked as PAUSED per rent-only pivot
-- Label: [Seed] (Unsplash Architecture Real Estate Placeholders)
-- ==============================================================================

DO $$
DECLARE
    v_owner_1 UUID;
BEGIN
    -- Look for any existing real user profile to anchor seed properties
    SELECT id INTO v_owner_1 FROM public.profiles LIMIT 1;

    -- If no profile exists, create a deterministic demo owner
    IF v_owner_1 IS NULL THEN
        v_owner_1 := 'a0000000-0000-0000-0000-000000000001'::uuid;
        
        INSERT INTO auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, created_at, updated_at)
        VALUES (
            v_owner_1,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated',
            '+9779841000001',
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.profiles (id, phone_np, full_name, user_role, user_intent, preferred_region, preferred_district, is_onboarded)
        VALUES (
            v_owner_1,
            '+9779841000001',
            'Hari Prasad Sharma',
            'OWNER',
            'OWNER',
            'HILLY',
            'Kathmandu',
            true
        ) ON CONFLICT (id) DO UPDATE SET user_role = 'OWNER', full_name = EXCLUDED.full_name, is_onboarded = true;
    END IF;

    -- Clean existing seed entries if re-run
    DELETE FROM public.properties WHERE title LIKE '%[Seed]%' OR title LIKE '%(Verified Owner)%';

    -- ==========================================================================
    -- HISTORICAL NON-RENT SEED LISTINGS (PAUSED PER RENT-ONLY PIVOT)
    -- ==========================================================================

    -- 1. Budhanilkantha Residential Land (Kathmandu) - PAUSED
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] Prime 4.25 Aana Residential Ghaderi near Golfutar',
        'Direct owner sale. Peaceful VIP residential height with unobstructed view of Shivapuri National Park. 16 ft blacktopped road access, water pipeline, 3-phase electricity available. Pure rectangular plot ideal for immediate bungalow construction. Cadastral map certified.',
        'BUY_LAND',
        14500000,
        'Kathmandu',
        'Budhanilkantha Municipality',
        3,
        'Golfutar, Budhanilkantha',
        4.25,
        'AANA',
        1454.56,
        '16 ft Pitched',
        'EAST',
        true, true, true,
        'KITTA-402',
        ARRAY[
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        'PAUSED'
    );

    -- 2. Imadol Modern House (Lalitpur) - PAUSED
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] Brand New 2.5 Storey Contemporary Villa in Imadol',
        'Newly constructed earthquake-resistant pillar system house built on 3.75 Aana land. Semi-furnished with modular kitchen, false ceiling, solar water heating, and parking for 1 SUV + 3 bikes. 13 ft concrete road, 800m from Gwarko Ring Road junction.',
        'BUY_HOUSE',
        27500000,
        'Lalitpur',
        'Mahalaxmi Municipality',
        4,
        'Sheetal Height, Imadol',
        3.75,
        'AANA',
        1283.44,
        '13 ft Dhalan',
        'SOUTH_EAST',
        4,
        4,
        true, true, true,
        'KITTA-118',
        ARRAY[
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
        ],
        'PAUSED'
    );

    -- 3. New Baneshwor Commercial Building / Land (Kathmandu) - PAUSED
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] Commercial Land Plot on Main Road in New Baneshwor',
        'Rare 8 Aana prime commercial parcel situated just 150m from Baneshwor Chowk. High footfall commercial belt suitable for corporate bank branch, IT office, clinic, or high-yield commercial complex. 32 ft wide blacktopped road.',
        'COMMERCIAL',
        52000000,
        'Kathmandu',
        'Kathmandu Metropolitan City',
        10,
        'Madan Bhandari Road, New Baneshwor',
        8.0,
        'AANA',
        2738.0,
        '32 ft Pitched',
        'NORTH',
        true, false, false,
        'KITTA-88',
        ARRAY[
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
        ],
        'PAUSED'
    );

    -- ==========================================================================
    -- 6 ACTIVE RENTAL SEED LISTINGS (RENT_HOUSE)
    -- ==========================================================================

    -- RENT 1. Bhaisepati Modern Furnished Villa (Lalitpur)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, monthly_rent_npr, deposit_npr, maintenance_npr, maintenance_included,
        furnishing, property_subtype, preferred_tenant, available_from, floor_no, total_floors, parking,
        district, municipality, ward, locality, area_value, area_unit, area_sqft, road_access, facing,
        bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] 3 BHK Modern Furnished Villa with Private Garden in Bhaisepati',
        'Beautifully furnished independent residence in safe, secured colony in Bhaisepati. 3 master bedrooms with attached baths, open plan living-dining, private lawn, rooftop terrace with panoramic valley view. 16 ft blacktopped road. Ideal for diplomats and expat families.',
        'RENT_HOUSE',
        125000, 125000, 250000, 5000, false,
        'FULLY', 'HOUSE', 'FAMILY', '2026-12-01', 1, 3, true,
        'Lalitpur', 'Karyabinayak Municipality', 1, 'Radio Nepal Area, Bhaisepati',
        4.0, 'AANA', 1369.0, '16 ft Pitched', 'WEST',
        3, 3, true, true, true, 'KITTA-84',
        ARRAY[
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- RENT 2. Baluwatar Sunlit Modern 2 BHK Flat (Kathmandu)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, monthly_rent_npr, deposit_npr, maintenance_npr, maintenance_included,
        furnishing, property_subtype, preferred_tenant, available_from, floor_no, total_floors, parking,
        district, municipality, ward, locality, area_value, area_unit, area_sqft, road_access, facing,
        bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] 2 BHK Sunlit Modern Flat near Russian Embassy, Baluwatar',
        'Peaceful residential flat on 2nd floor with abundant natural sunlight, modular kitchen, solar backup, dedicated car parking, and 24-hr clean boring water. Within 5 minutes walk from Prime Minister Residence and embassies.',
        'RENT_HOUSE',
        45000, 45000, 90000, 2500, true,
        'SEMI', 'FLAT', 'FAMILY', '2026-11-15', 2, 4, true,
        'Kathmandu', 'Kathmandu Metropolitan City', 4, 'Baluwatar Embassy Zone',
        950, 'SQFT', 950.0, '20 ft Pitched', 'SOUTH',
        2, 2, true, true, true, 'KITTA-209',
        ARRAY[
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- RENT 3. New Baneshwor Single Room with Attached Bath (Kathmandu)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, monthly_rent_npr, deposit_npr, maintenance_npr, maintenance_included,
        furnishing, property_subtype, preferred_tenant, available_from, floor_no, total_floors, parking,
        district, municipality, ward, locality, area_value, area_unit, area_sqft, road_access, facing,
        bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] Clean Single Room with Attached Bath near Baneshwor Chowk',
        'Spacious, freshly painted room on 3rd floor with private attached bathroom and separate balcony. High-speed WiFi, shared terrace, 24-hr water supply. Ideal for working professionals or serious students near Civil Hospital.',
        'RENT_HOUSE',
        14000, 14000, 14000, 500, true,
        'SEMI', 'ROOM', 'BACHELOR', '2026-11-10', 3, 4, false,
        'Kathmandu', 'Kathmandu Metropolitan City', 10, 'Prayag Marg, New Baneshwor',
        250, 'SQFT', 250.0, '12 ft Dhalan', 'EAST',
        1, 1, true, false, false, 'KITTA-312',
        ARRAY[
            'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- RENT 4. Pokhara Lakeside 2 BHK Lakeview Apartment (Kaski)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, monthly_rent_npr, deposit_npr, maintenance_npr, maintenance_included,
        furnishing, property_subtype, preferred_tenant, available_from, floor_no, total_floors, parking,
        district, municipality, ward, locality, area_value, area_unit, area_sqft, road_access, facing,
        bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] 2 BHK Lakeview Furnished Apartment in Lakeside Center',
        'Stunning uninterrupted view of Phewa Lake and Peace Pagoda. Fully furnished with European kitchen, AC in bedrooms, high-speed fiber internet, and dedicated covered scooter/bike parking. 2 minutes walk to Lake promenade.',
        'RENT_HOUSE',
        38000, 38000, 76000, 2000, false,
        'FULLY', 'FLAT', 'ANY', '2026-12-01', 3, 5, true,
        'Kaski', 'Pokhara Metropolitan City', 6, 'Lakeside Baidam, Pokhara',
        850, 'SQFT', 850.0, '16 ft Pitched', 'SOUTH_WEST',
        2, 2, true, true, true, 'KITTA-145',
        ARRAY[
            'https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1502005229762-ee1b2da97a06?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- RENT 5. Bharatpur Ground Floor Commercial Shutter (Chitwan)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, monthly_rent_npr, deposit_npr, maintenance_npr, maintenance_included,
        furnishing, property_subtype, preferred_tenant, available_from, floor_no, total_floors, parking,
        district, municipality, ward, locality, area_value, area_unit, area_sqft, road_access, facing,
        bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] Main Road Commercial Shutter & Showroom Space in Bharatpur',
        'Prime road-facing commercial space on ground floor with 2 heavy shutters, attached restroom, and wide customer parking front. Ideal for pharmacy, diagnostic lab, grocery store, hardware, or corporate brand outlet on Lion Chowk corridor.',
        'RENT_HOUSE',
        28000, 28000, 100000, 0, true,
        'UNFURNISHED', 'SHOP', 'COMPANY', '2026-11-20', 0, 3, true,
        'Chitwan', 'Bharatpur Metropolitan City', 10, 'Lions Chowk, Bharatpur',
        450, 'SQFT', 450.0, '40 ft Highway', 'NORTH',
        0, 1, true, true, true, 'KITTA-512',
        ARRAY[
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- RENT 6. Butwal Golpark 3 BHK Independent Upper Flat (Rupandehi)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, monthly_rent_npr, deposit_npr, maintenance_npr, maintenance_included,
        furnishing, property_subtype, preferred_tenant, available_from, floor_no, total_floors, parking,
        district, municipality, ward, locality, area_value, area_unit, area_sqft, road_access, facing,
        bedrooms, bathrooms, owner_declared_lalpurja, admin_verified, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '[Seed] 3 BHK Independent Upper Flat with Terrace in Golpark, Butwal',
        'Airy and spacious residential flat with 3 bedrooms, large living hall, kitchen with dining space, separate pooja room, and private rooftop access. Located in quiet family neighborhood 300m inside Siddhartha Highway.',
        'RENT_HOUSE',
        22000, 22000, 44000, 1000, true,
        'UNFURNISHED', 'FLAT', 'FAMILY', '2026-11-25', 1, 2, true,
        'Rupandehi', 'Butwal Sub-Metropolitan City', 3, 'Golpark Residential Area, Butwal',
        1100, 'SQFT', 1100.0, '14 ft Concrete', 'EAST',
        3, 2, true, true, true, 'KITTA-673',
        ARRAY[
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );
END $$;
