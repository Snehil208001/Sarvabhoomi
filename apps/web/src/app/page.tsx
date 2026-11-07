'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  MapPin,
  ArrowRight,
  Tag,
  Home,
  Check,
  HelpCircle,
  Coins,
  ChevronRight,
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      {/* 1. TOP NAVBAR */}
      <Navbar lang={lang} onToggleLang={toggleLang} currentUser={user} />

      {/* 2. DISTRICT TICKER MARQUEE (Black bar with Gold text & 30% border) */}
      <DistrictTicker />

      {/* ============================================================ */}
      {/* 3. HERO SECTION — SEARCH IS THE HERO (BLACK BACKGROUND)       */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-black py-16 sm:py-24 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Launch Benefit Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold shadow-subtle animate-reveal">
            <Coins className="w-4 h-4 text-gold stroke-[2.5]" />
            <span>
              {lang === 'en'
                ? 'Launch Offer: 15 Free Landlord Contact-Unlock Credits for Renters'
                : 'लन्च अफर: भाडामा लिनेहरूलाई १५ निःशुल्क घरधनी सम्पर्क अनलक क्रेडिट'}
            </span>
          </div>

          {/* Giant Display Headline (Clamp 40–72px desktop, 32px mobile) with ONE Gold highlight */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-[-0.03em] leading-[1.08] max-w-5xl mx-auto animate-reveal">
            {lang === 'en' ? (
              <>
                Rent Rooms, Flats & Houses in Nepal with{' '}
                <span className="inline-block text-gold underline decoration-gold/40 decoration-4 underline-offset-8">
                  Zero Brokerage
                </span>
              </>
            ) : (
              <>
                नेपालमा बिना दलाल कोठा, फ्ल्याट र घर{' '}
                <span className="inline-block text-gold underline decoration-gold/40 decoration-4 underline-offset-8">
                  शून्य शुल्कमा
                </span>{' '}
                भाडामा लिनुहोस्
              </>
            )}
          </h1>

          {/* Subtitle in White 70% */}
          <p className="text-base sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed font-normal">
            {lang === 'en'
              ? "Connect directly with verified property owners across Nepal. Save 1 month's rent in broker commission with verified Lalpurja ownership."
              : 'नेपालभरका प्रमाणित घरधनीहरूसँग सिधै सम्पर्क गर्नुहोस्। १ महिनाको भाडा बराबरको दलाली कमिसन बचत गर्नुहोस्।'}
          </p>

          {/* Floating Charcoal Search Card with Gold-30% Border */}
          <div className="max-w-4xl mx-auto bg-white/[0.06] border border-gold/30 rounded-3xl shadow-cardHover p-5 sm:p-7 text-left mt-8 backdrop-blur-md">
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

              {/* Big Gold Search CTA Button (Black Text, Contrast: 8.3:1) */}
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

          {/* Numbers Are Heroes: Count-Up Stats Row in Gold */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-white/10">
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
                <CountUp target={15} suffix={lang === 'en' ? ' Free' : ' निःशुल्क'} />
              </div>
              <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">
                <span className="inline-block border-b-2 border-gold/40 pb-0.5">
                  {lang === 'en' ? 'Contact Unlocks' : 'सम्पर्क अनलक'}
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-gold">
                <CountUp target={77} suffix={lang === 'en' ? ' Districts' : ' जिल्ला'} />
              </div>
              <div className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wider">
                <span className="inline-block border-b-2 border-gold/40 pb-0.5">
                  {lang === 'en' ? 'Nationwide Nepal' : 'देशव्यापी नेपाल'}
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
      {/* 4. HOW IT WORKS & 0% BROKERAGE (DARK SECTION)                 */}
      {/* ============================================================ */}
      <section id="how-it-works" className="bg-black text-white py-24 sm:py-32 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-3">
              <span>✦</span>
              <span>{lang === 'en' ? 'Direct P2P Model' : 'प्रत्यक्ष मोडल'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gold tracking-tight leading-tight">
              {lang === 'en' ? 'Why Pay 1 Month Rent to Middlemen?' : 'किन तिर्ने बिचौलियालाई १ महिनाको भाडा?'}
            </h2>
            <p className="text-base text-white/70 mt-4 leading-relaxed">
              {lang === 'en'
                ? 'Sarvabhoomi eliminates middlemen entirely. Renters connect directly with genuine property owners with 0% brokerage.'
                : 'बिचौलिया बिना घरधनी र भाडामा लिने बीच सिधा सम्पर्क र १००% सुरक्षित कारोबार।'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    <div className="w-14 h-14 rounded-2xl bg-white/10 text-gold border border-gold/30 flex items-center justify-center font-black">
                      <Tag className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gold bg-white/10 border border-gold/30 px-3 py-1 rounded-full">
                      {lang === 'en' ? '100% Free Listing' : '१००% निःशुल्क'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">
                    {lang === 'en' ? 'For Landlords & House Owners' : 'घरधनी तथा घरबेटीका लागि'}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-8">
                    {lang === 'en'
                      ? 'List your room, flat, house or commercial shop in 2 minutes. Receive direct enquiries and scheduled visit requests from verified tenants.'
                      : 'आफ्नो कोठा, फ्ल्याट वा घर २ मिनेटमै निःशुल्क सूचीकृत गर्नुहोस्। दलाल बिना वास्तविक भाडावालहरूबाट सिधा सम्पर्क पाउनुहोस्।'}
                  </p>
                </div>
                <Link
                  href={user?.userRole === 'RENTER' ? '/dashboard' : '/post-property'}
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-97 min-h-touch border border-white/20"
                >
                  <span>{lang === 'en' ? 'Post Property Free' : 'सम्पत्ति सूचीकृत गर्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Card 3: Ownership Verification */}
            <ScrollReveal delayMs={120}>
              <div className="bg-white/[0.06] border border-white/10 rounded-3xl p-8 flex flex-col justify-between h-full hover:border-gold/60 transition-colors group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold text-black flex items-center justify-center font-black">
                      <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-gold bg-white/10 border border-gold/30 px-3 py-1 rounded-full">
                      {lang === 'en' ? 'Lalpurja Verified' : 'लालपुर्जा प्रमाणित'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">
                    {lang === 'en' ? 'Authentic Ownership Verification' : 'प्रमाणित स्वामित्व र कित्ता नापी'}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-8">
                    {lang === 'en'
                      ? 'Say goodbye to fake agent listings. We verify cadastral Kitta plot details and land certificates so you rent from real owners.'
                      : 'नक्कली बिचौलिया र दलालहरूको विज्ञापनबाट बच्नुहोस्। वास्तविक कित्ता नम्बर र लालपुर्जा प्रमाणित भएका घरहरू मात्र भाडामा लिनुहोस्।'}
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-97 min-h-touch border border-white/20"
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
      {/* 5. FEATURED VERIFIED DIRECT-OWNER RENTALS (BLACK BG)          */}
      {/* ============================================================ */}
      <section id="featured-listings" className="py-24 sm:py-32 bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-gold uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                <span>{lang === 'en' ? 'Direct Landlord Properties' : 'प्रत्यक्ष घरधनी सूचीकरण'}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gold tracking-tight">
                {lang === 'en' ? 'Featured Rental Homes & Flats in Nepal' : 'नेपालका विशेष कोठा, फ्ल्याट तथा घरहरू'}
              </h2>
            </div>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 text-sm font-black text-white/90 hover:text-gold transition-colors min-h-touch"
            >
              <span>{lang === 'en' ? 'View all direct rentals' : 'सबै भाडाका सूची हेर्नुहोस्'}</span>
              <ChevronRight className="w-4 h-4 text-gold" />
            </Link>
          </div>

          {loadingRentals ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-80 rounded-2xl shimmer-box border border-white/10" />
              ))}
            </div>
          ) : featuredRentals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredRentals.map((prop, idx) => (
                <ScrollReveal key={prop.id} delayMs={idx * 60}>
                  <PropertyCard
                    property={prop}
                    lang={lang}
                    onUnlock={() => router.push(`/properties/${prop.id}`)}
                  />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/[0.04] rounded-3xl border border-white/10 p-8">
              <Home className="w-12 h-12 text-gold mx-auto mb-3" />
              <p className="text-base font-bold text-white">
                {lang === 'en' ? 'No active rental listings found.' : 'कुनै सक्रिय भाडाको सूची भेटिएन।'}
              </p>
              <Link
                href="/search"
                className="mt-3 inline-block text-xs font-black text-gold underline decoration-gold/40 decoration-2"
              >
                {lang === 'en' ? 'Browse all listings' : 'सबै सूची हेर्नुहोस्'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. TRANSPARENCY COMPARISON TABLE (CHARCOAL SURFACE BG)        */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32 bg-black border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-wider text-black bg-gold px-3.5 py-1 rounded-full shadow-subtle">
              {lang === 'en' ? 'Direct Transparency' : 'प्रत्यक्ष पारदर्शिता'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-gold tracking-tight mt-4">
              {lang === 'en' ? 'The Sarvabhoomi Advantage' : 'सर्वभूमिको प्रत्यक्ष फाइदा'}
            </h2>
            <p className="text-sm text-white/70 mt-2 font-medium">
              {lang === 'en'
                ? 'On an average home rental in Nepal, tenants lose 1 full month of rent to brokers. Here is how Sarvabhoomi fixes it.'
                : 'नेपालमा घर वा कोठा भाडामा लिँदा १ महिना बराबरको भाडा दलाली कमिसनमा जान्छ। सर्वभूमिले यो समस्या समाधान गर्छ।'}
            </p>
          </div>

          <div className="bg-white/[0.06] border border-gold/30 rounded-3xl shadow-card overflow-hidden">
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
      </section>

      {/* ============================================================ */}
      {/* 7. FAQS SECTION (BLACK BG)                                    */}
      {/* ============================================================ */}
      <section id="faqs" className="py-24 sm:py-32 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gold tracking-tight">
              {lang === 'en' ? 'Frequently Asked Questions' : 'प्रायः सोधिने प्रश्नहरू'}
            </h2>
            <p className="text-sm text-white/70 mt-2 font-medium">
              {lang === 'en' ? 'Everything you need to know about Sarvabhoomi rental marketplace.' : 'सर्वभूमि सेवा सम्बन्धी सम्पूर्ण जानकारी।'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.04]">
              <h4 className="font-black text-sm text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gold shrink-0 stroke-[2.5]" />
                <span>
                  {lang === 'en'
                    ? 'How does Sarvabhoomi operate with zero brokerage?'
                    : 'सर्वभूमिले कसरी ०% दलालीमा सेवा प्रदान गर्दछ?'}
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed pl-6 font-normal">
                {lang === 'en'
                  ? 'Sarvabhoomi connects renters and property owners directly without intermediaries. House owners list their flats, rooms, and houses 100% free, and renters use complimentary launch credits to contact landlords directly.'
                  : 'सर्वभूमिले कुनै पनि बिचौलिया बिना भाडामा बस्ने र घरधनीलाई सिधै जोड्छ। घरधनीले आफ्नो कोठा, फ्ल्याट वा घर निःशुल्क सूचीकृत गर्न सक्नुहुन्छ र भाडामा लिनेले निःशुल्क क्रेडिट प्रयोग गरी घरधनीसँग प्रत्यक्ष सम्पर्क गर्न सक्नुहुन्छ।'}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.04]">
              <h4 className="font-black text-sm text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gold shrink-0 stroke-[2.5]" />
                <span>
                  {lang === 'en'
                    ? 'What are the 15 Free Contact-Unlock Credits?'
                    : '१५ निःशुल्क सम्पर्क अनलक क्रेडिट के हुन्?'}
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed pl-6 font-normal">
                {lang === 'en'
                  ? 'Every newly registered Renter account receives 15 complimentary contact unlock credits valid for 90 days. Each credit lets you view the verified phone number of an owner directly.'
                  : 'प्रत्येक नयाँ दर्ता भएको खाताले ९० दिनको लागि मान्य हुने १५ निःशुल्क सम्पर्क अनलक क्रेडिट प्राप्त गर्दछ। प्रत्येक क्रेडिटबाट तपाईंले घरधनीको प्रमाणित फोन नम्बर सिधै हेर्न सक्नुहुन्छ।'}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.04]">
              <h4 className="font-black text-sm text-white mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-gold shrink-0 stroke-[2.5]" />
                <span>
                  {lang === 'en'
                    ? 'Can I switch between Renter and Owner roles?'
                    : 'के म भाडामा लिने (Renter) र घरधनी (Owner) भूमिका परिवर्तन गर्न सक्छु?'}
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed pl-6 font-normal">
                {lang === 'en'
                  ? 'To guarantee zero middleman interference, each phone number is bound to one role (either Renter or Owner). If you need both, you can register a separate phone number.'
                  : 'बिचौलियाको हस्तक्षेप शून्य राख्न, प्रत्येक मोबाइल नम्बर एक भूमिकामा मात्र बाँधिएको हुन्छ। यदि दुवै भूमिका आवश्यक भएमा छुट्टै फोन नम्बर प्रयोग गर्न सकिन्छ।'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <Footer lang={lang} />
    </div>
  );
}
