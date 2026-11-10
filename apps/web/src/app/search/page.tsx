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
  Sparkles,
  MapPin,
  Check,
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
import { PropertyGridSkeleton } from '@/components/ui/PropertyCardSkeleton';
import { ScrollReveal } from '@/components/ui/Motion';

type RentPreset = 'ALL' | 'UNDER_10K' | '10K_25K' | '25K_50K' | '50K_1L' | 'ABOVE_1L';
type BHKFilter = 'ALL' | 1 | 2 | 3 | 4;
type SortOption = 'newest' | 'rent_asc' | 'rent_desc';

const RENT_PRESET_OPTIONS: { id: RentPreset; labelEn: string; labelNe: string }[] = [
  { id: 'ALL', labelEn: 'Any Budget', labelNe: 'सबै बजेट' },
  { id: 'UNDER_10K', labelEn: 'Under NPR 10k', labelNe: '१० हजार भन्दा कम' },
  { id: '10K_25K', labelEn: 'NPR 10k – 25k', labelNe: '१० हजार – २५ हजार' },
  { id: '25K_50K', labelEn: 'NPR 25k – 50k', labelNe: '२५ हजार – ५० हजार' },
  { id: '50K_1L', labelEn: 'NPR 50k – 1 Lakh', labelNe: '५० हजार – १ लाख' },
  { id: 'ABOVE_1L', labelEn: 'Above NPR 1 Lakh', labelNe: '१ लाख भन्दा माथि' },
];

const TOP_DISTRICTS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski', 'Chitwan', 'Rupandehi'];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authenticated user state & credits
  const [user, setUser] = useState<{
    id: string;
    phone?: string;
    credits: number;
    userRole?: 'RENTER' | 'OWNER' | null;
    fullName?: string | null;
  } | null>(null);

  // Listings data & state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile filters drawer open state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync initial search parameters from URL
  useEffect(() => {
    const districtParam = searchParams.get('district');
    if (districtParam) {
      setSelectedDistrict(districtParam);
    }

    const rawSubtype = (searchParams.get('type') || searchParams.get('subtype'))?.toUpperCase();
    if (rawSubtype && ['HOUSE', 'FLAT', 'ROOM', 'SHOP'].includes(rawSubtype)) {
      setSubtypeFilter(rawSubtype as PropertySubtype);
    }

    const qParam = searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }

    const verifiedParam = searchParams.get('verifiedOnly') || searchParams.get('verified_only');
    if (verifiedParam === 'true' || verifiedParam === '1') {
      setLalpurjaOnly(true);
    }

    const sortParam = searchParams.get('sort');
    if (sortParam === 'rent_asc' || sortParam === 'rent_desc' || sortParam === 'newest') {
      setSortBy(sortParam);
    }

    const minRent = searchParams.get('minRent') || searchParams.get('min_rent');
    const maxRent = searchParams.get('maxRent') || searchParams.get('max_rent');
    if (maxRent === '10000') setRentPreset('UNDER_10K');
    else if (minRent === '10000' && maxRent === '25000') setRentPreset('10K_25K');
    else if (minRent === '25000' && maxRent === '50000') setRentPreset('25K_50K');
    else if (minRent === '50000' && maxRent === '100000') setRentPreset('50K_1L');
    else if (minRent === '100000') setRentPreset('ABOVE_1L');
  }, [searchParams]);

  // Sync state back to URL parameters (shallow replace for shareable URLs)
  const updateUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedDistrict && selectedDistrict !== 'ALL') params.set('district', selectedDistrict);
    if (subtypeFilter !== 'ALL') params.set('type', subtypeFilter);
    if (rentPreset === 'UNDER_10K') params.set('max_rent', '10000');
    else if (rentPreset === '10K_25K') {
      params.set('min_rent', '10000');
      params.set('max_rent', '25000');
    } else if (rentPreset === '25K_50K') {
      params.set('min_rent', '25000');
      params.set('max_rent', '50000');
    } else if (rentPreset === '50K_1L') {
      params.set('min_rent', '50000');
      params.set('max_rent', '100000');
    } else if (rentPreset === 'ABOVE_1L') {
      params.set('min_rent', '100000');
    }
    if (lalpurjaOnly) params.set('verifiedOnly', 'true');
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (sortBy !== 'newest') params.set('sort', sortBy);

    const queryString = params.toString();
    const newRelativePathQuery = window.location.pathname + (queryString ? `?${queryString}` : '');
    window.history.replaceState(null, '', newRelativePathQuery);
  }, [selectedDistrict, subtypeFilter, rentPreset, lalpurjaOnly, searchQuery, sortBy]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

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
          setFetchError(qErr.message || 'Error fetching properties');
          setProperties([]);
          setTotalCount(0);
        } else {
          setProperties((data as Property[]) || []);
          setTotalCount(count || 0);
          setFetchError(null);
        }
      } catch (err: unknown) {
        console.error('Fetch exception:', err);
        setFetchError(err instanceof Error ? err.message : 'Network error');
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

  const handleSelectQuickDistrict = (districtName: string) => {
    setSelectedDistrict(districtName);
    setRentPreset('ALL');
    setSubtypeFilter('ALL');
    setBhkFilter('ALL');
    setFurnishingFilter('ALL');
    setTenantFilter('ALL');
    setLalpurjaOnly(false);
    setSearchQuery('');
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

  // Active filter count for mobile badge
  const activeFilterCount =
    (selectedDistrict !== 'ALL' ? 1 : 0) +
    (subtypeFilter !== 'ALL' ? 1 : 0) +
    (rentPreset !== 'ALL' ? 1 : 0) +
    (bhkFilter !== 'ALL' ? 1 : 0) +
    (furnishingFilter !== 'ALL' ? 1 : 0) +
    (tenantFilter !== 'ALL' ? 1 : 0) +
    (lalpurjaOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      {/* 1. TOP NAVBAR */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
        currentUser={user ? { id: user.id, credits: user.credits, userRole: user.userRole } : null}
      />

      {/* ============================================================ */}
      {/* 2. STICKY SEARCH & HORIZONTAL FILTER BAR                     */}
      {/* ============================================================ */}
      <section className="bg-black/95 border-b border-gold/30 sticky top-18 sm:top-20 z-30 shadow-subtle backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          {/* Row 1: Search Input & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
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
                    ? isMobile
                      ? 'Search locality or landmark...'
                      : 'Search by locality, ward, or landmark (e.g., Baluwatar, Pulchowk, Lakeside)...'
                    : isMobile
                    ? 'टोल वा चोक खोज्नुहोस्...'
                    : 'टोल, वडा वा चोकको नाम खोज्नुहोस्...'
                }
                className="w-full bg-black/60 border border-white/20 rounded-2xl pl-11 pr-24 sm:pr-28 py-3 text-base sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 min-h-touch"
              />
              <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 sm:px-4 py-1.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs font-black transition-all active:scale-97"
              >
                {lang === 'en' ? 'Search' : 'खोज्नुहोस्'}
              </button>
            </form>

            {/* Mobile Filter Drawer Button & Sort Dropdown */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-2xl border border-gold/40 bg-white/5 text-xs font-black text-white hover:bg-white/10 shadow-subtle min-h-touch active:scale-97"
              >
                <SlidersHorizontal className="w-4 h-4 text-gold stroke-[2.5]" />
                <span>
                  {lang === 'en' ? 'Filters' : 'फिल्टरहरू'}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </span>
                {activeFilterCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-gold" />
                )}
              </button>

              <div className="relative w-44 sm:w-48 shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label={lang === 'en' ? 'Sort rentals' : 'क्रमबद्ध गर्नुहोस्'}
                  className="w-full bg-black/60 border border-white/20 rounded-2xl pl-3.5 pr-8 py-3 text-xs font-bold text-white appearance-none focus:outline-none focus:border-gold min-h-touch"
                >
                  <option value="newest" className="bg-black text-white">
                    {lang === 'en' ? 'Sort: Newest' : 'नयाँ पहिले'}
                  </option>
                  <option value="rent_asc" className="bg-black text-white">
                    {lang === 'en' ? 'Rent: Low to High' : 'भाडा: सस्तो पहिले'}
                  </option>
                  <option value="rent_desc" className="bg-black text-white">
                    {lang === 'en' ? 'Rent: High to Low' : 'भाडा: महँगो पहिले'}
                  </option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-gold absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Desktop Horizontal Filter Bar (Visible on lg+) */}
          <div className="hidden lg:flex items-center justify-between gap-3 pt-1 border-t border-white/10">
            <div className="flex items-center gap-2.5 flex-wrap flex-1">
              {/* District Selector */}
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-gold"
                >
                  <option value="ALL" className="bg-black text-white">
                    {lang === 'en' ? 'All Districts' : 'सबै जिल्लाहरू'}
                  </option>
                  {ALL_NEPAL_DISTRICTS.map((d) => (
                    <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                      {lang === 'ne' ? d.nameNe : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtype Pill Group */}
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 text-xs font-bold">
                {(
                  [
                    { id: 'ALL', labelEn: 'All Types', labelNe: 'सबै' },
                    { id: 'ROOM', labelEn: 'Room', labelNe: 'कोठा' },
                    { id: 'FLAT', labelEn: 'Flat', labelNe: 'फ्ल्याट' },
                    { id: 'HOUSE', labelEn: 'House', labelNe: 'घर' },
                    { id: 'SHOP', labelEn: 'Shop', labelNe: 'पसल' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubtypeFilter(item.id as PropertySubtype | 'ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      subtypeFilter === item.id
                        ? 'bg-gold text-black font-black shadow-subtle'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {lang === 'en' ? item.labelEn : item.labelNe}
                  </button>
                ))}
              </div>

              {/* Monthly Rent Range Selector */}
              <div className="relative">
                <select
                  value={rentPreset}
                  onChange={(e) => setRentPreset(e.target.value as RentPreset)}
                  className="bg-black/80 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-gold"
                >
                  {RENT_PRESET_OPTIONS.map((item) => (
                    <option key={item.id} value={item.id} className="bg-black text-white">
                      {lang === 'en' ? item.labelEn : item.labelNe}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lalpurja Verified Only Toggle */}
              <button
                type="button"
                onClick={() => setLalpurjaOnly(!lalpurjaOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                  lalpurjaOnly
                    ? 'bg-gold text-black border-gold shadow-subtle'
                    : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ShieldCheck className={`w-3.5 h-3.5 stroke-[2.5] ${lalpurjaOnly ? 'text-black' : 'text-gold'}`} />
                <span>{lang === 'en' ? 'Lalpurja Verified Only' : 'प्रमाणित लालपुर्जा'}</span>
              </button>
            </div>

            {/* Reset All (Desktop) */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-white/70 hover:text-gold transition-colors font-bold flex items-center gap-1 shrink-0 px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'en' ? 'Reset Filters' : 'रिसेट'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. MAIN RESULTS CONTAINER WITH ACTIVE FILTER CHIPS           */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-28 lg:pb-12">
        {/* Results Header: Active Chips & Result Counter */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gold tracking-tight">
                {selectedDistrict !== 'ALL'
                  ? `${selectedDistrict} Rentals`
                  : lang === 'en'
                  ? 'Verified Rental Properties'
                  : 'नेपालमा प्रमाणित भाडा सम्पत्तिहरू'}
              </h1>
              {loading ? (
                <div className="h-4 w-48 sm:w-64 bg-white/10 rounded animate-pulse mt-1.5" />
              ) : (
                <p className="text-xs sm:text-sm text-white/70 mt-1 font-medium">
                  {lang === 'en'
                    ? `Showing ${properties.length} of ${totalCount} verified rentals • 0% Brokerage`
                    : `${totalCount} मध्ये ${properties.length} प्रमाणित भाडा सूचीहरू • ०% दलाली`}
                </p>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-gold/90 hover:text-gold transition-colors font-black flex items-center gap-1 self-start sm:self-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'en' ? 'Clear All Filters' : 'सबै फिल्टर हटाउनुहोस्'}</span>
              </button>
            )}
          </div>

          {/* Removable Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* District Chip */}
              {selectedDistrict !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('ALL')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-xs font-bold hover:bg-gold/25 transition-colors"
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{selectedDistrict}</span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}

              {/* Subtype Chip */}
              {subtypeFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSubtypeFilter('ALL')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <span>{subtypeFilter}</span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}

              {/* Rent Preset Chip */}
              {rentPreset !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setRentPreset('ALL')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <span>
                    {RENT_PRESET_OPTIONS.find((r) => r.id === rentPreset)?.[lang === 'en' ? 'labelEn' : 'labelNe'] || rentPreset}
                  </span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}

              {/* Lalpurja Verified Only Chip */}
              {lalpurjaOnly && (
                <button
                  type="button"
                  onClick={() => setLalpurjaOnly(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 border border-gold text-gold text-xs font-bold hover:bg-gold/30 transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Verified Lalpurja' : 'प्रमाणित लालपुर्जा'}</span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}

              {/* Search Query Chip */}
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <Search className="w-3 h-3 shrink-0" />
                  <span>&quot;{searchQuery.trim()}&quot;</span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}

              {/* BHK Chip */}
              {bhkFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setBhkFilter('ALL')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <span>{bhkFilter} BHK</span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}

              {/* Furnishing Chip */}
              {furnishingFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setFurnishingFilter('ALL')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 transition-colors"
                >
                  <span>{furnishingFilter}</span>
                  <X className="w-3 h-3 stroke-[2.5]" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Listings Content */}
        {loading ? (
          <PropertyGridSkeleton count={6} />
        ) : fetchError ? (
          <div className="bg-white/[0.04] rounded-3xl border border-gold/30 p-10 text-center max-w-md mx-auto space-y-4 shadow-card">
            <p className="text-sm text-gold font-bold">
              {lang === 'en' ? 'Unable to load rentals.' : 'भाडा सम्पत्ति लोड गर्न सकिएन।'}
            </p>
            <button
              type="button"
              onClick={() => fetchProperties(currentPage)}
              className="py-2.5 px-5 rounded-xl bg-gold hover:bg-gold/90 text-black font-black text-xs transition-all active:scale-97"
            >
              {lang === 'en' ? 'Retry' : 'पुनः प्रयास'}
            </button>
          </div>
        ) : properties.length === 0 ? (
          /* High-Conversion Empty State */
          <div className="bg-white/[0.04] rounded-3xl border border-gold/30 p-10 sm:p-14 text-center max-w-xl mx-auto space-y-6 shadow-card backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-gold text-black flex items-center justify-center mx-auto shadow-subtle">
              <Home className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                {lang === 'en' ? 'No Rentals Match Your Specific Filter' : 'कुनै भाडाको सूची फेला परेन'}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed font-medium">
                {lang === 'en'
                  ? 'We couldn’t find rentals matching all selected criteria. Try resetting filters or explore verified rentals in key regional hubs below.'
                  : 'छानिएका फिल्टर अनुसार कुनै सम्पत्ति फेला परेन। फिल्टर रिसेट गर्नुहोस् वा प्रमुख जिल्लाहरूमा खोज्नुहोस्।'}
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="py-3 px-6 rounded-2xl bg-gold hover:bg-gold/90 text-black font-black text-xs uppercase tracking-wider shadow-subtle transition-all active:scale-97"
              >
                {lang === 'en' ? 'Reset All Filters' : 'फिल्टरहरू रिसेट गर्नुहोस्'}
              </button>

              <div className="pt-3">
                <span className="text-[11px] font-bold text-white/50 block mb-2 uppercase tracking-wider">
                  {lang === 'en' ? 'Explore Key Active Districts' : 'सक्रिय जिल्लाहरूमा खोज्नुहोस्'}
                </span>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {TOP_DISTRICTS.map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleSelectQuickDistrict(dist)}
                      className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-gold hover:text-black hover:border-gold text-xs font-bold text-white transition-all active:scale-97"
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((prop, idx) => (
                <ScrollReveal key={prop.id} delayMs={idx * 30}>
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
      </main>

      {/* ============================================================ */}
      {/* 4. MOBILE FILTERS SLIDE-OVER DRAWER / BOTTOM SHEET           */}
      {/* ============================================================ */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop with tap-to-dismiss */}
          <div
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Bottom Sheet Container */}
          <div className="relative w-full max-w-lg bg-black/95 border-t border-gold/40 rounded-t-3xl max-h-[85vh] flex flex-col z-10 shadow-card pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gold stroke-[2.5]" />
                <h3 className="font-black text-base text-gold uppercase tracking-wider">
                  {lang === 'en' ? 'Rental Filters' : 'भाडा फिल्टरहरू'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-white/70 hover:text-gold font-bold flex items-center gap-1 min-h-touch"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'en' ? 'Reset' : 'रिसेट'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 text-white/70 hover:text-white rounded-xl min-h-touch min-w-touch flex items-center justify-center"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Body */}
            <div className="overflow-y-auto px-6 py-4 space-y-5 flex-1">
              {/* 1. District */}
              <div>
                <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                  {lang === 'en' ? 'District' : 'जिल्ला'}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-gold min-h-touch"
                >
                  <option value="ALL" className="bg-black text-white">
                    {lang === 'en' ? 'All Districts' : 'सबै जिल्ला'}
                  </option>
                  {ALL_NEPAL_DISTRICTS.map((d) => (
                    <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                      {lang === 'ne' ? d.nameNe : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Monthly Rent Range */}
              <div>
                <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                  {lang === 'en' ? 'Monthly Rent' : 'मासिक भाडा दर'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-white/70">
                  {RENT_PRESET_OPTIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setRentPreset(preset.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all min-h-touch flex items-center ${
                        rentPreset === preset.id
                          ? 'border-gold bg-gold/15 text-gold'
                          : 'border-white/10 bg-white/[0.03] text-white/70'
                      }`}
                    >
                      {lang === 'en' ? preset.labelEn : preset.labelNe}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Property Subtype */}
              <div>
                <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                  {lang === 'en' ? 'Property Subtype' : 'सम्पत्तिको प्रकार'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-white/70">
                  {(
                    [
                      { key: 'ALL' as const, labelEn: 'All Subtypes', labelNe: 'सबै प्रकार' },
                      { key: 'ROOM' as const, labelEn: 'Single Room (कोठा)', labelNe: 'एकल कोठा' },
                      { key: 'FLAT' as const, labelEn: 'Flat / Apartment', labelNe: 'फ्ल्याट' },
                      { key: 'HOUSE' as const, labelEn: 'Full House (घर)', labelNe: 'घर' },
                      { key: 'SHOP' as const, labelEn: 'Commercial Shop', labelNe: 'पसल / सटर' },
                    ]
                  ).map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      onClick={() => setSubtypeFilter(sub.key)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all min-h-touch flex items-center ${
                        subtypeFilter === sub.key
                          ? 'border-gold bg-gold/15 text-gold'
                          : 'border-white/10 bg-white/[0.03] text-white/70'
                      }`}
                    >
                      {lang === 'en' ? sub.labelEn : sub.labelNe}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. BHK / Bedrooms */}
              <div>
                <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                  {lang === 'en' ? 'BHK / Bedrooms' : 'कोठा संख्या (BHK)'}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { val: 'ALL' as const, label: lang === 'en' ? 'All' : 'सबै' },
                      { val: 1 as const, label: '1 BHK' },
                      { val: 2 as const, label: '2 BHK' },
                      { val: 3 as const, label: '3 BHK' },
                      { val: 4 as const, label: '4+ BHK' },
                    ]
                  ).map((bhk) => (
                    <button
                      key={String(bhk.val)}
                      type="button"
                      onClick={() => setBhkFilter(bhk.val)}
                      className={`py-2 rounded-xl text-xs font-black transition-all min-h-touch ${
                        bhkFilter === bhk.val
                          ? 'bg-gold text-black shadow-subtle'
                          : 'bg-white/5 border border-white/10 text-white/70'
                      }`}
                    >
                      {bhk.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Furnishing & Tenant Preference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    {lang === 'en' ? 'Furnishing' : 'फर्निसिङ'}
                  </label>
                  <select
                    value={furnishingFilter}
                    onChange={(e) => setFurnishingFilter(e.target.value as Furnishing | 'ALL')}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-gold min-h-touch"
                  >
                    <option value="ALL" className="bg-black text-white">
                      {lang === 'en' ? 'All' : 'सबै'}
                    </option>
                    <option value="FULLY_FURNISHED" className="bg-black text-white">
                      {lang === 'en' ? 'Fully Furnished' : 'पूर्ण फर्निसिङ'}
                    </option>
                    <option value="SEMI_FURNISHED" className="bg-black text-white">
                      {lang === 'en' ? 'Semi-Furnished' : 'आंशिक फर्निसिङ'}
                    </option>
                    <option value="UNFURNISHED" className="bg-black text-white">
                      {lang === 'en' ? 'Unfurnished' : 'फर्निसिङ नभएको'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    {lang === 'en' ? 'Tenant' : 'भाडामा बस्ने'}
                  </label>
                  <select
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value as PreferredTenant | 'ALL')}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-gold min-h-touch"
                  >
                    <option value="ALL" className="bg-black text-white">
                      {lang === 'en' ? 'Any' : 'सबै'}
                    </option>
                    <option value="FAMILY" className="bg-black text-white">
                      {lang === 'en' ? 'Family' : 'परिवार'}
                    </option>
                    <option value="BACHELOR" className="bg-black text-white">
                      {lang === 'en' ? 'Professionals / Bachelors' : 'पेसाकर्मी'}
                    </option>
                    <option value="ANY" className="bg-black text-white">
                      {lang === 'en' ? 'No Preference' : 'कुनै प्राथमिकता छैन'}
                    </option>
                  </select>
                </div>
              </div>

              {/* 6. Lalpurja Verified Toggle */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 cursor-pointer min-h-touch">
                <input
                  type="checkbox"
                  checked={lalpurjaOnly}
                  onChange={(e) => setLalpurjaOnly(e.target.checked)}
                  className="rounded accent-gold w-4 h-4"
                />
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-gold stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Verified Lalpurja Only' : 'लालपुर्जा प्रमाणित मात्र'}</span>
                </span>
              </label>
            </div>

            {/* Pinned Bottom Apply Button */}
            <div className="px-6 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs uppercase tracking-wider shadow-subtle min-h-touch flex items-center justify-center"
              >
                {lang === 'en' ? 'Apply Filters & View Results' : 'फिल्टर लागू गर्नुहोस्'}
              </button>
            </div>
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

      {/* 5. FOOTER */}
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
