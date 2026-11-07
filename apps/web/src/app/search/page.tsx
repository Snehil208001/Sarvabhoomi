'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Home,
  ShieldCheck,
  RotateCcw,
  ArrowUpDown,
  X,
} from 'lucide-react';
import {
  Property,
  PropertySubtype,
  Furnishing,
  PreferredTenant,
  ALL_NEPAL_DISTRICTS,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';
import { ScrollReveal } from '@/components/ui/Motion';

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

  // User interactions
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [selectedUnlockProperty, setSelectedUnlockProperty] = useState<Property | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Filter States (Rent-Only)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [rentPreset, setRentPreset] = useState<RentPreset>('ALL');
  const [bhkFilter, setBhkFilter] = useState<BHKFilter>('ALL');
  const [subtypeFilter, setSubtypeFilter] = useState<PropertySubtype | 'ALL'>('ALL');
  const [furnishingFilter, setFurnishingFilter] = useState<Furnishing | 'ALL'>('ALL');
  const [tenantFilter, setTenantFilter] = useState<PreferredTenant | 'ALL'>('ALL');
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
    if (maxRent === '10000') setRentPreset('UNDER_10K');
    else if (minRent === '10000' && maxRent === '25000') setRentPreset('10K_25K');
    else if (minRent === '25000' && maxRent === '50000') setRentPreset('25K_50K');
    else if (minRent === '50000' && maxRent === '100000') setRentPreset('50K_1L');
    else if (minRent === '100000') setRentPreset('ABOVE_1L');
  }, [searchParams]);

  // Auth & user credits
  useEffect(() => {
    let isMounted = true;
    async function initUser() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone_np, user_role')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          const { data: favs } = await supabase
            .from('property_favourites')
            .select('property_id')
            .eq('user_id', authUser.id);

          const { data: unlocks } = await supabase
            .from('contact_unlocks')
            .select('property_id')
            .eq('user_id', authUser.id);

          setUser({
            id: authUser.id,
            phone: profile?.phone_np || authUser.phone,
            fullName: profile?.full_name || null,
            credits: sub?.credits_remaining ?? 15,
            userRole: profile?.user_role || null,
          });

          if (favs) {
            setFavouriteIds(new Set(favs.map((f) => f.property_id)));
          }
          if (unlocks) {
            setUnlockedIds(new Set(unlocks.map((u) => u.property_id)));
          }
        }
      } catch (err) {
        console.warn('Auth check notice:', err);
      }
    }

    initUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Rent Listings
  const fetchProperties = useCallback(
    async (pageToFetch = 1) => {
      setLoading(true);

      try {
        let query = supabase
          .from('properties')
          .select('*', { count: 'exact' })
          .eq('status', 'ACTIVE')
          .eq('listing_type', 'RENT_HOUSE');

        if (selectedDistrict && selectedDistrict !== 'ALL') {
          query = query.eq('district', selectedDistrict);
        }

        if (subtypeFilter !== 'ALL') {
          query = query.eq('property_subtype', subtypeFilter);
        }

        if (bhkFilter !== 'ALL') {
          query = query.eq('bedrooms', bhkFilter);
        }

        if (furnishingFilter !== 'ALL') {
          query = query.eq('furnishing', furnishingFilter);
        }

        if (tenantFilter !== 'ALL') {
          query = query.eq('preferred_tenant', tenantFilter);
        }

        if (lalpurjaOnly) {
          query = query.eq('admin_verified', true);
        }

        // Budget filters
        if (rentPreset === 'UNDER_10K') {
          query = query.lte('monthly_rent_npr', 10000);
        } else if (rentPreset === '10K_25K') {
          query = query.gte('monthly_rent_npr', 10000).lte('monthly_rent_npr', 25000);
        } else if (rentPreset === '25K_50K') {
          query = query.gte('monthly_rent_npr', 25000).lte('monthly_rent_npr', 50000);
        } else if (rentPreset === '50K_1L') {
          query = query.gte('monthly_rent_npr', 50000).lte('monthly_rent_npr', 100000);
        } else if (rentPreset === 'ABOVE_1L') {
          query = query.gte('monthly_rent_npr', 100000);
        }

        if (searchQuery.trim()) {
          query = query.ilike('locality', `%${searchQuery.trim()}%`);
        }

        // Sorting
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'rent_asc') {
          query = query.order('monthly_rent_npr', { ascending: true });
        } else if (sortBy === 'rent_desc') {
          query = query.order('monthly_rent_npr', { ascending: false });
        }

        const from = (pageToFetch - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data, count, error: qErr } = await query;

        if (qErr) {
          console.error('Error fetching rentals:', qErr);
          setProperties([]);
          setTotalCount(0);
        } else {
          setProperties((data as Property[]) || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error('Fetch exception:', err);
      } finally {
        setLoading(false);
      }
    },
    [
      selectedDistrict,
      subtypeFilter,
      bhkFilter,
      furnishingFilter,
      tenantFilter,
      lalpurjaOnly,
      rentPreset,
      searchQuery,
      sortBy,
      PAGE_SIZE,
    ]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchProperties(1);
  }, [
    selectedDistrict,
    subtypeFilter,
    bhkFilter,
    furnishingFilter,
    tenantFilter,
    lalpurjaOnly,
    rentPreset,
    sortBy,
    fetchProperties,
  ]);

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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      {/* 1. TOP NAVBAR */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
        currentUser={user ? { id: user.id, credits: user.credits, userRole: user.userRole } : null}
      />

      {/* ============================================================ */}
      {/* 2. SUBHEADER: Search Input & Controls                        */}
      {/* ============================================================ */}
      <section className="bg-black/95 border-b border-gold/30 sticky top-18 sm:top-20 z-30 shadow-subtle backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                  ? 'Search by locality, ward, or landmark (e.g., Baluwatar, Pulchowk, Lakeside)...'
                  : 'टोल, वडा वा चोकको नाम खोज्नुहोस्...'
              }
              className="w-full bg-black/60 border border-white/20 rounded-2xl pl-11 pr-28 py-3 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
            <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs font-black transition-all active:scale-97"
            >
              {lang === 'en' ? 'Search' : 'खोज्नुहोस्'}
            </button>
          </form>

          {/* Controls: Mobile Filters Button & Sort Select */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-white/20 bg-white/5 text-xs font-black text-white hover:bg-white/10 shadow-subtle min-h-touch"
            >
              <SlidersHorizontal className="w-4 h-4 text-gold stroke-[2.5]" />
              <span>{lang === 'en' ? 'Filters' : 'फिल्टरहरू'}</span>
            </button>

            <div className="relative w-48 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={lang === 'en' ? 'Sort rentals' : 'क्रमबद्ध गर्नुहोस्'}
                className="w-full bg-black/60 border border-white/20 rounded-2xl px-3.5 py-3 text-xs font-bold text-white appearance-none focus:outline-none focus:border-gold min-h-touch"
              >
                <option value="newest" className="bg-black text-white">{lang === 'en' ? 'Sort: Newest' : 'नयाँ पहिले'}</option>
                <option value="rent_asc" className="bg-black text-white">{lang === 'en' ? 'Rent: Low to High' : 'भाडा: सस्तो पहिले'}</option>
                <option value="rent_desc" className="bg-black text-white">{lang === 'en' ? 'Rent: High to Low' : 'भाडा: महँगो पहिले'}</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-gold absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. TWO-COLUMN LAYOUT: FILTERS + RESULTS GRID                 */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start gap-8">
          {/* ========================================================== */}
          {/* LEFT SIDEBAR: FILTERS (DESKTOP)                            */}
          {/* ========================================================== */}
          <aside className="hidden lg:block w-72 shrink-0 bg-white/[0.06] border border-gold/30 rounded-3xl p-6 shadow-card sticky top-44 space-y-6 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold stroke-[2.5]" />
                <h3 className="font-black text-sm text-gold uppercase tracking-wider">
                  {lang === 'en' ? 'Filters' : 'फिल्टरहरू'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-white/70 hover:text-gold transition-colors font-black flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'en' ? 'Reset' : 'रिसेट'}</span>
              </button>
            </div>

            {/* 1. Monthly Rent Range Presets */}
            <div>
              <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                {lang === 'en' ? 'Monthly Rent' : 'मासिक भाडा दर'}
              </label>
              <div className="space-y-2 text-xs font-semibold text-white/70">
                {[
                  { id: 'ALL', labelEn: 'Any Budget', labelNe: 'सबै बजेट' },
                  { id: 'UNDER_10K', labelEn: 'Under Rs. 10,000', labelNe: '१० हजार भन्दा कम' },
                  { id: '10K_25K', labelEn: 'Rs. 10,000 – 25,000', labelNe: '१० हजार – २५ हजार' },
                  { id: '25K_50K', labelEn: 'Rs. 25,000 – 50,000', labelNe: '२५ हजार – ५० हजार' },
                  { id: '50K_1L', labelEn: 'Rs. 50,000 – 1 Lakh', labelNe: '५० हजार – १ लाख' },
                  { id: 'ABOVE_1L', labelEn: 'Above Rs. 1 Lakh', labelNe: '१ लाख भन्दा माथि' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                    <input
                      type="radio"
                      name="rentPreset"
                      checked={rentPreset === item.id}
                      onChange={() => setRentPreset(item.id as RentPreset)}
                      className="accent-gold w-3.5 h-3.5"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. BHK / Bedrooms */}
            <div className="border-t border-white/10 pt-5">
              <label className="block text-xs font-black text-white/90 mb-2.5 uppercase tracking-wider">
                {lang === 'en' ? 'BHK / Bedrooms' : 'कोठा संख्या (BHK)'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-black">
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
                    className={`py-2 px-2 rounded-xl text-center transition-all ${
                      bhkFilter === item.id
                        ? 'bg-gold text-black shadow-subtle'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Property Subtype */}
            <div className="border-t border-white/10 pt-5">
              <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                {lang === 'en' ? 'Property Subtype' : 'सम्पत्ति प्रकार'}
              </label>
              <div className="space-y-2 text-xs font-semibold text-white/70">
                {[
                  { id: 'ALL', labelEn: 'All Subtypes', labelNe: 'सबै प्रकार' },
                  { id: 'ROOM', labelEn: 'Single Room (कोठा)', labelNe: 'कोठा' },
                  { id: 'FLAT', labelEn: 'Flat / Apartment (फ्ल्याट)', labelNe: 'फ्ल्याट' },
                  { id: 'HOUSE', labelEn: 'Independent House (घर)', labelNe: 'घर' },
                  { id: 'SHOP', labelEn: 'Commercial Shop (पसल)', labelNe: 'पसल / सटर' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                    <input
                      type="radio"
                      name="subtypeFilter"
                      checked={subtypeFilter === item.id}
                      onChange={() => setSubtypeFilter(item.id as PropertySubtype | 'ALL')}
                      className="accent-gold w-3.5 h-3.5"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Furnishing */}
            <div className="border-t border-white/10 pt-5">
              <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                {lang === 'en' ? 'Furnishing' : 'फर्निसिङ'}
              </label>
              <div className="space-y-2 text-xs font-semibold text-white/70">
                {[
                  { id: 'ALL', labelEn: 'Any Furnishing', labelNe: 'सबै' },
                  { id: 'FULLY', labelEn: 'Fully Furnished', labelNe: 'पूर्ण फर्निसिङ' },
                  { id: 'SEMI', labelEn: 'Semi Furnished', labelNe: 'आंशिक फर्निसिङ' },
                  { id: 'UNFURNISHED', labelEn: 'Unfurnished', labelNe: 'फर्निसिङ नभएको' },
                ].map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 cursor-pointer hover:text-white">
                    <input
                      type="radio"
                      name="furnishingFilter"
                      checked={furnishingFilter === item.id}
                      onChange={() => setFurnishingFilter(item.id as Furnishing | 'ALL')}
                      className="accent-gold w-3.5 h-3.5"
                    />
                    <span>{lang === 'en' ? item.labelEn : item.labelNe}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. District Selector */}
            <div className="border-t border-white/10 pt-5">
              <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                {lang === 'en' ? 'District' : 'जिल्ला'}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-gold"
              >
                <option value="ALL" className="bg-black text-white">{lang === 'en' ? 'All 77 Districts' : 'नेपालका सबै जिल्लाहरू'}</option>
                {ALL_NEPAL_DISTRICTS.map((d) => (
                  <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                    {lang === 'ne' ? d.nameNe : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Lalpurja Verified Only Toggle */}
            <div className="border-t border-white/10 pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-black text-white">
                <input
                  type="checkbox"
                  checked={lalpurjaOnly}
                  onChange={(e) => setLalpurjaOnly(e.target.checked)}
                  className="rounded accent-gold w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gold stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Verified Lalpurja Only' : 'लालपुर्जा प्रमाणित मात्र'}</span>
                </span>
              </label>
            </div>
          </aside>

          {/* ========================================================== */}
          {/* RIGHT COLUMN: RENTAL LISTINGS RESULTS GRID                 */}
          {/* ========================================================== */}
          <div className="flex-1 w-full">
            {/* Header info */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gold tracking-tight">
                  {selectedDistrict !== 'ALL'
                    ? `${selectedDistrict} Rentals`
                    : lang === 'en'
                    ? 'Rental Properties in Nepal'
                    : 'नेपालमा घर तथा कोठा भाडा'}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 mt-1 font-medium">
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
                  className="text-xs text-white/70 hover:text-gold transition-colors font-black flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Reset Filters' : 'फिल्टर रिसेट'}</span>
                </button>
              )}
            </div>

            {/* Loading Shimmer Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white/[0.04] rounded-3xl border border-white/10 overflow-hidden shadow-subtle shimmer-box h-80"
                  />
                ))}
              </div>
            ) : properties.length === 0 ? (
              /* Clean Empty State */
              <div className="bg-white/[0.04] rounded-3xl border border-gold/30 p-14 text-center max-w-md mx-auto space-y-5 shadow-card">
                <div className="w-16 h-16 rounded-2xl bg-gold text-black flex items-center justify-center mx-auto shadow-subtle">
                  <Home className="w-8 h-8 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {lang === 'en' ? 'No Rentals Match Your Search' : 'कुनै भाडाको सूची फेला परेन'}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 mt-1.5 leading-relaxed font-medium">
                    {lang === 'en'
                      ? 'No rentals match — try widening the budget or district, or reset your filters.'
                      : 'कुनै भाडाको घर वा कोठा फेला परेन — कृपया बजेट वा जिल्ला परिवर्तन गर्नुहोस् वा फिल्टर रिसेट गर्नुहोस्।'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="py-3 px-6 rounded-2xl bg-gold hover:bg-gold/90 text-black font-black text-xs shadow-subtle transition-all active:scale-97"
                >
                  {lang === 'en' ? 'Reset Filters' : 'फिल्टरहरू रिसेट गर्नुहोस्'}
                </button>
              </div>
            ) : (
              <>
                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((prop, idx) => (
                    <ScrollReveal key={prop.id} delayMs={idx * 40}>
                      <PropertyCard
                        property={prop}
                        isFavourite={favouriteIds.has(prop.id)}
                        isUnlocked={unlockedIds.has(prop.id)}
                        onToggleFavourite={handleToggleFavorite}
                        onUnlock={handleOpenContactModal}
                        lang={lang}
                      />
                    </ScrollReveal>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      {lang === 'en' ? 'Previous' : 'अघिल्लो'}
                    </button>

                    <span className="text-xs font-black text-white/70 px-3 font-mono">
                      {lang === 'en'
                        ? `Page ${currentPage} of ${totalPages}`
                        : `पृष्ठ ${currentPage} को ${totalPages}`}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

      {/* Mobile Filters Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-black border-l border-gold/30 h-full p-6 overflow-y-auto space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-black text-base text-gold">
                {lang === 'en' ? 'Filters' : 'फिल्टरहरू'}
              </h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-white/70 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Filters Body */}
            <div>
              <label className="block text-xs font-black text-white/90 mb-2">
                {lang === 'en' ? 'District' : 'जिल्ला'}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white"
              >
                <option value="ALL" className="bg-black text-white">{lang === 'en' ? 'All Districts' : 'सबै जिल्ला'}</option>
                {ALL_NEPAL_DISTRICTS.map((d) => (
                  <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                    {lang === 'ne' ? d.nameNe : d.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-3 rounded-2xl bg-gold hover:bg-gold/90 text-black font-black text-xs uppercase tracking-wider"
            >
              {lang === 'en' ? 'Apply Filters' : 'लागू गर्नुहोस्'}
            </button>
          </div>
        </div>
      )}

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
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-gold animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
