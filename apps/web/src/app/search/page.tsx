'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Home,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Coins,
  Check,
  Bed,
  Armchair,
  Users,
  Calendar,
  X,
  ChevronDown,
  Building,
} from 'lucide-react';
import {
  Property,
  PropertySubtype,
  Furnishing,
  PreferredTenant,
  ALL_NEPAL_DISTRICTS,
  getAuthDict,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';

type RentPreset = 'ALL' | 'UNDER_10K' | '10K_25K' | '25K_50K' | '50K_1L' | 'ABOVE_1L';
type BHKFilter = 'ALL' | 1 | 2 | 3 | 4;
type SortOption = 'newest' | 'rent_asc' | 'rent_desc';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authenticated user state & credits
  const [user, setUser] = useState<{ id: string; phone?: string; credits: number; userRole?: 'RENTER' | 'OWNER' | null; fullName?: string | null } | null>(null);

  // Listings data & state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User interactions
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [selectedUnlockProperty, setSelectedUnlockProperty] = useState<Property | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // NoBroker-style Filter States (Rent-Only)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [rentPreset, setRentPreset] = useState<RentPreset>('ALL');
  const [bhkFilter, setBhkFilter] = useState<BHKFilter>('ALL');
  const [subtypeFilter, setSubtypeFilter] = useState<PropertySubtype | 'ALL'>('ALL');
  const [furnishingFilter, setFurnishingFilter] = useState<Furnishing | 'ALL'>('ALL');
  const [tenantFilter, setTenantFilter] = useState<PreferredTenant | 'ALL'>('ALL');
  const [readyToMoveOnly, setReadyToMoveOnly] = useState(false);
  const [lalpurjaOnly, setLalpurjaOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Pagination State
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Mobile filters panel open state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync initial search parameters from URL
  useEffect(() => {
    const districtParam = searchParams.get('district');
    if (districtParam) {
      setSelectedDistrict(districtParam);
    }

    const subtypeParam = searchParams.get('subtype') as PropertySubtype | null;
    if (subtypeParam && ['HOUSE', 'FLAT', 'ROOM', 'SHOP'].includes(subtypeParam)) {
      setSubtypeFilter(subtypeParam);
    }

    const qParam = searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }

    const minRent = searchParams.get('min_rent');
    const maxRent = searchParams.get('max_rent');
    if (maxRent === '10000' && !minRent) {
      setRentPreset('UNDER_10K');
    } else if (minRent === '10000' && maxRent === '25000') {
      setRentPreset('10K_25K');
    } else if (minRent === '25000' && maxRent === '50000') {
      setRentPreset('25K_50K');
    } else if (minRent === '50000' && maxRent === '100000') {
      setRentPreset('50K_1L');
    } else if (minRent === '100000' && !maxRent) {
      setRentPreset('ABOVE_1L');
    }
  }, [searchParams]);

  // Load user session, credits, favorites and contact unlocks
  useEffect(() => {
    let isMounted = true;
    async function loadUserData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_role, full_name')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser({
            id: authUser.id,
            phone: authUser.phone,
            credits: sub?.credits_remaining ?? 15,
            userRole: profile?.user_role || null,
            fullName: profile?.full_name || null,
          });

          const { data: favs } = await supabase
            .from('property_favourites')
            .select('property_id')
            .eq('user_id', authUser.id);

          if (favs && isMounted) {
            setFavouriteIds(new Set(favs.map((f) => f.property_id)));
          }

          const { data: unlocks } = await supabase
            .from('contact_unlocks')
            .select('property_id')
            .eq('user_id', authUser.id);

          if (unlocks && isMounted) {
            setUnlockedIds(new Set(unlocks.map((u) => u.property_id)));
          }
        }
      } catch (err) {
        console.warn('Error loading user session on search page:', err);
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch properties from Supabase with server-side pagination & filtering
  const fetchProperties = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);

    const from = (targetPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      let query = supabase
        .from('properties')
        .select(
          `
          *,
          owner:profiles (
            id,
            full_name,
            phone_np,
            user_role,
            user_intent
          )
        `,
          { count: 'exact' }
        )
        .eq('status', 'ACTIVE')
        .eq('listing_type', 'RENT_HOUSE');

      // Server-side text search across locality, title, municipality, district
      const trimmedQ = searchQuery.trim().replace(/[%_]/g, '');
      if (trimmedQ) {
        query = query.or(
          `locality.ilike.%${trimmedQ}%,title.ilike.%${trimmedQ}%,district.ilike.%${trimmedQ}%,municipality.ilike.%${trimmedQ}%`
        );
      }

      // District Filter
      if (selectedDistrict !== 'ALL') {
        query = query.eq('district', selectedDistrict);
      }

      // Subtype Filter
      if (subtypeFilter !== 'ALL') {
        query = query.eq('property_subtype', subtypeFilter);
      }

      // Furnishing Filter
      if (furnishingFilter !== 'ALL') {
        query = query.eq('furnishing', furnishingFilter);
      }

      // Preferred Tenant Filter
      if (tenantFilter !== 'ALL') {
        query = query.eq('preferred_tenant', tenantFilter);
      }

      // BHK / Bedrooms Filter
      if (bhkFilter !== 'ALL') {
        if (bhkFilter === 4) {
          query = query.gte('bedrooms', 4);
        } else {
          query = query.eq('bedrooms', bhkFilter);
        }
      }

      // Ready to Move Filter
      if (readyToMoveOnly) {
        const todayStr = new Date().toISOString().split('T')[0];
        query = query.or(`available_from.is.null,available_from.lte.${todayStr}`);
      }

      // Lalpurja Admin-Verified Filter
      if (lalpurjaOnly) {
        query = query.eq('admin_verified', true);
      }

      // Monthly Rent Presets
      if (rentPreset === 'UNDER_10K') {
        query = query.lte('monthly_rent_npr', 10000);
      } else if (rentPreset === '10K_25K') {
        query = query.gte('monthly_rent_npr', 10000).lte('monthly_rent_npr', 25000);
      } else if (rentPreset === '25K_50K') {
        query = query.gte('monthly_rent_npr', 25000).lte('monthly_rent_npr', 50000);
      } else if (rentPreset === '50K_1L') {
        query = query.gte('monthly_rent_npr', 50000).lte('monthly_rent_npr', 100000);
      } else if (rentPreset === 'ABOVE_1L') {
        query = query.gt('monthly_rent_npr', 100000);
      }

      // Sorting
      if (sortBy === 'rent_asc') {
        query = query.order('monthly_rent_npr', { ascending: true });
      } else if (sortBy === 'rent_desc') {
        query = query.order('monthly_rent_npr', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      query = query.range(from, to);

      const { data, count, error: fetchErr } = await query;

      if (fetchErr) {
        console.warn('Rental properties query error:', fetchErr.message);
        setProperties([]);
        setTotalCount(0);
        return;
      }

      if (data) {
        setProperties(data as unknown as Property[]);
      } else {
        setProperties([]);
      }
      setTotalCount(count ?? 0);
    } catch (err: unknown) {
      console.error('Error fetching rentals:', err);
      setProperties([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedDistrict,
    subtypeFilter,
    furnishingFilter,
    tenantFilter,
    bhkFilter,
    readyToMoveOnly,
    lalpurjaOnly,
    rentPreset,
    sortBy,
  ]);

  // Re-fetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchProperties(1);
  }, [fetchProperties]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProperties(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('ALL');
    setRentPreset('ALL');
    setBhkFilter('ALL');
    setSubtypeFilter('ALL');
    setFurnishingFilter('ALL');
    setTenantFilter('ALL');
    setReadyToMoveOnly(false);
    setLalpurjaOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const handleToggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/auth');
      return;
    }

    const isFav = favouriteIds.has(propertyId);
    const nextFavs = new Set(favouriteIds);

    if (isFav) {
      nextFavs.delete(propertyId);
      setFavouriteIds(nextFavs);
      await supabase
        .from('property_favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
    } else {
      nextFavs.add(propertyId);
      setFavouriteIds(nextFavs);
      await supabase.from('property_favourites').insert({
        user_id: user.id,
        property_id: propertyId,
      });
    }
  };

  const handleOpenContactModal = (property: Property, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const isUnlocked = unlockedIds.has(property.id);
    setSelectedUnlockProperty({
      ...property,
      is_unlocked: isUnlocked,
    });
    setIsUnlockModalOpen(true);
  };

  const handleUnlockSuccess = (
    propId: string,
    details: { phone: string; name: string; creditsRemaining: number }
  ) => {
    setUnlockedIds((prev) => new Set(prev).add(propId));
    if (user) {
      setUser((prev) => (prev ? { ...prev, credits: details.creditsRemaining } : null));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      {/* 1. TOP NAVBAR */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
        currentUser={user ? { id: user.id, credits: user.credits, userRole: user.userRole } : null}
      />

      {/* ============================================================ */}
      {/* 2. SUBHEADER: Search Input & Mobile Filter Toggle            */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-slate-200 sticky top-18 sm:top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchProperties(1);
            }}
            className="relative flex-1 w-full"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Search by locality, ward, or landmark (e.g., Baluwatar, Baneshwor, Lakeside)...'
                  : 'टोल, वडा वा चोकको नाम खोज्नुहोस्...'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
            >
              {lang === 'en' ? 'Search' : 'खोज्नुहोस्'}
            </button>
          </form>

          {/* Controls: Mobile Filters Button & Sort Select */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-2xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Filters' : 'फिल्टरहरू'}</span>
            </button>

            <div className="relative w-48 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={lang === 'en' ? 'Sort rentals' : 'क्रमबद्ध गर्नुहोस्'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:border-emerald-600"
              >
                <option value="newest">{lang === 'en' ? 'Sort: Newest' : 'नयाँ पहिले'}</option>
                <option value="rent_asc">{lang === 'en' ? 'Rent: Low to High' : 'भाडा: सस्तो पहिले'}</option>
                <option value="rent_desc">{lang === 'en' ? 'Rent: High to Low' : 'भाडा: महँगो पहिले'}</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. TWO-COLUMN LAYOUT: NOBROKER LEFT FILTERS + RIGHT GRID     */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start gap-8">
          {/* ========================================================== */}
          {/* LEFT SIDEBAR: FILTERS (DESKTOP)                            */}
          {/* ========================================================== */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs sticky top-40 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {lang === 'en' ? 'Filters' : 'फिल्टरहरू'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'en' ? 'Reset' : 'रिसेट'}</span>
              </button>
            </div>

            {/* 1. Monthly Rent Range Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'en' ? 'Monthly Rent' : 'मासिक भाडा दर'}
              </label>
              <div className="space-y-1.5 text-xs font-medium text-slate-600">
                {[
                  { id: 'ALL', labelEn: 'Any Budget', labelNe: 'सबै बजेट' },
                  { id: 'UNDER_10K', labelEn: 'Under Rs. 10,000', labelNe: '१० हजार भन्दा कम' },
                  { id: '10K_25K', labelEn: 'Rs. 10,000 – 25,000', labelNe: '१० हजार – २५ हजार' },
                  { id: '25K_50K', labelEn: 'Rs. 25,000 – 50,000', labelNe: '२५ हजार – ५० हजार' },
                  { id: '50K_1L', labelEn: 'Rs. 50,000 – 1 Lakh', labelNe: '५० हजार – १ लाख' },
                  { id: 'ABOVE_1L', labelEn: 'Above Rs. 1 Lakh', labelNe: '१ लाख भन्दा माथि' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="radio"
                      name="rentPreset"
                      checked={rentPreset === item.id}
                      onChange={() => setRentPreset(item.id as RentPreset)}
                      className="text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. BHK / Bedrooms */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'en' ? 'BHK / Bedrooms' : 'कोठा संख्या (BHK)'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 1, label: '1 BHK' },
                  { id: 2, label: '2 BHK' },
                  { id: 3, label: '3 BHK' },
                ].map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    onClick={() => setBhkFilter(item.id as BHKFilter)}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all ${bhkFilter === item.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Property Subtype */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'en' ? 'Property Subtype' : 'सम्पत्ति प्रकार'}
              </label>
              <div className="space-y-1.5 text-xs font-medium text-slate-600">
                {[
                  { id: 'ALL', labelEn: 'All Subtypes', labelNe: 'सबै प्रकार' },
                  { id: 'ROOM', labelEn: 'Single Room (कोठा)', labelNe: 'कोठा' },
                  { id: 'FLAT', labelEn: 'Flat / Apartment (फ्ल्याट)', labelNe: 'फ्ल्याट' },
                  { id: 'HOUSE', labelEn: 'Independent House (घर)', labelNe: 'घर' },
                  { id: 'SHOP', labelEn: 'Commercial Shop (पसल)', labelNe: 'पसल / सटर' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="radio"
                      name="subtypeFilter"
                      checked={subtypeFilter === item.id}
                      onChange={() => setSubtypeFilter(item.id as PropertySubtype | 'ALL')}
                      className="text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Furnishing */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'en' ? 'Furnishing' : 'फर्निसिङ'}
              </label>
              <div className="space-y-1.5 text-xs font-medium text-slate-600">
                {[
                  { id: 'ALL', labelEn: 'Any Furnishing', labelNe: 'सबै' },
                  { id: 'FULLY', labelEn: 'Fully Furnished', labelNe: 'पूर्ण फर्निसिङ' },
                  { id: 'SEMI', labelEn: 'Semi Furnished', labelNe: 'आंशिक फर्निसिङ' },
                  { id: 'UNFURNISHED', labelEn: 'Unfurnished', labelNe: 'फर्निसिङ नभएको' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="radio"
                      name="furnishingFilter"
                      checked={furnishingFilter === item.id}
                      onChange={() => setFurnishingFilter(item.id as Furnishing | 'ALL')}
                      className="text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Preferred Tenant */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'en' ? 'Preferred Tenant' : 'प्राथमिकता भाडावाल'}
              </label>
              <div className="space-y-1.5 text-xs font-medium text-slate-600">
                {[
                  { id: 'ALL', labelEn: 'Any Tenant', labelNe: 'सबै' },
                  { id: 'FAMILY', labelEn: 'Family Only', labelNe: 'परिवार मात्र' },
                  { id: 'BACHELOR', labelEn: 'Bachelors / Students', labelNe: 'ब्याचलर / विद्यार्थी' },
                  { id: 'COMPANY', labelEn: 'Company / Corporate', labelNe: 'कम्पनी / संस्था' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                    <input
                      type="radio"
                      name="tenantFilter"
                      checked={tenantFilter === item.id}
                      onChange={() => setTenantFilter(item.id as PreferredTenant | 'ALL')}
                      className="text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 6. District Selector */}
            <div className="border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                {lang === 'en' ? 'District' : 'जिल्ला'}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">{lang === 'en' ? 'All 77 Districts' : 'नेपालका सबै जिल्लाहरू'}</option>
                {ALL_NEPAL_DISTRICTS.map((d) => (
                  <option key={d.nameEn} value={d.nameEn}>
                    {lang === 'ne' ? d.nameNe : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Lalpurja Verified Only Toggle */}
            <div className="border-t border-slate-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={lalpurjaOnly}
                  onChange={(e) => setLalpurjaOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Lalpurja Verified Only' : 'लालपुर्जा प्रमाणित मात्र'}</span>
                </span>
              </label>
            </div>
          </aside>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: RENTAL LISTINGS RESULTS GRID                 */}
          {/* ========================================================== */}
          <div className="flex-1 w-full">
            {/* Header info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {selectedDistrict !== 'ALL'
                    ? `${selectedDistrict} Rentals`
                    : lang === 'en'
                      ? 'Rental Properties in Nepal'
                      : 'नेपालमा घर तथा कोठा भाडा'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {lang === 'en'
                    ? `Showing ${properties.length} of ${totalCount} verified rentals • 0% Brokerage`
                    : `${totalCount} मध्ये ${properties.length} प्रमाणित भाडा सूचीहरू • ०% दलाली`}
                </p>
              </div>

              {(selectedDistrict !== 'ALL' ||
                rentPreset !== 'ALL' ||
                bhkFilter !== 'ALL' ||
                subtypeFilter !== 'ALL' ||
                furnishingFilter !== 'ALL' ||
                tenantFilter !== 'ALL' ||
                lalpurjaOnly ||
                searchQuery) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Reset Filters' : 'फिल्टर रिसेट'}</span>
                  </button>
                )}
            </div>

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs animate-pulse"
                  >
                    <div className="h-48 bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-6 bg-slate-200 rounded w-1/3" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              /* Clean Empty State */
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <Home className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'en' ? 'No Rental Listings Found' : 'कुनै भाडाको सूची फेला परेन'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {lang === 'en'
                      ? 'Try loosening your rent budget, choosing another district, or resetting the filters.'
                      : 'कृपया फरक बजेट वा जिल्ला छनोट गर्नुहोस्।'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                >
                  {lang === 'en' ? 'View All Rentals' : 'सबै भाडाका सूची हेर्नुहोस्'}
                </button>
              </div>
            ) : (
              <>
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      isFavourite={favouriteIds.has(prop.id)}
                      isUnlocked={unlockedIds.has(prop.id)}
                      onToggleFavourite={handleToggleFavorite}
                      onUnlock={handleOpenContactModal}
                      lang={lang}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {lang === 'en' ? 'Previous' : 'अघिल्लो'}
                    </button>

                    <span className="text-xs font-bold text-slate-600 px-3">
                      {lang === 'en'
                        ? `Page ${currentPage} of ${totalPages}`
                        : `पृष्ठ ${currentPage} को ${totalPages}`}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {lang === 'en' ? 'Next' : 'पछिल्लो'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Contact Unlock Modal */}
      {selectedUnlockProperty && (
        <ContactUnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
          property={selectedUnlockProperty}
          currentUser={user}
          onUnlockSuccess={handleUnlockSuccess}
          lang={lang}
        />
      )}

      {/* 4. FOOTER */}
      <Footer lang={lang} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
