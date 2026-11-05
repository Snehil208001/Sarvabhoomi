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
import { PropertyImage } from '@/components/PropertyImage';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';

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

  // Pagination State
  const PAGE_SIZE = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

  // Fetch properties from Supabase with server-side pagination & filtering
  const fetchProperties = async (targetPage = currentPage) => {
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
            user_intent
          )
        `,
          { count: 'exact' }
        )
        .eq('status', 'ACTIVE');

      // Server-side text search across locality, title, municipality, district
      const trimmedQ = searchQuery.trim().replace(/[%_]/g, '');
      if (trimmedQ) {
        query = query.or(
          `locality.ilike.%${trimmedQ}%,title.ilike.%${trimmedQ}%,district.ilike.%${trimmedQ}%,municipality.ilike.%${trimmedQ}%`
        );
      }

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

      // Apply Server-Side Pagination
      query = query.range(from, to);

      const { data, count, error: fetchErr } = await query;

      if (fetchErr) {
        console.warn('Properties query warning:', fetchErr.message);
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
      console.error('Error fetching properties:', err);
      setProperties([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when core filters change
  useEffect(() => {
    setCurrentPage(1);
    fetchProperties(1);
  }, [activeTab, selectedDistrict, pricePreset, facingFilter, lalpurjaOnly, sortBy]);

  // Handle manual search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProperties(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setCurrentPage(1);
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
      {/* 1. TOP NAVBAR */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
        currentUser={user ? { id: user.id, credits: user.credits } : null}
      />

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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200">
              <div className="text-xs text-slate-500 font-medium">
                {lang === 'en' ? (
                  <>
                    Showing <span className="font-bold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> -{' '}
                    <span className="font-bold text-slate-900">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> of{' '}
                    <span className="font-bold text-slate-900">{totalCount}</span> properties
                  </>
                ) : (
                  <>
                    जम्मा <span className="font-bold text-slate-900">{totalCount}</span> मध्ये{' '}
                    <span className="font-bold text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}</span> -{' '}
                    <span className="font-bold text-slate-900">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                >
                  {lang === 'en' ? 'Previous' : 'अघिल्लो'}
                </button>

                <div className="px-3 py-1.5 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
                  {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
                >
                  {lang === 'en' ? 'Next' : 'पछिल्लो'}
                </button>
              </div>
            </div>
          )}
        </>
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
      <Footer lang={lang} />
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
