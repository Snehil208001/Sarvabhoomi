'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  MapPin,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Home,
  Check,
  HelpCircle,
  Coins,
  ChevronRight,
  Building,
  KeyRound,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  getAuthDict,
  ALL_NEPAL_DISTRICTS,
  Property,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authenticated user state
  const [user, setUser] = useState<{ id: string; fullName?: string; credits?: number; userRole?: 'RENTER' | 'OWNER' | null } | null>(null);

  // Search Engine Interactive State (Rent-First)
  const [selectedDistrict, setSelectedDistrict] = useState('Kathmandu');
  const [selectedSubtype, setSelectedSubtype] = useState('ALL');
  const [rentRange, setRentRange] = useState('ALL');
  const [localityQuery, setLocalityQuery] = useState('');

  // Featured rentals state
  const [featuredRentals, setFeaturedRentals] = useState<Property[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(true);

  // Check Supabase session on mount
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, preferred_district, user_role')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser({
            id: authUser.id,
            fullName: profile?.full_name || 'Verified Member',
            credits: sub?.credits_remaining ?? 15,
            userRole: profile?.user_role || null,
          });
        }
      } catch {
        // Continue as guest
      }
    }
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live active rental listings
  useEffect(() => {
    let isMounted = true;
    async function loadFeaturedRentals() {
      try {
        setLoadingRentals(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'ACTIVE')
          .eq('listing_type', 'RENT_HOUSE')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error && data && isMounted) {
          setFeaturedRentals(data as Property[]);
        }
      } catch (err) {
        console.warn('Error loading featured rentals:', err);
      } finally {
        if (isMounted) setLoadingRentals(false);
      }
    }
    loadFeaturedRentals();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ne' : 'en'));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('type', 'RENT_HOUSE');

    if (selectedDistrict && selectedDistrict !== 'ALL') {
      params.set('district', selectedDistrict);
    }
    if (selectedSubtype && selectedSubtype !== 'ALL') {
      params.set('subtype', selectedSubtype);
    }
    if (localityQuery.trim()) {
      params.set('q', localityQuery.trim());
    }

    if (rentRange === 'UNDER_10K') {
      params.set('max_rent', '10000');
    } else if (rentRange === '10K_25K') {
      params.set('min_rent', '10000');
      params.set('max_rent', '25000');
    } else if (rentRange === '25K_50K') {
      params.set('min_rent', '25000');
      params.set('max_rent', '50000');
    } else if (rentRange === '50K_1L') {
      params.set('min_rent', '50000');
      params.set('max_rent', '100000');
    } else if (rentRange === 'ABOVE_1L') {
      params.set('min_rent', '100000');
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      {/* 1. TOP INSTITUTIONAL NAVBAR */}
      <Navbar lang={lang} onToggleLang={toggleLang} currentUser={user} />

      {/* ============================================================ */}
      {/* 2. HERO SECTION & RENT SEARCH ENGINE (NOBROKER-STYLE)        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-slate-100 py-12 sm:py-20 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Launch Benefit Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>
              {lang === 'en'
                ? 'Launch Offer: 15 Free Landlord Contact-Unlock Credits for Renters'
                : 'लन्च अफर: भाडामा लिनेहरूलाई १५ निःशुल्क घरधनी सम्पर्क अनलक क्रेडिट'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            {lang === 'en' ? (
              <>
                Rent Rooms, Flats & Houses in Nepal with{' '}
                <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-8">
                  Zero Brokerage
                </span>
              </>
            ) : (
              <>
                नेपालमा बिना दलाल कोठा, फ्ल्याट र घर{' '}
                <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-8">
                  शून्य शुल्कमा
                </span>{' '}
                भाडामा लिनुहोस्
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {lang === 'en'
              ? 'Connect directly with verified property owners across Nepal. Save 1 month\'s rent in broker commission with verified Lalpurja ownership.'
              : 'नेपालभरका प्रमाणित घरधनीहरूसँग सिधै सम्पर्क गर्नुहोस्। १ महिनाको भाडा बराबरको दलाली कमिसन बचत गर्नुहोस्।'}
          </p>

          {/* ======================================================== */}
          {/* RENT-ONLY SEARCH ENGINE CONTAINER                        */}
          {/* ======================================================== */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-4 sm:p-6 text-left mt-6">
            {/* Rent Tab Indicator (No other tabs) */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
              <div className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 bg-emerald-600 text-white shadow-xs">
                <Home className="w-4 h-4" />
                <span>{lang === 'en' ? 'Rent Homes, Flats & Rooms' : 'कोठा, फ्ल्याट तथा घर भाडा'}</span>
              </div>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                {lang === 'en' ? 'Direct Owner Listings • 0% Brokerage' : 'सिधै घरधनीबाट • ०% दलाली'}
              </span>
            </div>

            {/* Search Input Controls Grid */}
            <form onSubmit={handleSearchSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. All 77 Nepal Districts */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {lang === 'en' ? 'District (77 Districts)' : 'जिल्ला'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 min-h-touch"
                    >
                      <option value="ALL">{lang === 'en' ? 'All Nepal' : 'सबै नेपाल'}</option>
                      {ALL_NEPAL_DISTRICTS.map((d) => (
                        <option key={d.nameEn} value={d.nameEn}>
                          {lang === 'ne' ? d.nameNe : d.nameEn}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* 2. Property Subtype */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {lang === 'en' ? 'Property Type' : 'सम्पत्ति प्रकार'}
                  </label>
                  <select
                    value={selectedSubtype}
                    onChange={(e) => setSelectedSubtype(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 min-h-touch"
                  >
                    <option value="ALL">{lang === 'en' ? 'All Rental Types' : 'सबै प्रकार'}</option>
                    <option value="ROOM">{lang === 'en' ? 'Single Room (कोठा)' : 'कोठा (Room)'}</option>
                    <option value="FLAT">{lang === 'en' ? 'Flat / Apartment (फ्ल्याट)' : 'फ्ल्याट (Flat)'}</option>
                    <option value="HOUSE">{lang === 'en' ? 'Independent House (घर)' : 'घर (House)'}</option>
                    <option value="SHOP">{lang === 'en' ? 'Commercial Shop (पसल)' : 'पसल / सटर (Shop)'}</option>
                  </select>
                </div>

                {/* 3. Monthly Rent Range */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {lang === 'en' ? 'Monthly Rent' : 'मासिक भाडा'}
                  </label>
                  <select
                    value={rentRange}
                    onChange={(e) => setRentRange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 appearance-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 min-h-touch"
                  >
                    <option value="ALL">{lang === 'en' ? 'Any Budget' : 'सबै भाडा दर'}</option>
                    <option value="UNDER_10K">{lang === 'en' ? 'Under Rs. 10,000' : 'रु १०,००० भन्दा कम'}</option>
                    <option value="10K_25K">{lang === 'en' ? 'Rs. 10,000 – 25,000' : 'रु १०,००० – २५,०००'}</option>
                    <option value="25K_50K">{lang === 'en' ? 'Rs. 25,000 – 50,000' : 'रु २५,००० – ५०,०००'}</option>
                    <option value="50K_1L">{lang === 'en' ? 'Rs. 50,000 – 1 Lakh' : 'रु ५०,००० – १ लाख'}</option>
                    <option value="ABOVE_1L">{lang === 'en' ? 'Above Rs. 1 Lakh' : 'रु १ लाख भन्दा माथि'}</option>
                  </select>
                </div>

                {/* 4. Locality Search */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {lang === 'en' ? 'Locality / Landmark' : 'टोल वा चोक'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localityQuery}
                      onChange={(e) => setLocalityQuery(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. Baneshwor, Baluwatar...' : 'उदा. बानेश्वर, बालुवाटार...'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 min-h-touch"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Big Search Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all min-h-touch active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Search Rental Properties' : 'भाडाको सम्पत्ति खोज्नुहोस्'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Trust Strip like NoBroker's (Sarvabhoomi Real Numbers only) */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs sm:text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>0% Brokerage</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Direct Owner Contact</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Lalpurja Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CONSUMER PILLARS (RENTER VS OWNER ROLES)                  */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'en' ? 'How Sarvabhoomi Works for You' : 'सर्वभूमिले तपाईंलाई कसरी फाइदा पुर्‍याउँछ?'}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {lang === 'en'
              ? 'Eliminating intermediaries so renters and property owners connect directly with zero brokerage fee.'
              : 'बिचौलिया बिना घरधनी र भाडामा लिने बीच सिधा सम्पर्क र १००% सुरक्षित कारोबार।'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: For Renters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {lang === 'en' ? '15 Free Unlocks' : '१५ निःशुल्क सम्पर्क'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'For Home & Room Renters' : 'भाडामा लिनेहरूका लागि'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {lang === 'en'
                  ? 'Browse verified rooms, flats and houses. Unlock direct owner phone numbers and request property visits directly with 0% brokerage.'
                  : 'प्रमाणित कोठा, फ्ल्याट र घरहरू खोज्नुहोस्। सिधै घरधनीको नम्बर अनलक गरी बिना दलाली शुल्क घर हेर्न जानुहोस्।'}
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs min-h-touch active:scale-95"
            >
              <span>{lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: For Property Owners */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Tag className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {lang === 'en' ? '100% Free Listing' : '१००% निःशुल्क'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'For Landlords & House Owners' : 'घरधनी तथा घरबेटीका लागि'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {lang === 'en'
                  ? 'List your room, flat, house or commercial shop in 2 minutes. Receive direct enquiries and scheduled visit requests from verified tenants.'
                  : 'आफ्नो कोठा, फ्ल्याट वा घर २ मिनेटमै निःशुल्क सूचीकृत गर्नुहोस्। दलाल बिना वास्तविक भाडावालहरूबाट सिधा सम्पर्क पाउनुहोस्।'}
              </p>
            </div>
            <Link
              href={user?.userRole === 'RENTER' ? '/dashboard' : '/post-property'}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs min-h-touch active:scale-95"
            >
              <span>{lang === 'en' ? 'List Your Property' : 'सम्पत्ति सूचीकृत गर्नुहोस्'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Verified Lalpurja */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {lang === 'en' ? 'Lalpurja Verified' : 'लालपुर्जा प्रमाणित'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'Authentic Ownership Verification' : 'प्रमाणित स्वामित्व र कित्ता नापी'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {lang === 'en'
                  ? 'Say goodbye to fake agent listings. We verify cadastral Kitta plot details and land certificates to ensure you rent only from genuine property owners.'
                  : 'नक्कली बिचौलिया र दलालहरूको विज्ञापनबाट बच्नुहोस्। वास्तविक कित्ता नम्बर र लालपुर्जा प्रमाणित भएका घरहरू मात्र भाडामा लिनुहोस्।'}
              </p>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs uppercase tracking-wider transition-colors min-h-touch active:scale-95"
            >
              <span>{lang === 'en' ? 'Explore Verified Rentals' : 'प्रमाणित भाडा हेर्नुहोस्'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. FEATURED VERIFIED DIRECT-OWNER RENTALS                    */}
      {/* ============================================================ */}
      <section id="featured-listings" className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'en' ? 'Direct Landlord Properties' : 'प्रत्यक्ष घरधनी सूचीकरण'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'en' ? 'Featured Rental Homes & Flats in Nepal' : 'नेपालका विशेष कोठा, फ्ल्याट तथा घरहरू'}
              </h2>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 min-h-touch"
            >
              <span>{lang === 'en' ? 'View all direct rentals' : 'सबै भाडाका सूची हेर्नुहोस्'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingRentals ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : featuredRentals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredRentals.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  lang={lang}
                  onUnlock={() => router.push(`/properties/${prop.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                {lang === 'en' ? 'No active rental listings found.' : 'कुनै सक्रिय भाडाको सूची भेटिएन।'}
              </p>
              <Link
                href="/search"
                className="mt-3 inline-block text-xs font-bold text-emerald-700 underline"
              >
                {lang === 'en' ? 'Browse all listings' : 'सबै सूची हेर्नुहोस्'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. NOBROKER ADVANTAGE IN NEPAL COMPARISON TABLE              */}
      {/* ============================================================ */}
      <section className="py-14 sm:py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {lang === 'en' ? 'Direct Transparency' : 'प्रत्यक्ष पारदर्शिता'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            {lang === 'en' ? 'The Sarvabhoomi Advantage' : 'सर्वभूमिको प्रत्यक्ष फाइदा'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            {lang === 'en'
              ? 'On an average home rental in Nepal, tenants lose 1 full month of rent to brokers. Here is how Sarvabhoomi fixes it.'
              : 'नेपालमा घर वा कोठा भाडामा लिँदा १ महिना बराबरको भाडा दलाली कमिसनमा जान्छ। सर्वभूमिले यो समस्या समाधान गर्छ।'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-100/80 p-4 font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200">
            <div>{lang === 'en' ? 'Feature' : 'विशेषता'}</div>
            <div className="text-slate-500">{lang === 'en' ? 'Traditional Rental Brokers' : 'परम्परागत दलाल प्रणाली'}</div>
            <div className="text-emerald-800">{lang === 'en' ? 'Sarvabhoomi Rent P2P' : 'सर्वभूमि प्रत्यक्ष बजार'}</div>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="font-semibold text-slate-900">Brokerage Fee</span>
              <span className="text-rose-600 font-medium">1 Month Rent (NPR 15k–1L)</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>NPR 0 (100% Free)</span>
              </span>
            </div>

            <div className="grid grid-cols-3 p-4 items-center bg-slate-50/50">
              <span className="font-semibold text-slate-900">Owner Contact</span>
              <span className="text-slate-500">Hidden behind middleman</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Direct phone access</span>
              </span>
            </div>

            <div className="grid grid-cols-3 p-4 items-center">
              <span className="font-semibold text-slate-900">Property Visits</span>
              <span className="text-slate-500">Subject to broker convenience</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Schedule visit directly</span>
              </span>
            </div>

            <div className="grid grid-cols-3 p-4 items-center bg-slate-50/50">
              <span className="font-semibold text-slate-900">Rental Price Markup</span>
              <span className="text-rose-600 font-medium">Often inflated by middlemen</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Genuine owner quoted rent</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FAQS SECTION                                              */}
      {/* ============================================================ */}
      <section id="faqs" className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'en' ? 'Frequently Asked Questions' : 'प्रायः सोधिने प्रश्नहरू'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'en' ? 'Everything you need to know about Sarvabhoomi rental marketplace.' : 'सर्वभूमि सेवा सम्बन्धी सम्पूर्ण जानकारी।'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>How does Sarvabhoomi operate with zero brokerage?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Sarvabhoomi connects renters and property owners directly without intermediaries. House owners list their flats, rooms, and houses 100% free, and renters use complimentary launch credits to contact landlords directly.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>What are the 15 Free Contact-Unlock Credits?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Every newly registered Renter account receives 15 complimentary contact unlock credits valid for 90 days. Each credit lets you view the verified phone number of an owner directly.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Can I switch between Renter and Owner roles?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                To guarantee zero middleman interference, each phone number is bound to one role (either Renter or Owner). If you need both, you can register a separate phone number.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INSTITUTIONAL LIGHT FOOTER */}
      <Footer lang={lang} />
    </div>
  );
}
