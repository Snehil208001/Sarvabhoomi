'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Home,
  Building,
  Tag,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Heart,
  Phone,
  ArrowRight,
  RefreshCw,
  X,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowUpDown,
  Coins,
  Globe2,
  Check,
  Compass,
  Bed,
  Milestone,
} from 'lucide-react';
import {
  Property,
  ListingType,
  AreaUnit,
  PropertyFacing,
  formatPriceNPR,
  formatArea,
  formatPricePerUnit,
  HILLY_DISTRICTS,
  TERAI_DISTRICTS,
  getAuthDict,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'area_desc';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  // Authenticated user state & credits
  const [user, setUser] = useState<{ id: string; phone?: string; credits: number } | null>(null);

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

  // Filter States
  const [activeTab, setActiveTab] = useState<ListingType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [pricePreset, setPricePreset] = useState<'ALL' | 'UNDER_1CR' | '1CR_3CR' | 'ABOVE_3CR'>('ALL');
  const [facingFilter, setFacingFilter] = useState<PropertyFacing | 'ALL'>('ALL');
  const [lalpurjaOnly, setLalpurjaOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Mobile filters panel open state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync initial search parameters from URL (e.g. from Landing Page Hero Search)
  useEffect(() => {
    const typeParam = searchParams.get('type') as ListingType | null;
    if (typeParam && ['BUY_LAND', 'BUY_HOUSE', 'RENT_HOUSE', 'COMMERCIAL'].includes(typeParam)) {
      setActiveTab(typeParam);
    }

    const districtParam = searchParams.get('district');
    if (districtParam) {
      setSelectedDistrict(districtParam);
    }

    const qParam = searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
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
          // Fetch credits
          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser({
            id: authUser.id,
            phone: authUser.phone,
            credits: sub?.credits_remaining ?? 15,
          });

          // Fetch user favorites
          const { data: favs } = await supabase
            .from('property_favourites')
            .select('property_id')
            .eq('user_id', authUser.id);

          if (favs && isMounted) {
            setFavouriteIds(new Set(favs.map((f) => f.property_id)));
          }

          // Fetch user unlocks
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

  // Fetch properties from Supabase
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles (
            id,
            full_name,
            phone_np,
            user_intent
          )
        `)
        .eq('status', 'ACTIVE');

      // Apply Listing Type Filter
      if (activeTab !== 'ALL') {
        query = query.eq('listing_type', activeTab);
      }

      // Apply District Filter
      if (selectedDistrict !== 'ALL') {
        query = query.eq('district', selectedDistrict);
      }

      // Apply Lalpurja Filter (Government Cadastral Admin-Verified Only)
      if (lalpurjaOnly) {
        query = query.eq('admin_verified', true);
      }

      // Apply Facing Filter
      if (facingFilter !== 'ALL') {
        query = query.eq('facing', facingFilter);
      }

      // Apply Price Presets
      if (pricePreset === 'UNDER_1CR') {
        query = query.lt('price_npr', 10000000);
      } else if (pricePreset === '1CR_3CR') {
        query = query.gte('price_npr', 10000000).lte('price_npr', 30000000);
      } else if (pricePreset === 'ABOVE_3CR') {
        query = query.gt('price_npr', 30000000);
      }

      // Apply Sorting
      if (sortBy === 'price_asc') {
        query = query.order('price_npr', { ascending: true });
      } else if (sortBy === 'price_desc') {
        query = query.order('price_npr', { ascending: false });
      } else if (sortBy === 'area_desc') {
        query = query.order('area_sqft', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error: fetchErr } = await query;

      if (fetchErr) {
        console.warn('Properties query warning:', fetchErr.message);
        // Clean empty state when table is fresh
        setProperties([]);
        return;
      }

      if (data) {
        // Client-side text search for locality / title
        let filtered = (data as unknown) as Property[];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.locality.toLowerCase().includes(q) ||
              (p.municipality && p.municipality.toLowerCase().includes(q)) ||
              p.district.toLowerCase().includes(q)
          );
        }
        setProperties(filtered);
      }
    } catch (err: unknown) {
      console.error('Error fetching properties:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when core filters change
  useEffect(() => {
    fetchProperties();
  }, [activeTab, selectedDistrict, pricePreset, facingFilter, lalpurjaOnly, sortBy]);

  // Handle manual search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveTab('ALL');
    setSearchQuery('');
    setSelectedDistrict('ALL');
    setPricePreset('ALL');
    setFacingFilter('ALL');
    setLalpurjaOnly(false);
    setSortBy('newest');
  };

  // Toggle favorite / shortlist item
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

  // Handle Contact Unlock Modal Trigger
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

  // On successful unlock from modal
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
      {/* ============================================================ */}
      {/* 1. TOP NAVBAR */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl sm:text-2xl shadow-xs ring-4 ring-emerald-50 select-none group-hover:bg-emerald-700 transition-colors">
              स
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg">
                  Sarvabhoomi
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  0% Brokerage
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {lang === 'en' ? 'Direct P2P Marketplace' : 'शून्य-दलाली घरजग्गा बजार'}
              </p>
            </div>
          </Link>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={user ? '/post-property' : '/auth'}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-emerald-600 bg-emerald-50/90 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap"
            >
              <span>{lang === 'en' ? 'Post Free Property' : 'जग्गा राख्नुहोस्'}</span>
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-700" />
                <span>{user.credits} Credits</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap"
              >
                <span>{lang === 'en' ? 'Sign In' : 'साइन इन'}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SEARCH & FILTER HEADER BAR */}
      {/* ============================================================ */}
      <section className="bg-white border-b border-slate-200 sticky top-18 sm:top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          {/* Primary Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs sm:text-sm font-bold">
            {[
              { id: 'ALL', labelEn: 'All Properties', labelNe: 'सबै सम्पत्ति' },
              { id: 'BUY_LAND', labelEn: 'Buy Land (Ghaderi)', labelNe: 'जग्गा / घडेरी' },
              { id: 'BUY_HOUSE', labelEn: 'Buy House / Villa', labelNe: 'घर / भिल्ला' },
              { id: 'RENT_HOUSE', labelEn: 'Rentals', labelNe: 'भाडामा' },
              { id: 'COMMERCIAL', labelEn: 'Commercial', labelNe: 'व्यावसायिक' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ListingType | 'ALL')}
                className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {lang === 'en' ? tab.labelEn : tab.labelNe}
              </button>
            ))}
          </div>

          {/* Search Inputs & Filter Triggers Bar */}
          <div className="flex flex-col md:flex-row items-center gap-2.5">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Search municipality, ward, or landmark (e.g., Budhanilkantha, Imadol)...'
                    : 'नगरपालिका, वडा वा टोलको नाम खोज्नुहोस्...'
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

            {/* District Selector Dropdown */}
            <div className="w-full md:w-56 relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                aria-label={lang === 'en' ? 'Filter by District' : 'जिल्ला अनुसार छनोट गर्नुहोस्'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="ALL">
                  {lang === 'en' ? '📍 All Districts of Nepal' : '📍 नेपालका सबै जिल्लाहरू'}
                </option>
                <optgroup label="🏔️ Hilly & Valley Districts (पहाड तथा उपत्यका)">
                  {HILLY_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌾 Terai Districts (तराई)">
                  {TERAI_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </optgroup>
              </select>
              <MapPin className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Price Presets */}
            <div className="w-full md:w-44 relative">
              <select
                value={pricePreset}
                onChange={(e) => setPricePreset(e.target.value as typeof pricePreset)}
                aria-label={lang === 'en' ? 'Filter by Budget Preset' : 'बजेट दायरा अनुसार छनोट गर्नुहोस्'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:border-emerald-600"
              >
                <option value="ALL">{lang === 'en' ? 'Any Budget' : 'सबै बजेट'}</option>
                <option value="UNDER_1CR">{lang === 'en' ? 'Under Rs. 1 Crore' : '१ करोड मुनि'}</option>
                <option value="1CR_3CR">{lang === 'en' ? 'Rs. 1 Cr - 3 Cr' : '१ करोड - ३ करोड'}</option>
                <option value="ABOVE_3CR">{lang === 'en' ? 'Above Rs. 3 Crore' : '३ करोड माथि'}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Lalpurja Verified Toggle */}
            <button
              type="button"
              onClick={() => setLalpurjaOnly(!lalpurjaOnly)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                lalpurjaOnly
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Lalpurja Verified' : 'लालपुर्जा प्रमाणित'}</span>
              {lalpurjaOnly && <Check className="w-3.5 h-3.5 text-emerald-700 ml-0.5" />}
            </button>

            {/* Sort Dropdown */}
            <div className="w-full md:w-44 relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={lang === 'en' ? 'Sort properties' : 'क्रमबद्ध गर्नुहोस्'}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-900 appearance-none focus:outline-none focus:border-emerald-600"
              >
                <option value="newest">{lang === 'en' ? 'Sort: Newest' : 'नयाँ पहिले'}</option>
                <option value="price_asc">{lang === 'en' ? 'Price: Low to High' : 'मूल्य: सस्तो पहिले'}</option>
                <option value="price_desc">{lang === 'en' ? 'Price: High to Low' : 'मूल्य: महँगो पहिले'}</option>
                <option value="area_desc">{lang === 'en' ? 'Area: Largest First' : 'क्षेत्रफल: ठूलो पहिले'}</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. LISTINGS GRID CONTENT */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Metadata Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {selectedDistrict !== 'ALL' ? `${selectedDistrict} Real Estate` : 'Verified Properties in Nepal'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {lang === 'en'
                ? `Showing ${properties.length} direct-owner listings • 0% Middleman Brokerage`
                : `${properties.length} प्रत्यक्ष जग्गाधनी सूचीहरू • ०% दलाली कमिसन`}
            </p>
          </div>

          {(activeTab !== 'ALL' || selectedDistrict !== 'ALL' || lalpurjaOnly || pricePreset !== 'ALL' || searchQuery) && (
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
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
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
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? 'No Properties Match Your Search' : 'कुनै सम्पत्ति फेला परेन'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === 'en'
                  ? 'Try broadening your filters, choosing a different district, or resetting the search criteria.'
                  : 'कृपया फरक जिल्ला छनोट गर्नुहोस् वा फिल्टर रिसेट गर्नुहोस्।'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              {lang === 'en' ? 'View All Properties' : 'सबै सम्पत्ति हेर्नुहोस्'}
            </button>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => {
              const isFav = favouriteIds.has(prop.id);
              const isUnlocked = unlockedIds.has(prop.id);
              const photoUrl =
                prop.photos && prop.photos.length > 0
                  ? prop.photos[0]
                  : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Card Image Banner */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                      <Link href={`/properties/${prop.id}`}>
                        <img
                          src={photoUrl}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {prop.admin_verified ? (
                          <span
                            title="Government cadastral verified by Sarvabhoomi"
                            className="px-2.5 py-1 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs flex items-center gap-1 backdrop-blur-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Lalpurja Verified</span>
                          </span>
                        ) : prop.owner_declared_lalpurja ? (
                          <span
                            title="Lalpurja claimed by owner — pending cadastral verification by Sarvabhoomi"
                            className="px-2.5 py-1 rounded-md bg-slate-900/80 text-amber-300 border border-amber-400/40 text-[10px] font-semibold tracking-wide shadow-xs flex items-center gap-1 backdrop-blur-xs"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                            <span>Claimed (Pending Verification)</span>
                          </span>
                        ) : null}
                        <span className="px-2 py-1 rounded-md bg-white/95 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide shadow-2xs">
                          0% Brokerage
                        </span>
                      </div>

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(prop.id, e)}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs backdrop-blur-xs ${
                          isFav
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
                        }`}
                        title={isFav ? 'Remove from shortlist' : 'Save to shortlist'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Photos Count & Listing Type Pill */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-semibold tracking-wider uppercase">
                          {prop.listing_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      {/* Price & Unit Rate */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="text-xl font-extrabold text-slate-900 tracking-tight">
                            {formatPriceNPR(prop.price_npr, lang)}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700">
                            {formatPricePerUnit(prop.price_npr, prop.area_value, prop.area_unit, lang)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900">
                            {formatArea(prop.area_value, prop.area_unit, lang, { includeSqft: false })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {prop.area_sqft.toLocaleString()} sq ft
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <Link href={`/properties/${prop.id}`}>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {prop.title}
                        </h3>
                      </Link>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {prop.locality}, {prop.district}
                        </span>
                      </div>

                      {/* Specifications Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-600">
                        {prop.road_access && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1">
                            <Milestone className="w-3 h-3 text-slate-500" />
                            <span>{prop.road_access}</span>
                          </span>
                        )}
                        {prop.facing && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1">
                            <Compass className="w-3 h-3 text-slate-500" />
                            <span>{prop.facing}</span>
                          </span>
                        )}
                        {prop.bedrooms && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium inline-flex items-center gap-1">
                            <Bed className="w-3 h-3 text-slate-500" />
                            <span>{prop.bedrooms} BHK</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/properties/${prop.id}`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                    >
                      <span>{lang === 'en' ? 'View Details' : 'विवरण'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => handleOpenContactModal(prop, e)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                        isUnlocked
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>
                        {isUnlocked
                          ? lang === 'en'
                            ? 'Contact Info'
                            : 'सम्पर्क खुल्यो'
                          : lang === 'en'
                          ? 'Contact Owner'
                          : 'जग्गाधनी सम्पर्क'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Contact Unlock Modal */}
      <ContactUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        property={selectedUnlockProperty}
        currentUser={user}
        onUnlockSuccess={handleUnlockSuccess}
        lang={lang}
      />

      {/* Institutional Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>© 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. Kathmandu, Nepal.</div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Kathmandu Cadastral GIS Certified</span>
            <span>•</span>
            <span>100% Zero Brokerage P2P</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl animate-pulse">
            स
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
