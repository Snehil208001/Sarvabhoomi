'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  MapPin,
  ArrowRight,
  Home,
  Check,
  HelpCircle,
  KeyRound,
  CheckCircle2,
  CalendarCheck2,
  Sparkles,
  Building2,
  Compass,
} from 'lucide-react';
import {
  ALL_NEPAL_DISTRICTS,
  Property,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';
import { DistrictTicker, CountUp, ScrollReveal } from '@/components/ui/Motion';

// Curated major rental hubs for the regional scoreboard
const KEY_RENTAL_DISTRICTS = [
  { nameEn: 'Kathmandu', nameNe: 'काठमाडौँ', hubTag: 'Valley Capital' },
  { nameEn: 'Lalitpur', nameNe: 'ललितपुर', hubTag: 'Valley South' },
  { nameEn: 'Bhaktapur', nameNe: 'भक्तपुर', hubTag: 'Valley East' },
  { nameEn: 'Kaski', nameNe: 'कास्की (पोखरा)', hubTag: 'Gandaki Hub' },
  { nameEn: 'Chitwan', nameNe: 'चितवन (भरतपुर)', hubTag: 'Central Plains' },
  { nameEn: 'Rupandehi', nameNe: 'रुपन्देही (बुटवल)', hubTag: 'Lumbini West' },
];

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authenticated user state
  const [user, setUser] = useState<{
    id: string;
    fullName?: string;
    credits?: number;
    userRole?: 'RENTER' | 'OWNER' | null;
  } | null>(null);

  // Search Engine Interactive State (Rent-First)
  const [selectedDistrict, setSelectedDistrict] = useState('Kathmandu');
  const [selectedSubtype, setSelectedSubtype] = useState('ALL');
  const [rentRange, setRentRange] = useState('ALL');
  const [localityQuery, setLocalityQuery] = useState('');

  // Live rental listings & real district counts from Supabase
  const [featuredRentals, setFeaturedRentals] = useState<Property[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(true);
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});
  const [totalActiveCount, setTotalActiveCount] = useState<number>(0);

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

  // Fetch live active rental listings AND calculate exact district scoreboard counts
  useEffect(() => {
    let isMounted = true;
    async function loadRentals() {
      try {
        setLoadingRentals(true);
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'ACTIVE')
          .eq('listing_type', 'RENT_HOUSE')
          .order('created_at', { ascending: false });

        if (!error && data && isMounted) {
          setFeaturedRentals(data.slice(0, 6) as Property[]);
          setTotalActiveCount(data.length);

          // Calculate exact real counts per district from live Supabase data
          const counts: Record<string, number> = {};
          data.forEach((p) => {
            if (p.district) {
              counts[p.district] = (counts[p.district] || 0) + 1;
            }
          });
          setDistrictCounts(counts);
        }
      } catch (err) {
        console.warn('Error loading rentals from Supabase:', err);
      } finally {
        if (isMounted) setLoadingRentals(false);
      }
    }
    loadRentals();
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      {/* 1. TOP NAVBAR */}
      <Navbar lang={lang} onToggleLang={toggleLang} currentUser={user} />

      {/* 2. DISTRICT TICKER MARQUEE (Ambient divider) */}
      <DistrictTicker />

      {/* ============================================================ */}
      {/* CHAPTER 1: HERO SCREEN — ONE STATEMENT, ONE ACTION           */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-28 lg:py-36 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow kicker tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>
              {lang === 'en'
                ? 'Launch Offer: 15 Free Contact Unlocks'
                : 'लन्च अफर: १५ निःशुल्क घरधनी सम्पर्क क्रेडिट'}
            </span>
          </div>

          {/* Hubtown-Style Stacked Display Headline (Tight leading, hand-broken) */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-[-0.03em] leading-[1.05] max-w-5xl mx-auto">
            {lang === 'en' ? (
              <>
                <span className="block">Rent a Home</span>
                <span className="block">in Nepal</span>
                <span className="block text-gold underline decoration-gold/40 decoration-4 underline-offset-8">
                  Zero Brokerage
                </span>
              </>
            ) : (
              <>
                <span className="block">नेपालमा घर तथा कोठा</span>
                <span className="block">सिधै घरधनीबाट</span>
                <span className="block text-gold underline decoration-gold/40 decoration-4 underline-offset-8">
                  शून्य शुल्कमा
                </span>
              </>
            )}
          </h1>

          {/* Subtitle in White 70% */}
          <p className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-normal mt-8">
            {lang === 'en'
              ? "Connect directly with verified property owners across Nepal. Save 1 month's rent in broker commission with verified Lalpurja ownership."
              : 'नेपालभरका प्रमाणित घरधनीहरूसँग सिधै सम्पर्क गर्नुहोस्। १ महिनाको भाडा बराबरको दलाली कमिसन बचत गर्नुहोस्।'}
          </p>

          {/* Floating Charcoal Search Card */}
          <div className="max-w-4xl mx-auto bg-white/[0.06] border border-gold/30 rounded-3xl shadow-cardHover p-5 sm:p-7 text-left mt-10 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 bg-gold text-black shadow-subtle">
                <Home className="w-4 h-4 stroke-[2.5]" />
                <span>{lang === 'en' ? 'Rent Homes, Flats & Rooms' : 'कोठा, फ्ल्याट तथा घर भाडा'}</span>
              </div>
              <span className="text-xs text-white/70 font-bold hidden sm:inline">
                {lang === 'en' ? 'Direct Owner Listings • 0% Brokerage' : 'सिधै घरधनीबाट • ०% दलाली'}
              </span>
            </div>

            {/* Search Input Controls Grid */}
            <form onSubmit={handleSearchSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Districts */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    {lang === 'en' ? 'District (77 Districts)' : 'जिल्ला'}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-3 text-xs font-bold text-white appearance-none focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 min-h-touch"
                    >
                      <option value="ALL" className="bg-black text-white">{lang === 'en' ? 'All Nepal' : 'सबै नेपाल'}</option>
                      {ALL_NEPAL_DISTRICTS.map((d) => (
                        <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                          {lang === 'ne' ? d.nameNe : d.nameEn}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gold">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 2. Subtype */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    {lang === 'en' ? 'Property Type' : 'सम्पत्ति प्रकार'}
                  </label>
                  <select
                    value={selectedSubtype}
                    onChange={(e) => setSelectedSubtype(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-3 text-xs font-bold text-white appearance-none focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 min-h-touch"
                  >
                    <option value="ALL" className="bg-black text-white">{lang === 'en' ? 'All Rental Types' : 'सबै प्रकार'}</option>
                    <option value="ROOM" className="bg-black text-white">{lang === 'en' ? 'Single Room (कोठा)' : 'कोठा (Room)'}</option>
                    <option value="FLAT" className="bg-black text-white">{lang === 'en' ? 'Flat / Apartment (फ्ल्याट)' : 'फ्ल्याट (Flat)'}</option>
                    <option value="HOUSE" className="bg-black text-white">{lang === 'en' ? 'Independent House (घर)' : 'घर (House)'}</option>
                    <option value="SHOP" className="bg-black text-white">{lang === 'en' ? 'Commercial Shop (पसल)' : 'पसल / सटर (Shop)'}</option>
                  </select>
                </div>

                {/* 3. Monthly Rent Range */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    {lang === 'en' ? 'Monthly Rent' : 'मासिक भाडा'}
                  </label>
                  <select
                    value={rentRange}
                    onChange={(e) => setRentRange(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-3 text-xs font-bold text-white appearance-none focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 min-h-touch"
                  >
                    <option value="ALL" className="bg-black text-white">{lang === 'en' ? 'Any Budget' : 'सबै भाडा दर'}</option>
                    <option value="UNDER_10K" className="bg-black text-white">{lang === 'en' ? 'Under Rs. 10,000' : 'रु १०,००० भन्दा कम'}</option>
                    <option value="10K_25K" className="bg-black text-white">{lang === 'en' ? 'Rs. 10,000 – 25,000' : 'रु १०,००० – २५,०००'}</option>
                    <option value="25K_50K" className="bg-black text-white">{lang === 'en' ? 'Rs. 25,000 – 50,000' : 'रु २५,००० – ५०,०००'}</option>
                    <option value="50K_1L" className="bg-black text-white">{lang === 'en' ? 'Rs. 50,000 – 1 Lakh' : 'रु ५०,००० – १ लाख'}</option>
                    <option value="ABOVE_1L" className="bg-black text-white">{lang === 'en' ? 'Above Rs. 1 Lakh' : 'रु १ लाख भन्दा माथि'}</option>
                  </select>
                </div>

                {/* 4. Locality Search */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-white/70 mb-1.5">
                    {lang === 'en' ? 'Locality / Landmark' : 'टोल वा चोक'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localityQuery}
                      onChange={(e) => setLocalityQuery(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. Baneshwor, Pulchowk...' : 'उदा. बानेश्वर, पुल्चोक...'}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-3 text-xs font-semibold text-white placeholder:text-white/40 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 min-h-touch"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gold">
                      <Search className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Big Gold Search CTA Button — Action 1 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-sm tracking-wide shadow-subtle hover:-translate-y-0.5 flex items-center justify-center gap-2.5 transition-all min-h-touch"
                >
                  <Search className="w-5 h-5 stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Search Rental Properties' : 'भाडाको सम्पत्ति खोज्नुहोस्'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Proof Points: Count-Up Stats Row in Gold */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-white/10 mt-12">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-gold">
                <CountUp target={0} suffix="%" />
              </div>
              <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">
                <span className="inline-block border-b-2 border-gold/40 pb-0.5">
                  {lang === 'en' ? 'Brokerage Fee' : 'दलाली शुल्क'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-gold">
                <CountUp target={15} suffix=" Free" />
              </div>
              <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">
                <span className="inline-block border-b-2 border-gold/40 pb-0.5">
                  {lang === 'en' ? 'Contact Unlocks' : 'सम्पर्क अनलक'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-gold">
                <CountUp target={77} suffix=" Districts" />
              </div>
              <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">
                <span className="inline-block border-b-2 border-gold/40 pb-0.5">
                  {lang === 'en' ? 'All Nepal' : 'देशव्यापी नेपाल'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-gold">
                <CountUp target={100} suffix="%" />
              </div>
              <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">
                <span className="inline-block border-b-2 border-gold/40 pb-0.5">
                  {lang === 'en' ? 'Direct Landlords' : 'प्रत्यक्ष घरधनी'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 2: DISTRICTS SCOREBOARD (HUBTOWN REGIONAL PROOF)      */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32 lg:py-40 bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-4">
              <Compass className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Regional Rental Scoreboard' : 'क्षेत्रीय भाडा स्कोरबोर्ड'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {lang === 'en' ? (
                <>
                  <span className="block">Verified Rentals Across</span>
                  <span className="block text-gold">Key Economic Hubs</span>
                </>
              ) : (
                <>
                  <span className="block">नेपालका प्रमुख सहरहरूमा</span>
                  <span className="block text-gold">प्रमाणित भाडा स्कोरबोर्ड</span>
                </>
              )}
            </h2>
            <p className="text-base text-white/70 mt-4 leading-relaxed font-normal">
              {lang === 'en'
                ? 'Track live active rental availability across major hubs. All listings are direct from verified owners.'
                : 'नेपालका प्रमुख सहरी केन्द्रहरूमा उपलब्ध सक्रिय भाडा संख्या। सबै सम्पत्तिहरू सिधै घरधनीबाट प्रमाणित।'}
            </p>
          </div>

          {/* Regional Scoreboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {KEY_RENTAL_DISTRICTS.map((district) => {
              const liveCount = districtCounts[district.nameEn] || 0;
              return (
                <Link
                  key={district.nameEn}
                  href={`/search?type=RENT_HOUSE&district=${district.nameEn}`}
                  className="bg-white/[0.06] border border-white/10 hover:border-gold/60 rounded-3xl p-6 sm:p-7 transition-all duration-300 group hover:-translate-y-1 shadow-card flex flex-col justify-between min-h-[160px]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest block mb-1">
                        {district.hubTag}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-gold transition-colors">
                        {lang === 'ne' ? district.nameNe : district.nameEn}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 group-hover:border-gold/40 flex items-center justify-center text-white/70 group-hover:text-gold transition-colors shrink-0">
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs text-white/60 font-medium">
                      {lang === 'en' ? 'Active Rentals' : 'सक्रिय भाडा'}
                    </span>
                    {liveCount > 0 ? (
                      <span className="px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-mono font-black">
                        {liveCount} {liveCount === 1 ? (lang === 'en' ? 'Listing' : 'सूची') : (lang === 'en' ? 'Listings' : 'सूचीहरू')}
                      </span>
                    ) : (
                      <span className="text-xs text-white/40 font-medium">
                        {lang === 'en' ? 'Explore Hub' : 'खोज्नुहोस्'}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Repeated Primary Action 2 */}
          <div className="mt-12 text-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-subtle hover:-translate-y-0.5 min-h-touch"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>
                {lang === 'en'
                  ? `Browse All ${totalActiveCount > 0 ? totalActiveCount : ''} Active Rentals`
                  : `सबै ${totalActiveCount > 0 ? totalActiveCount : ''} सक्रिय भाडा हेर्नुहोस्`}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 3: WHY 0% BROKERAGE — THREE STACKED CARDS            */}
      {/* ============================================================ */}
      <section id="how-it-works" className="bg-black text-white py-24 sm:py-32 lg:py-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-4">
              <span>✦</span>
              <span>{lang === 'en' ? 'The Zero-Brokerage Model' : 'शून्य-दलाली प्रत्यक्ष मोडल'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {lang === 'en' ? (
                <>
                  <span className="block">Why Pay</span>
                  <span className="block">1 Month Rent to</span>
                  <span className="block text-gold">Middlemen?</span>
                </>
              ) : (
                <>
                  <span className="block">किन तिर्ने</span>
                  <span className="block">बिचौलियालाई</span>
                  <span className="block text-gold">१ महिनाको भाडा?</span>
                </>
              )}
            </h2>
            <p className="text-base text-white/70 mt-4 leading-relaxed font-normal">
              {lang === 'en'
                ? 'Sarvabhoomi eliminates middlemen entirely. Renters connect directly with genuine property owners with 0% brokerage.'
                : 'बिचौलिया बिना घरधनी र भाडामा लिने बीच सिधा सम्पर्क र १००% सुरक्षित कारोबार।'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1: Renters */}
            <ScrollReveal delayMs={0}>
              <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 flex flex-col justify-between h-full hover:border-gold/60 transition-colors group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold text-black flex items-center justify-center font-black">
                      <Home className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gold bg-white/10 border border-gold/30 px-3 py-1 rounded-full">
                      {lang === 'en' ? '15 Free Unlocks' : '१५ निःशुल्क सम्पर्क'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">
                    {lang === 'en' ? 'For Home & Room Renters' : 'भाडामा लिनेहरूका लागि'}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-8">
                    {lang === 'en'
                      ? 'Browse verified rooms, flats and houses. Unlock direct owner phone numbers and request property visits directly with 0% brokerage.'
                      : 'प्रमाणित कोठा, फ्ल्याट र घरहरू खोज्नुहोस्। सिधै घरधनीको नम्बर अनलक गरी बिना दलाली शुल्क घर हेर्न जानुहोस्।'}
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gold text-black font-black text-xs uppercase tracking-wider transition-all hover:bg-gold/90 active:scale-97 min-h-touch"
                >
                  <span>{lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Card 2: Owners */}
            <ScrollReveal delayMs={60}>
              <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 flex flex-col justify-between h-full hover:border-gold/60 transition-colors group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-gold/40 text-gold flex items-center justify-center font-black">
                      <Building2 className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gold bg-white/10 border border-gold/30 px-3 py-1 rounded-full">
                      {lang === 'en' ? '100% Free' : '१००% निःशुल्क'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">
                    {lang === 'en' ? 'For Genuine Property Owners' : 'घरधनीहरूका लागि'}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-8">
                    {lang === 'en'
                      ? 'List your room, flat or house in 2 minutes for free. Receive direct inquiries from verified tenants without middleman interference.'
                      : 'आफ्नो कोठा, फ्ल्याट वा घर २ मिनेटमै निःशुल्क सूचीकृत गर्नुहोस्। दलाल बिना वास्तविक भाडावालहरूबाट सिधा सम्पर्क पाउनुहोस्।'}
                  </p>
                </div>
                <Link
                  href={user ? '/post-property' : '/auth?mode=signup'}
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all active:scale-97 min-h-touch"
                >
                  <span>{lang === 'en' ? 'Post Property Free' : 'सम्पत्ति सूचीकृत गर्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Card 3: Lalpurja Verification */}
            <ScrollReveal delayMs={120}>
              <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 flex flex-col justify-between h-full hover:border-gold/60 transition-colors group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-gold/40 text-gold flex items-center justify-center font-black">
                      <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gold bg-white/10 border border-gold/30 px-3 py-1 rounded-full">
                      {lang === 'en' ? 'GIS Certified' : 'नापी प्रमाणित'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">
                    {lang === 'en' ? 'Authentic Ownership Verification' : 'प्रमाणित स्वामित्व र कित्ता नापी'}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-8">
                    {lang === 'en'
                      ? 'Eliminate fake broker listings. We cross-verify government cadastral land registration (Lalpurja) and kitta parcel records for authentic peace of mind.'
                      : 'नक्कली बिचौलिया र दलालहरूको विज्ञापनबाट बच्नुहोस्। वास्तविक कित्ता नम्बर र लालपुर्जा प्रमाणित भएका घरहरू मात्र भाडामा लिनुहोस्।'}
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-all active:scale-97 min-h-touch"
                >
                  <span>{lang === 'en' ? 'Explore Verified' : 'प्रमाणित भाडा हेर्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 4: FEATURED RENTALS — LIVE SUPABASE SELECTION        */}
      {/* ============================================================ */}
      <section id="featured-listings" className="py-24 sm:py-32 lg:py-40 bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-4">
              <span className="w-2 h-2 rounded-full bg-gold" />
              <span>{lang === 'en' ? 'Curated Live Selection' : 'प्रमाणित प्रत्यक्ष भाडा'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {lang === 'en' ? (
                <>
                  <span className="block">Featured Rentals Direct from</span>
                  <span className="block text-gold">Genuine Landlords</span>
                </>
              ) : (
                <>
                  <span className="block">सिधै घरधनीबाट</span>
                  <span className="block text-gold">नेपालका उत्कृष्ट कोठा तथा घरहरू</span>
                </>
              )}
            </h2>
            <p className="text-base text-white/70 mt-4 leading-relaxed font-normal">
              {lang === 'en'
                ? "Every listing is direct from verified owners across Nepal's premier residential hubs. 0% broker commission guaranteed."
                : 'नेपालका प्रमुख आवासीय क्षेत्रहरूमा सिधै घरधनीबाट उपलब्ध भाडाका घरहरू। ०% दलाली ग्यारेन्टी।'}
            </p>
          </div>

          {/* Listings Grid: 1 column on mobile, 3 on desktop */}
          {loadingRentals ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white/[0.06] rounded-2xl border border-white/10 p-5 space-y-4 animate-pulse"
                >
                  <div className="aspect-[4/3] bg-white/10 rounded-xl" />
                  <div className="h-6 w-1/2 bg-white/10 rounded" />
                  <div className="h-4 w-3/4 bg-white/10 rounded" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-10 bg-white/10 rounded" />
                    <div className="h-10 bg-white/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredRentals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRentals.map((prop, idx) => (
                <ScrollReveal key={prop.id} delayMs={idx * 40}>
                  <PropertyCard
                    property={prop}
                    lang={lang}
                    onUnlock={() => router.push(`/properties/${prop.id}`)}
                  />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.06] border border-gold/30 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-card">
              <Home className="w-12 h-12 text-gold mx-auto mb-4 stroke-1" />
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === 'en' ? 'No active rental listings found.' : 'कुनै सक्रिय भाडाको सम्पत्ति फेला परेन।'}
              </h3>
              <p className="text-xs text-white/70 mb-6">
                {lang === 'en'
                  ? 'Be the first property owner to list in your area.'
                  : 'आफ्नो क्षेत्रको पहिलो घरधनी बनेर निःशुल्क विज्ञापन राख्नुहोस्।'}
              </p>
              <Link
                href="/post-property"
                className="px-6 py-3 rounded-xl bg-gold text-black font-black text-xs uppercase tracking-wider inline-flex items-center gap-2"
              >
                <span>{lang === 'en' ? 'Post Property Free' : 'सम्पत्ति सूचीकृत गर्नुहोस्'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Repeated Primary Action 3 */}
          <div className="mt-14 text-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-subtle hover:-translate-y-0.5 min-h-touch"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>{lang === 'en' ? 'Search All Rental Listings' : 'सबै भाडाका सूचीहरू खोज्नुहोस्'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 5: HOW IT WORKS — THREE NUMBERED STEPS (NO PHOTOS)   */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32 lg:py-40 bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-4">
              <span>✦</span>
              <span>{lang === 'en' ? 'Step-by-Step Process' : 'प्रक्रिया कसरी चल्छ'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {lang === 'en' ? (
                <>
                  <span className="block">How Direct Rentals Work</span>
                  <span className="block text-gold">in Three Steps</span>
                </>
              ) : (
                <>
                  <span className="block">तीन सरल चरणमा घर वा कोठा</span>
                  <span className="block text-gold">भाडामा लिनुहोस्</span>
                </>
              )}
            </h2>
            <p className="text-base text-white/70 mt-4 leading-relaxed font-normal">
              {lang === 'en'
                ? 'A transparent, secure peer-to-peer rental journey designed for Nepal.'
                : 'नेपालका लागि तयार पारिएको सुरक्षित र पारदर्शी प्रत्यक्ष भाडा प्रणाली।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 relative flex flex-col justify-between hover:border-gold/60 transition-colors shadow-card">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-gold/40 text-gold flex items-center justify-center">
                    <Search className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-3xl font-black text-gold/30 font-mono">01</span>
                </div>
                <h3 className="text-xl font-black text-white mb-3">
                  {lang === 'en' ? 'Discover & Filter' : 'खोज्नुहोस् र फिल्टर गर्नुहोस्'}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {lang === 'en'
                    ? 'Search across all 77 districts by locality, ward, monthly rent budget, and room/flat/house property subtype.'
                    : '७७ वटै जिल्लाका टोल, वडा, बजेट र सम्पत्ति प्रकार अनुसार आफूलाई मनपर्ने कोठा वा घर खोज्नुहोस्।'}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gold font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'en' ? 'Cadastral GIS verified' : 'नापी प्रमाणित सूची'}</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 relative flex flex-col justify-between hover:border-gold/60 transition-colors shadow-card">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-gold/40 text-gold flex items-center justify-center">
                    <KeyRound className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-3xl font-black text-gold/30 font-mono">02</span>
                </div>
                <h3 className="text-xl font-black text-white mb-3">
                  {lang === 'en' ? 'Unlock Landlord Contact' : 'घरधनी सम्पर्क खोल्नुहोस्'}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {lang === 'en'
                    ? 'Use your complimentary launch credits to unlock verified owner phone numbers and WhatsApp directly without brokers.'
                    : 'आफ्नो १५ निःशुल्क क्रेडिट प्रयोग गरी सिधै घरधनीको फोन नम्बर र ह्वाट्सएप अनलक गर्नुहोस्।'}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gold font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'en' ? '15 free unlocks on signup' : 'साइनअप गर्दा १५ क्रेडिट निःशुल्क'}</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 relative flex flex-col justify-between hover:border-gold/60 transition-colors shadow-card">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-gold/40 text-gold flex items-center justify-center">
                    <CalendarCheck2 className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <span className="text-3xl font-black text-gold/30 font-mono">03</span>
                </div>
                <h3 className="text-xl font-black text-white mb-3">
                  {lang === 'en' ? 'Visit & Move at 0% Fee' : 'घर हेर्नुहोस् र सर्नुहोस्'}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {lang === 'en'
                    ? 'Schedule a physical visit on your terms. Agree on terms directly with the landlord with zero middleman commission.'
                    : 'आफ्नो समय अनुकूल घर हेर्न जानुहोस् र शून्य दलाली शुल्कमा सिधै घरधनीसँग सम्झौता गर्नुहोस्।'}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gold font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'en' ? 'Save 1 full month of rent' : '१ महिनाको भाडा बचत'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 6: TRANSPARENCY COMPARISON TABLE                     */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32 lg:py-40 bg-black border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-black bg-gold px-3.5 py-1 rounded-full shadow-subtle inline-block mb-4">
              {lang === 'en' ? 'Direct Transparency' : 'प्रत्यक्ष पारदर्शिता'}
            </span>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {lang === 'en' ? (
                <>
                  <span className="block">The Sarvabhoomi</span>
                  <span className="block text-gold">Advantage</span>
                </>
              ) : (
                <>
                  <span className="block">सर्वभूमि प्रत्यक्ष बजारको</span>
                  <span className="block text-gold">फाइदाहरू</span>
                </>
              )}
            </h2>
            <p className="text-sm sm:text-base text-white/70 mt-4 leading-relaxed font-normal">
              {lang === 'en'
                ? 'On an average home rental in Nepal, tenants lose 1 full month of rent to brokers. Here is how Sarvabhoomi fixes it.'
                : 'नेपालमा घर वा कोठा भाडामा लिँदा १ महिना बराबरको भाडा दलाली कमिसनमा जान्छ। सर्वभूमिले यो समस्या समाधान गर्छ।'}
            </p>
          </div>

          {/* Subtle mobile scroll hint */}
          <div className="text-right text-[11px] font-bold text-white/50 pb-2 md:hidden">
            {lang === 'en' ? '← Swipe horizontally to compare →' : '← तुलना हेर्न दायाँ-बायाँ सार्नुहोस् →'}
          </div>

          <div className="bg-white/[0.06] border border-gold/30 rounded-3xl shadow-card overflow-x-auto scrollbar-thin">
            <div className="min-w-[580px]">
              <div className="grid grid-cols-3 bg-white/10 p-5 font-black text-xs uppercase tracking-wider text-white border-b border-gold/30">
                <div>{lang === 'en' ? 'Feature' : 'विशेषता'}</div>
                <div className="text-white/60">{lang === 'en' ? 'Traditional Brokers' : 'परम्परागत दलाल प्रणाली'}</div>
                <div className="text-gold">{lang === 'en' ? 'Sarvabhoomi Rent P2P' : 'सर्वभूमि प्रत्यक्ष बजार'}</div>
              </div>

              <div className="divide-y divide-white/10 text-xs sm:text-sm">
                <div className="grid grid-cols-3 p-5 items-center">
                  <span className="font-bold text-white">
                    {lang === 'en' ? 'Brokerage Fee' : 'दलाली शुल्क'}
                  </span>
                  <span className="text-white/60 font-semibold line-through">
                    {lang === 'en' ? '1 Month Rent (NPR 15k–1L)' : '१ महिनाको भाडा (१५ हजार – १ लाख)'}
                  </span>
                  <span className="text-gold font-black flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-gold stroke-[3]" />
                    <span className="bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded font-black">
                      {lang === 'en' ? 'NPR 0 (100% Free)' : 'रु. ० (१००% निःशुल्क)'}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-3 p-5 items-center bg-white/[0.02]">
                  <span className="font-bold text-white">
                    {lang === 'en' ? 'Owner Contact' : 'घरधनी सम्पर्क'}
                  </span>
                  <span className="text-white/60">
                    {lang === 'en' ? 'Hidden behind middleman' : 'बिचौलियाले लुकाउने'}
                  </span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-gold stroke-[3]" />
                    <span>{lang === 'en' ? 'Direct phone access' : 'प्रत्यक्ष फोन नम्बर'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 p-5 items-center">
                  <span className="font-bold text-white">
                    {lang === 'en' ? 'Property Visits' : 'सम्पत्ति भ्रमण'}
                  </span>
                  <span className="text-white/60">
                    {lang === 'en' ? 'Subject to broker convenience' : 'दलालको अनुकूलतामा निर्भर'}
                  </span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-gold stroke-[3]" />
                    <span>{lang === 'en' ? 'Schedule visit directly' : 'सिधै भ्रमण तालिका मिलाउनुहोस्'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 p-5 items-center bg-white/[0.02]">
                  <span className="font-bold text-white">
                    {lang === 'en' ? 'Rental Price Markup' : 'भाडा दर मूल्यवृद्धि'}
                  </span>
                  <span className="text-white/60">
                    {lang === 'en' ? 'Often inflated by middlemen' : 'बिचौलियाद्वारा बढाइएको भाडा'}
                  </span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-gold stroke-[3]" />
                    <span>{lang === 'en' ? 'Genuine owner quoted rent' : 'घरधनीको वास्तविक दर'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 7: FREQUENTLY ASKED QUESTIONS (FAQ)                  */}
      {/* ============================================================ */}
      <section id="faqs" className="py-24 sm:py-32 lg:py-40 bg-black border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-widest mb-4">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Institutional Clarity' : 'प्रश्नोत्तर'}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.08]">
              {lang === 'en' ? (
                <>
                  <span className="block">Frequently</span>
                  <span className="block">Asked</span>
                  <span className="block text-gold">Questions</span>
                </>
              ) : (
                <>
                  <span className="block">प्रायः सोधिने</span>
                  <span className="block text-gold">महत्त्वपूर्ण प्रश्नहरू</span>
                </>
              )}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.06] border border-white/10 hover:border-gold/40 transition-colors shadow-card">
              <h3 className="font-black text-base sm:text-lg text-white mb-2">
                {lang === 'en'
                  ? 'Is Sarvabhoomi truly 0% brokerage for tenants and owners?'
                  : 'के सर्वभूमि साँच्चै भाडामा लिने र दिने दुवैका लागि ०% दलाली हो?'}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                {lang === 'en'
                  ? 'Yes, 100%. Sarvabhoomi operates on a direct peer-to-peer (P2P) model. Neither tenants nor property owners pay any percentage-based commission on rent or lease transactions.'
                  : 'हो, १००%। सर्वभूमि प्रत्यक्ष मोडलमा चल्छ। भाडामा लिने वा घरधनी कसैले पनि कुनै पनि प्रकारको प्रतिशत कमिसन तिर्नु पर्दैन।'}
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.06] border border-white/10 hover:border-gold/40 transition-colors shadow-card">
              <h3 className="font-black text-base sm:text-lg text-white mb-2">
                {lang === 'en'
                  ? 'How do the 15 free contact unlock credits work?'
                  : '१५ निःशुल्क सम्पर्क अनलक क्रेडिटले कसरी काम गर्छ?'}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                {lang === 'en'
                  ? 'Every new verified user receives 15 complimentary contact unlock credits upon mobile registration. Each credit allows you to unlock 1 verified property owner direct phone number and WhatsApp contact for 90 days.'
                  : 'प्रत्येक नयाँ प्रयोगकर्तालाई दर्ता गर्दा १५ निःशुल्क सम्पर्क क्रेडिट दिइन्छ। १ क्रेडिट बराबर १ प्रमाणित घरधनीको फोन र ह्वाट्सएप ९० दिनका लागि अनलक हुन्छ।'}
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.06] border border-white/10 hover:border-gold/40 transition-colors shadow-card">
              <h3 className="font-black text-base sm:text-lg text-white mb-2">
                {lang === 'en'
                  ? 'How does Lalpurja ownership verification protect me?'
                  : 'लालपुर्जा प्रमाणीकरणले मलाई कसरी सुरक्षित बनाउँछ?'}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                {lang === 'en'
                  ? 'We verify property title credentials, official survey maps, and government land ownership records (Lalpurja) before issuing the Gold Verified seal, eliminating deceptive middleman listings.'
                  : 'हामी सरकारी नापी कित्ता र लालपुर्जा कागजात जाँच गरेर मात्र सुनौलो प्रमाणित ब्याज दिन्छौं, जसले गर्दा नक्कली विज्ञापनबाट पूर्ण सुरक्षा मिल्छ।'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <Footer lang={lang} />
    </div>
  );
}
