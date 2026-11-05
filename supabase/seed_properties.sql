-- ==============================================================================
-- SARVABHOOMI CAPITAL & INVESTMENT — SEED PROPERTIES DATASET
-- 12 Realistic Active Listings across Kathmandu Valley, Pokhara, Terai
-- Label: SEED DATA ONLY (Unsplash Architecture Real Estate Placeholders)
-- ==============================================================================

DO $$
DECLARE
    v_owner_1 UUID;
    v_owner_2 UUID;
    v_owner_3 UUID;
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

        INSERT INTO public.profiles (id, phone_np, full_name, user_intent, preferred_region, preferred_district, is_onboarded)
        VALUES (
            v_owner_1,
            '+9779841000001',
            'Hari Prasad Sharma',
            'OWNER',
            'HILLY',
            'Kathmandu',
            true
        ) ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_onboarded = true;
    END IF;

    -- Clean existing seed entries if re-run
    DELETE FROM public.properties WHERE title LIKE '%[Seed]%' OR title LIKE '%(Verified Owner)%';

    -- 1. Budhanilkantha Residential Land (Kathmandu)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        'Prime 4.25 Aana Residential Ghaderi near Golfutar',
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
        true,
        'KITTA-402',
        ARRAY[
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 2. Imadol Modern House (Lalitpur)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, bedrooms, bathrooms, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        'Brand New 2.5 Storey Contemporary Villa in Imadol',
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
        true,
        'KITTA-118',
        ARRAY[
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 3. New Baneshwor Commercial Building / Land (Kathmandu)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        'Commercial Land Plot on Main Road in New Baneshwor',
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
        true,
        'KITTA-88',
        ARRAY[
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 4. Pokhara Lakeside Tourism Plot (Kaski)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '1 Ropani Panoramic Annapurna View Land at Lakeside',
        'Spectacular 1 Ropani plot located in quiet upper Lakeside elevation. Direct, unobstructed views of Phewa Lake and Annapurna Range. Optimal for luxury boutique resort, yoga retreat, or premium holiday villa. 20 ft wide blacktopped road access.',
        'BUY_LAND',
        38000000,
        'Kaski',
        'Pokhara Metropolitan City',
        6,
        'Upper Lakeside, Pokhara',
        1.0,
        'ROPANI',
        5476.0,
        '20 ft Pitched',
        'WEST',
        true,
        'KITTA-521',
        ARRAY[
            'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 5. Bharatpur Residential / Agriculture Land (Chitwan)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '15 Kattha High-Yield Land Plot in Bharatpur',
        'Direct owner listing in rapidly expanding Bharatpur residential corridor. 15 Kattha (over 54,000 sq ft) fertile, level topography. 24 ft gravel access road, 3 km from Narayangarh center. Clear land registration ownership deeds.',
        'BUY_LAND',
        9500000,
        'Chitwan',
        'Bharatpur Metropolitan City',
        11,
        'Bhojad, Bharatpur',
        15.0,
        'KATTHA',
        54675.0,
        '24 ft Graveled',
        'SOUTH',
        true,
        'KITTA-903',
        ARRAY[
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 6. Butwal Highway Commercial Land (Rupandehi)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '10 Kattha Commercial Highway Plot in Kalikanagar',
        'Outstanding location fronting secondary arterial 40 ft road just off East-West highway. Ideal for showroom, warehouse, educational institute or logistics depot. Level land with all utility infrastructure.',
        'COMMERCIAL',
        21000000,
        'Rupandehi',
        'Butwal Sub-Metropolitan City',
        10,
        'Kalikanagar, Butwal',
        10.0,
        'KATTHA',
        36450.0,
        '40 ft Pitched',
        'SOUTH',
        false,
        'KITTA-774',
        ARRAY[
            'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 7. Suryabinayak Peaceful Ghaderi (Bhaktapur)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '4 Aana Residential Plot in Peaceful Suryabinayak Colony',
        'Direct owner sale. Located inside organized residential layout near Suryabinayak Temple forest. 14 ft concrete road, fresh water well, quiet green environment. 5 minutes drive to Araniko Highway.',
        'BUY_LAND',
        9800000,
        'Bhaktapur',
        'Suryabinayak Municipality',
        5,
        'Katunje, Suryabinayak',
        4.0,
        'AANA',
        1369.0,
        '14 ft Dhalan',
        'SOUTH',
        true,
        'KITTA-312',
        ARRAY[
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 8. Tokha Ready-to-Build Land (Kathmandu)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '3.5 Aana Square Plot in Tokha Chandeshwori Height',
        'Perfect square geometry plot with 16 ft blacktopped road access. Facing East with all-day sunlight. Soil tested and ready for immediate building permit approval from Tokha municipality.',
        'BUY_LAND',
        12500000,
        'Kathmandu',
        'Tokha Municipality',
        2,
        'Chandeshwori, Tokha',
        3.5,
        'AANA',
        1197.88,
        '16 ft Pitched',
        'EAST',
        true,
        'KITTA-208',
        ARRAY[
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 9. Sanepa Luxury Residence (Lalitpur)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, bedrooms, bathrooms, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        'Architectural 4 BHK Luxury Bungalow in Sanepa',
        'Built on 8 Aana land in the prestigious diplomatic enclave of Sanepa. High ceilings, Italian marble flooring, expansive lawn garden, guard house, and double garage. 20 ft pitched road with immediate connectivity to Jhamsikhel.',
        'BUY_HOUSE',
        65000000,
        'Lalitpur',
        'Lalitpur Metropolitan City',
        2,
        'Sanepa Heights, Lalitpur',
        8.0,
        'AANA',
        2738.0,
        '20 ft Pitched',
        'NORTH_EAST',
        4,
        5,
        true,
        'KITTA-14',
        ARRAY[
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 10. Biratnagar Industrial / Commercial Land (Morang)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '1 Bigha Commercial Parcel on Biratnagar Ring Road',
        'Huge 1 Bigha (72,900 sq ft) parcel on 30 ft pitched road. High commercial visibility, 3-phase dedicated electricity line, suitable for manufacturing unit, cold storage, or educational campus.',
        'COMMERCIAL',
        35000000,
        'Morang',
        'Biratnagar Metropolitan City',
        4,
        'Ring Road, Biratnagar',
        1.0,
        'BIGHA',
        72900.0,
        '30 ft Pitched',
        'EAST',
        true,
        'KITTA-1002',
        ARRAY[
            'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 11. Dhulikhel Resort / Villa Land (Kavre)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '2 Ropani Resort / Second-Home Plot in Dhulikhel',
        'Unmatched Himalayan sunrise view extending from Langtang to Everest range. Gently terraced 2 Ropani land with 16 ft road access, natural water spring nearby, and tranquil forest surroundings.',
        'BUY_LAND',
        18000000,
        'Kavrepalanchok',
        'Dhulikhel Municipality',
        3,
        'Bhattedada, Dhulikhel',
        2.0,
        'ROPANI',
        10952.0,
        '16 ft Pitched',
        'NORTH',
        true,
        'KITTA-661',
        ARRAY[
            'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );

    -- 12. Bhaisepati Modern Villa for Rent / Sale (Lalitpur)
    INSERT INTO public.properties (
        owner_id, title, description, listing_type, price_npr, district, municipality, ward, locality,
        area_value, area_unit, area_sqft, road_access, facing, bedrooms, bathrooms, lalpurja_verified, kitta_no, photos, status
    ) VALUES (
        v_owner_1,
        '3 BHK Modern Villa with Garden in Bhaisepati',
        'Beautifully furnished residence in safe, secured colony in Bhaisepati. 3 master bedrooms with attached baths, open plan living-dining, private lawn, rooftop terrace with panoramic valley view. 16 ft blacktopped road.',
        'RENT_HOUSE',
        125000,
        'Lalitpur',
        'Karyabinayak Municipality',
        1,
        'Radio Nepal Area, Bhaisepati',
        4.0,
        'AANA',
        1369.0,
        '16 ft Pitched',
        'WEST',
        3,
        3,
        true,
        'KITTA-84',
        ARRAY[
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
        'ACTIVE'
    );
END $$;

