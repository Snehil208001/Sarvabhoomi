'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  Phone,
  Layers,
  Globe2,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Landmark,
  Coins,
  Search,
  Home,
  Tag,
  Compass,
  Building,
  Check,
  ChevronRight,
  PhoneCall,
  PlusCircle,
  Calculator,
  HelpCircle,
  FileCheck2,
  User,
  UserPlus,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  getAuthDict,
  HILLY_DISTRICTS,
  TERAI_DISTRICTS,
  LAND_MEASUREMENT_SYSTEM_INFO,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';

type SearchCategory = 'land' | 'house' | 'commercial' | 'valuation';

export default function HomePage() {
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  // Authenticated user state
  const [user, setUser] = useState<{ id: string; fullName?: string; credits?: number } | null>(null);

  // Search Engine Interactive State
  const [activeTab, setActiveTab] = useState<SearchCategory>('land');
  const [selectedHub, setSelectedHub] = useState('Kathmandu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Check Supabase session on mount
  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, preferred_district')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser({
            id: authUser.id,
            fullName: profile?.full_name || 'Verified Investor',
            credits: sub?.credits_remaining ?? 15,
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

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ne' : 'en'));
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryTerm = searchQuery.trim() || selectedHub;
    setSearchFeedback(
      lang === 'en'
        ? `Searching verified direct-owner ${activeTab} listings in ${queryTerm}...`
        : `${queryTerm} मा प्रमाणित प्रत्यक्ष जग्गाधनीका सूचीहरू खोजिँदैछ...`
    );
    setTimeout(() => {
      setSearchFeedback(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      {/* ============================================================ */}
      {/* 1. TOP INSTITUTIONAL NAVBAR (NOBROKER CLEAN & SPACIOUS) */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl sm:text-2xl shadow-xs ring-4 ring-emerald-50 select-none group-hover:bg-emerald-700 transition-colors">
              स
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg whitespace-nowrap">
                  Sarvabhoomi
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                  0% Brokerage
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap">
                {lang === 'en' ? 'Direct P2P Real Estate' : 'शून्य-दलाली घरजग्गा बजार'}
              </p>
            </div>
          </Link>

          {/* Center: Concise Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-600 shrink-0">
            <a href="#how-it-works" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
            </a>
            <a href="#featured-listings" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Verified Land' : 'प्रमाणित जग्गा'}
            </a>
            <a href="#valuation-tracker" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Valuation & Kitta' : 'कित्ता नापी नक्सा'}
            </a>
            <a href="#faqs" className="hover:text-emerald-700 transition-colors whitespace-nowrap">
              {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
            </a>
          </nav>

          {/* Right: Actions, Auth & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Post Free Property Badge */}
            <Link
              href={user ? '/dashboard' : '/auth'}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-emerald-600 bg-emerald-50/90 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{lang === 'en' ? 'Post Free Property' : 'जग्गा राख्नुहोस्'}</span>
            </Link>

            {/* Authentication Actions: Log In & Sign Up */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap"
                  title="Go to Dashboard Console"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden md:inline font-semibold">{user.fullName}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    {user.credits} Credits
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold"
                  title={lang === 'en' ? 'Log Out' : 'लगआउट'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Log In Link */}
                <Link
                  href="/auth"
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
                >
                  {lang === 'en' ? 'Log In' : 'लगइन'}
                </Link>

                {/* Sign Up Primary CTA Button */}
                <Link
                  href="/auth"
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm active:scale-95 whitespace-nowrap"
                >
                  {lang === 'en' ? 'Sign Up' : 'साइन अप'}
                </Link>
              </div>
            )}

            {/* Bilingual Switcher */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-xs whitespace-nowrap"
              title="Toggle Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION & NOBROKER-STYLE SEARCH ENGINE */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-slate-100 py-12 sm:py-20 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Launch Benefit Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-sm">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>
              {lang === 'en'
                ? 'Launch Offer: 15 Free Landowner Contact-Unlock Credits for New Users'
                : 'लन्च अफर: नयाँ प्रयोगकर्ताहरूलाई १५ निःशुल्क जग्गाधनी सम्पर्क क्रेडिट'}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            {lang === 'en' ? (
              <>
                Buy & Sell Property in Nepal with{' '}
                <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-8">
                  Zero Brokerage
                </span>
              </>
            ) : (
              <>
                नेपालको पहिलो{' '}
                <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy underline-offset-8">
                  बिना दलाल
                </span>{' '}
                प्रत्यक्ष घरजग्गा बजार
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {lang === 'en'
              ? 'Connect directly with verified landowners across Kathmandu Valley and Terai. Save lakhs in broker commissions with verified cadastral Kitta plot boundaries.'
              : 'काठमाडौँ उपत्यका तथा तराईका प्रमाणित जग्गाधनीसँग सिधै सम्पर्क गर्नुहोस्। नापी शाखाको कित्ता नक्सा सहित लाखौँ रुपैयाँ दलाली कमिसन बचत गर्नुहोस्।'}
          </p>

          {/* ======================================================== */}
          {/* NOBROKER SEARCH ENGINE CONTAINER */}
          {/* ======================================================== */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-4 sm:p-6 text-left mt-6">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('land')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'land'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>🏔️</span>
                <span>{lang === 'en' ? 'Buy Land / Ghaderi' : 'जग्गा / घडेरी खरिद'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('house')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'house'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>🏡</span>
                <span>{lang === 'en' ? 'Buy House / Villa' : 'घर / भिल्ला खरिद'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('commercial')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'commercial'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>🏢</span>
                <span>{lang === 'en' ? 'Commercial Land' : 'व्यावसायिक जग्गा'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('valuation')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 ${
                  activeTab === 'valuation'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>📈</span>
                <span>{lang === 'en' ? 'Valuation Tracker' : 'मूल्याङ्कन दर'}</span>
              </button>
            </div>

            {/* Search Input Row */}
            <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col md:flex-row items-center gap-3">
              {/* Major District Selector */}
              <div className="w-full md:w-56 relative shrink-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {lang === 'en' ? 'Hub / District' : 'जिल्ला / क्षेत्र'}
                </label>
                <div className="relative">
                  <select
                    value={selectedHub}
                    onChange={(e) => setSelectedHub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 appearance-none focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="Kathmandu">Kathmandu (काठमाडौँ)</option>
                    <option value="Lalitpur">Lalitpur (ललितपुर)</option>
                    <option value="Bhaktapur">Bhaktapur (भक्तपुर)</option>
                    <option value="Kaski">Pokhara / Kaski (पोखरा)</option>
                    <option value="Chitwan">Chitwan (चितवन)</option>
                    <option value="Rupandehi">Rupandehi / Butwal (बुटवल)</option>
                    <option value="Jhapa">Jhapa (झापा)</option>
                    <option value="Morang">Morang / Biratnagar (विराटनगर)</option>
                    <option value="Kavrepalanchok">Kavre / Banepa (काभ्रे)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Keyword / Locality Search */}
              <div className="w-full flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {lang === 'en' ? 'Locality, Ward or Landmark' : 'टोल, वडा वा चोक'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'e.g., Budhanilkantha, Baneshwor Ward 10, Tikathali...'
                        : 'उदा. बुढानीलकण्ठ, बानेश्वर वडा १०, टीकाथली...'
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Big Emerald Search CTA */}
              <div className="w-full md:w-auto md:self-end">
                <button
                  type="submit"
                  className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Search Properties' : 'सम्पत्ति खोज्नुहोस्'}</span>
                </button>
              </div>
            </form>

            {/* Interactive Feedback */}
            {searchFeedback && (
              <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{searchFeedback}</span>
              </div>
            )}
          </div>

          {/* Value Proposition Bar Under Hero */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 text-xs sm:text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? '0% Broker Commission' : '०% दलाल कमिसन'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? '100% Free Listing for Owners' : 'जग्गाधनीलाई निःशुल्क सूचीकरण'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Verified Cadastral Kitta Polygons' : 'नापी शाखाको प्रमाणित कित्ता नक्सा'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Direct Owner Phone Unlocks' : 'सिधै जग्गाधनी सम्पर्क'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. CONSUMER PILLARS (3 CORE ACTION CARDS) */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'en' ? 'How Sarvabhoomi Works for You' : 'सर्वभूमिले तपाईंलाई कसरी फाइदा पुर्‍याउँछ?'}
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            {lang === 'en'
              ? 'Eliminating intermediaries so landowners and buyers transact directly with complete legal and cadastral transparency.'
              : 'बिचौलिया बिना जग्गाधनी र खरिदकर्ता बीच सिधा सम्पर्क, पारदर्शी नापी नक्सा र १००% सुरक्षित कारोबार।'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: For Landowners */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group">
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
                {lang === 'en' ? 'For Property Owners & Sellers' : 'जग्गाधनी तथा बिक्रेताहरूका लागि'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {lang === 'en'
                  ? 'List your ancestral or acquired land/house in 2 minutes. Receive direct calls from verified cash buyers and NRN investors without paying a rupee in brokerage.'
                  : 'आफ्नो जग्गा वा घर २ मिनेटमै निःशुल्क सूचीकृत गर्नुहोस्। कुनै पनि कमिसन बिना सिधै वास्तविक खरिदकर्ता र एनआरएन लगानीकर्ताहरूबाट सम्पर्क पाउनुहोस्।'}
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              <span>{lang === 'en' ? 'Post Free Property' : 'जग्गा निःशुल्क राख्नुहोस्'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: For Property Buyers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Home className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {lang === 'en' ? '0% Commission' : '०% दलाली शुल्क'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'For Property Buyers & NRNs' : 'खरिदकर्ता तथा एनआरएनहरूका लागि'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {lang === 'en'
                  ? 'Browse verified Ghaderi plots with exact road access (pitched vs gravel), facing direction (Mohada), and cadastral Kitta boundary verification.'
                  : 'बाटोको चौडाइ (कालोपत्रे वा ग्राभेल), मोहाडा र नापी नक्सा सहित प्रमाणित घडेरीहरू खोज्नुहोस्। १५ निःशुल्क जग्गाधनी सम्पर्क क्रेडिटको फाइदा लिनुहोस्।'}
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              <span>{lang === 'en' ? 'Explore Verified Land' : 'प्रमाणित जग्गा हेर्नुहोस्'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 3: Wealth & Valuation Tracker */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {lang === 'en' ? 'Cadastral GIS' : 'नापी मूल्याङ्कन'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {lang === 'en' ? 'Land Wealth & Valuation Tracker' : 'जग्गा सम्पत्ति तथा मूल्याङ्कन ट्र्याकर'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                {lang === 'en'
                  ? 'Compare official Sarkari Mulyankan (Government Evaluation) against Chalti ko Bhau (Market Rate) across all 77 districts in Ropani or Bigha units.'
                  : '७७ वटै जिल्लाको सरकारी मूल्याङ्कन र चलनचल्तीको बजार मूल्य तुलना गर्नुहोस्। रोपनी वा बिघा प्रणाली अनुसार आफ्नो जग्गाको कुल मूल्य ट्र्याक गर्नुहोस्।'}
              </p>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>{lang === 'en' ? 'Check Land Valuation' : 'जग्गाको भाउ जाँच्नुहोस्'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. FEATURED VERIFIED DIRECT-OWNER LISTINGS */}
      {/* ============================================================ */}
      <section id="featured-listings" className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'en' ? 'Direct Owner Properties' : 'प्रत्यक्ष जग्गाधनी सूचीकरण'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'en' ? 'Featured Verified Plots in Nepal' : 'विशेष प्रमाणित घडेरी तथा प्लटहरू'}
              </h2>
            </div>
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800"
            >
              <span>{lang === 'en' ? 'View all direct listings' : 'सबै सूची हेर्नुहोस्'}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Listing 1: Kathmandu */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider bg-emerald-900/60 px-2.5 py-1 rounded-md">
                    Kathmandu Valley
                  </span>
                  <span className="text-xs font-semibold text-emerald-200">Kitta #342 Verified</span>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-slate-900">NPR 38 Lakh</span>
                    <span className="text-xs font-semibold text-slate-500">per Aana</span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">
                    Residential Plot in Budhanilkantha
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Budhanilkantha Ward 4, Kathmandu</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Area</span>
                      <span className="font-bold text-slate-800">4 Aana 2 Paisa</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Road</span>
                      <span className="font-bold text-slate-800">20ft Pitched</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Facing</span>
                      <span className="font-bold text-slate-800">East (पूर्व)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href="/auth"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Unlock Owner Contact' : 'जग्गाधनी नम्बर खोल्नुहोस्'}</span>
                </Link>
              </div>
            </div>

            {/* Listing 2: Chitwan */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider bg-slate-900/60 px-2.5 py-1 rounded-md">
                    Chitwan Plains
                  </span>
                  <span className="text-xs font-semibold text-emerald-300">Kitta #719 Verified</span>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-slate-900">NPR 85 Lakh</span>
                    <span className="text-xs font-semibold text-slate-500">per Kattha</span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">
                    Commercial Highway Plot in Bharatpur
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bharatpur-10, Bypass Road, Chitwan</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Area</span>
                      <span className="font-bold text-slate-800">1 Kattha 10 Dhur</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Road</span>
                      <span className="font-bold text-slate-800">40ft Highway</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Facing</span>
                      <span className="font-bold text-slate-800">North-East</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href="/auth"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Unlock Owner Contact' : 'जग्गाधनी नम्बर खोल्नुहोस्'}</span>
                </Link>
              </div>
            </div>

            {/* Listing 3: Lalitpur */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider bg-emerald-900/60 px-2.5 py-1 rounded-md">
                    Lalitpur Valley
                  </span>
                  <span className="text-xs font-semibold text-emerald-200">Kitta #114 Verified</span>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-black text-slate-900">NPR 45 Lakh</span>
                    <span className="text-xs font-semibold text-slate-500">per Aana</span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 mb-1">
                    South-Facing Corner Ghaderi in Bhaisepati
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bhaisepati Heights, Lalitpur</span>
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Area</span>
                      <span className="font-bold text-slate-800">5 Aana 1 Paisa</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Road</span>
                      <span className="font-bold text-slate-800">16ft Paved</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Facing</span>
                      <span className="font-bold text-slate-800">South (घाम लाग्ने)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href="/auth"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Unlock Owner Contact' : 'जग्गाधनी नम्बर खोल्नुहोस्'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. NOBROKER ADVANTAGE IN NEPAL COMPARISON TABLE */}
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
              ? 'On an average property deal of NPR 2 Crore in Nepal, buyers and sellers lose NPR 4–8 Lakhs to brokers. Here is how Sarvabhoomi fixes it.'
              : 'नेपालमा २ करोडको जग्गा किनबेच गर्दा ४ देखि ८ लाख रुपैयाँ दलाल कमिसनमा जान्छ। सर्वभूमिले यो समस्या कसरी समाधान गर्छ हेर्नुहोस्।'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 bg-slate-100/80 p-4 font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200">
            <div>{lang === 'en' ? 'Feature' : 'विशेषता'}</div>
            <div className="text-slate-500">{lang === 'en' ? 'Traditional Brokerage' : 'परम्परागत दलाल प्रणाली'}</div>
            <div className="text-emerald-800">{lang === 'en' ? 'Sarvabhoomi P2P' : 'सर्वभूमि प्रत्यक्ष बजार'}</div>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="grid grid-cols-3 p-4 items-center">
              <span className="font-semibold text-slate-900">Broker Commission</span>
              <span className="text-rose-600 font-medium">2% to 4% (NPR 2–8 Lakhs)</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>NPR 0 (100% Free)</span>
              </span>
            </div>

            <div className="grid grid-cols-3 p-4 items-center bg-slate-50/50">
              <span className="font-semibold text-slate-900">Landowner Contact</span>
              <span className="text-slate-500">Hidden behind middleman</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Direct phone access</span>
              </span>
            </div>

            <div className="grid grid-cols-3 p-4 items-center">
              <span className="font-semibold text-slate-900">Cadastral Kitta Maps</span>
              <span className="text-slate-500">Verbal promises</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Verified survey polygons</span>
              </span>
            </div>

            <div className="grid grid-cols-3 p-4 items-center bg-slate-50/50">
              <span className="font-semibold text-slate-900">Price Markup</span>
              <span className="text-rose-600 font-medium">Often inflated by agents</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>True owner quoted rate</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. FAQS SECTION */}
      {/* ============================================================ */}
      <section id="faqs" className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'en' ? 'Frequently Asked Questions' : 'प्रायः सोधिने प्रश्नहरू'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'en' ? 'Everything you need to know about Sarvabhoomi P2P real estate.' : 'सर्वभूमि सेवा सम्बन्धी सम्पूर्ण जानकारी।'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>How does Sarvabhoomi operate with zero brokerage?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Sarvabhoomi connects verified buyers and property owners directly via authenticated phone numbers and GIS maps. Landowners list their properties 100% free, and buyers unlock genuine landowner phone numbers using free credits.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>What are the 15 Free Contact-Unlock Credits?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Every newly registered and onboarded account receives 15 complimentary contact unlock credits valid for 90 days. Each credit lets you view the verified phone number of an owner directly.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/60">
              <h4 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>How are dual land measurement systems handled?</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                Nepal uses Ropani-Aana-Paisa-Daam across Kathmandu Valley and hill districts, and Bigha-Kattha-Dhur across Terai districts. Sarvabhoomi automatically detects the correct system based on the property location, while letting you switch anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. INSTITUTIONAL LIGHT FOOTER */}
      {/* ============================================================ */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg select-none">
                स
              </div>
              <span className="font-bold text-slate-900 text-sm">{dict.brand.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-slate-600 font-medium">
              <Link href="/auth" className="hover:text-emerald-700">Login / Sign Up</Link>
              <Link href="/dashboard" className="hover:text-emerald-700">Marketplace Console</Link>
              <a href="#how-it-works" className="hover:text-emerald-700">Why Zero Brokerage</a>
              <a href="#faqs" className="hover:text-emerald-700">FAQs</a>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
            <div>
              © 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. Kathmandu, Nepal. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>Verified Cadastral GIS Certified</span>
              <span>•</span>
              <span>Direct P2P Connections</span>
              <span>•</span>
              <span>0% Middleman Fees</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
