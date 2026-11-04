'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  Phone,
  Layers,
  Globe2,
  CheckCircle2,
  LogOut,
  TrendingUp,
  ArrowRight,
  Landmark,
  Coins,
  Building,
  Home,
  Tag,
  Compass,
  FileCheck2,
  Calendar,
  ExternalLink,
  Search,
  PlusCircle,
  Calculator,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  LAND_MEASUREMENT_SYSTEM_INFO,
  getAuthDict,
  UserIntent,
  PreferredRegion,
} from '@sarvabhoomi/shared';
import { supabase, Profile, UserSubscription } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [activeSystemOverride, setActiveSystemOverride] = useState<PreferredRegion | null>(null);

  // Land area calculator state
  const [calcInput, setCalcInput] = useState<number>(1);
  const [calcUnit, setCalcUnit] = useState<'ropani' | 'aana' | 'bigha' | 'kattha'>('ropani');

  // Load live authenticated profile & subscription from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      setLoading(true);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace('/auth');
          return;
        }

        // Fetch live row from public.profiles
        const { data: profileRow, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileErr || !profileRow || !profileRow.is_onboarded) {
          router.replace('/auth');
          return;
        }

        if (isMounted) {
          setProfile(profileRow);
          if (profileRow.preferred_lang) {
            setLang(profileRow.preferred_lang);
          }
        }

        // Fetch live row from public.user_subscriptions
        const { data: subRow } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (isMounted) {
          if (subRow) {
            setSubscription(subRow);
          } else {
            // Default 15 credits fallback if trigger pending
            setSubscription({
              id: 'sub-default',
              user_id: user.id,
              plan_tier: 'LAUNCH_PROMO',
              credits_remaining: 15,
              expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Error loading dashboard session:', err);
        router.replace('/auth');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.replace('/auth');
    }
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ne' : 'en'));
  };

  const activeRegion: PreferredRegion =
    activeSystemOverride || profile?.preferred_region || 'HILLY';
  const measurementSystem = LAND_MEASUREMENT_SYSTEM_INFO[activeRegion];
  const creditsRemaining = subscription?.credits_remaining ?? 15;

  const expirationFormatted = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '90 days from launch';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm ring-4 ring-emerald-100 select-none animate-pulse">
            स
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{lang === 'en' ? 'Loading Sarvabhoomi...' : 'सर्वभूमि खुल्दैछ...'}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* ============================================================ */}
      {/* TOP NAVIGATION BAR */}
      {/* ============================================================ */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Emblem + Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm ring-2 ring-emerald-100 select-none">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                  {dict.brand.name}
                </span>
                <span className="hidden xl:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  P2P Console
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {lang === 'en' ? 'Nepal Property Marketplace & Wealth Tracker' : 'नेपालको पहिलो शून्य-दलाली घरजग्गा प्लेटफर्म'}
              </p>
            </div>
          </div>

          {/* Right: Badges, Live Credits Wallet Pill & User Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-end">
            {/* User Full Name Chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-semibold text-slate-800">
                {profile?.full_name || 'Verified Investor'}
              </span>
            </div>

            {/* Primary District Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold">{profile?.preferred_district || 'Kathmandu'}</span>
            </div>

            {/* Active Measurement System Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-mono text-emerald-800 font-bold">
                {activeRegion === 'HILLY' ? 'HILLY: Ropani-Aana' : 'TERAI: Bigha-Kattha'}
              </span>
            </div>

            {/* Glowing Wallet Pill */}
            <div
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm hover:shadow transition-all select-none"
              title="Allocated via Stage 1 Launch Seeding Promo"
            >
              {/* Pulsing Emerald Dot */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>

              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold tracking-tight text-slate-900 whitespace-nowrap">
                {creditsRemaining}{' '}
                <span className="font-normal text-emerald-800">
                  {lang === 'en'
                    ? 'Free Contact Credits Remaining (Launch Offer)'
                    : 'निःशुल्क सम्पर्क क्रेडिट बाँकी (लन्च अफर)'}
                </span>
              </span>
            </div>

            {/* Bilingual Toggle Button */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
              title="Toggle Language"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Sign Out' : 'बाहिरिनुहोस्'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* MAIN DASHBOARD CONTENT */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Verification Success & Welcome Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border border-emerald-200 p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {lang === 'en' ? 'Identity Verified & Onboarding Complete' : 'प्रमाणीकरण सफल तथा खाता सक्रिय'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {lang === 'en' ? 'Namaste,' : 'नमस्ते,'}{' '}
                <span className="text-emerald-700">{profile?.full_name || 'Investor'}</span>!
              </h1>

              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                {lang === 'en'
                  ? `Your phone ${profile?.phone_np || ''} is securely linked. You are now authorized to unlock direct landowner contacts, examine cadastral survey sheets, and buy or sell property with zero intermediary brokerage.`
                  : `तपाईंको मोबाइल नम्बर ${profile?.phone_np || ''} सफलतापूर्वक प्रमाणित भएको छ। तपाईं अब बिना कुनै बिचौलिया सिधै जग्गाधनीसँग सम्पर्क गर्न, कित्ता नापी नक्सा हेर्न र सम्पत्ति किनबेच गर्न सक्नुहुन्छ।`}
              </p>
            </div>

            {/* Quick Metrics Pill Box */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <div className="w-full sm:w-auto p-4 rounded-xl bg-white border border-emerald-200 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 font-mono leading-none">
                    {creditsRemaining}{' '}
                    <span className="text-xs font-normal text-slate-500">/ 15</span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                    {lang === 'en' ? 'Direct Contact Unlocks' : 'प्रत्यक्ष सम्पर्क अनलक'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Promotional Credit Wallet */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'en' ? 'Contact Credits Wallet' : 'सम्पर्क क्रेडिट वालेट'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  STAGE 1 PROMO
                </span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-black font-mono text-emerald-700">
                  {creditsRemaining}
                  <span className="text-sm font-normal text-slate-500 ml-1">Credits</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? '1 Credit = 1 Verified Landowner Direct Phone Unlock'
                    : '१ क्रेडिट = १ प्रमाणित जग्गाधनी प्रत्यक्ष फोन नम्बर अनलक'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (creditsRemaining / 15) * 100)}%` }}
                />
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{lang === 'en' ? 'Plan Tier' : 'योजना'}:</span>
                  <span className="font-semibold text-slate-900">{subscription?.plan_tier || 'LAUNCH_PROMO'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{lang === 'en' ? 'Valid Until' : 'म्याद'}:</span>
                  <span className="font-semibold text-slate-900">{expirationFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{lang === 'en' ? 'Zero Commission' : 'शून्य दलाली'}:</span>
                  <span className="font-semibold text-emerald-700">100% Guaranteed</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'en'
                  ? 'No hidden broker commission on any closed transaction.'
                  : 'कुनै पनि कारोबारमा बिचौलिया शुल्क वा कमिसन लाग्ने छैन।'}
              </span>
            </div>
          </div>

          {/* Card 2: User Profile & Intent Specifications */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'en' ? 'Profile & Preferences' : 'प्रोफाइल तथा प्राथमिकता'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  VERIFIED
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">
                    {lang === 'en' ? 'Full Legal Name' : 'पूरा कानुनी नाम'}
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {profile?.full_name || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">
                    {lang === 'en' ? 'Verified Mobile' : 'प्रमाणित मोबाइल'}
                  </span>
                  <span className="font-mono text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {profile?.phone_np}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">
                    {lang === 'en' ? 'Primary Focus District' : 'प्राथमिक जिल्ला'}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {profile?.preferred_district || 'Kathmandu'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">
                    {lang === 'en' ? 'User Objective / Role' : 'प्रयोगकर्ताको उद्देश्य'}
                  </span>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-medium">
                    {profile?.user_intent === 'BUYER' ? (
                      <>
                        <Home className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Direct Buyer (0% Commission)</span>
                      </>
                    ) : profile?.user_intent === 'OWNER' ? (
                      <>
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Property Owner (Free Listing)</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Investor / NRN Wealth Tracker</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{lang === 'en' ? 'System Mode' : 'प्रणाली'}:</span>
              <span className="text-emerald-700 font-semibold">Active Production</span>
            </div>
          </div>

          {/* Card 3: Active Land Measurement System Breakdown */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'en' ? 'Land Units System' : 'जग्गा नापी प्रणाली'}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSystemOverride('HILLY')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      activeRegion === 'HILLY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    HILLY
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSystemOverride('TERAI')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      activeRegion === 'TERAI'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    TERAI
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs uppercase tracking-wider text-slate-500 mb-0.5 font-medium">
                  {lang === 'en' ? 'Active System' : 'सक्रिय प्रणाली'}
                </div>
                <div className="text-base font-bold text-slate-900">
                  {lang === 'en' ? measurementSystem.systemName : measurementSystem.systemNameNe}
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {measurementSystem.description}
                </p>
              </div>

              {/* Hierarchy breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
                {activeRegion === 'HILLY' ? (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-emerald-700 font-bold">1 Ropani (रोपनी)</span>
                      <span>= 16 Aana (५,४७६ sq ft)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-emerald-700 font-bold">1 Aana (आना)</span>
                      <span>= 4 Paisa (३४२.२५ sq ft)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-emerald-700 font-bold">1 Paisa (पैसा)</span>
                      <span>= 4 Daam (८५.५६ sq ft)</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>1 Daam (दाम)</span>
                      <span>= 21.39 sq ft</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-emerald-700 font-bold">1 Bigha (बिघा)</span>
                      <span>= 20 Kattha (७२,९०० sq ft)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-emerald-700 font-bold">1 Kattha (कट्ठा)</span>
                      <span>= 20 Dhur (३,६४५ sq ft)</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-emerald-700 font-bold">1 Dhur (धुर)</span>
                      <span>= 182.25 sq ft</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>1 Kattha</span>
                      <span>= 338.63 sq meters</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              {lang === 'en'
                ? 'Toggle above to preview land units in either Hilly or Terai notation.'
                : 'पहाड वा तराई जुनसुकै प्रणालीमा एकाइ हेर्न माथिको बटन थिच्नुहोस्।'}
            </div>
          </div>
        </section>

        {/* Interactive Quick Actions Bar */}
        <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {lang === 'en' ? 'Direct P2P Marketplace Actions' : 'प्रत्यक्ष बजार सुविधाहरू'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'en'
                  ? 'Connect directly with verified landowners using your free allocated credits.'
                  : 'आफ्नो निःशुल्क क्रेडिट प्रयोग गरी सिधै जग्गाधनीसँग सम्पर्क गर्नुहोस्।'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Action 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {lang === 'en' ? 'Browse Direct Listings' : 'जग्गा तथा घर सूची हेर्नुहोस्'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                {lang === 'en'
                  ? `Search verified land and residential properties across ${profile?.preferred_district || 'Kathmandu'}.`
                  : `${profile?.preferred_district || 'काठमाडौँ'} लगायतका क्षेत्रमा प्रमाणित जग्गा खोज्नुहोस्।`}
              </p>
              <button
                type="button"
                onClick={() => alert(lang === 'en' ? 'Opening direct listings directory...' : 'प्रत्यक्ष सूचीकरण खुल्दैछ...')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:underline"
              >
                <span>{lang === 'en' ? 'Search Listings' : 'खोज्नुहोस्'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 2 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {lang === 'en' ? 'List Your Property Free' : 'आफ्नो जग्गा निःशुल्क राख्नुहोस्'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                {lang === 'en'
                  ? 'Sell directly to cash buyers and NRN investors. 100% free listing with zero broker fees.'
                  : 'वास्तविक खरिदकर्ता र एनआरएन लगानीकर्ताहरूलाई सिधै बिक्री गर्नुहोस्। ०% दलाली।'}
              </p>
              <button
                type="button"
                onClick={() => alert(lang === 'en' ? 'Property listing wizard...' : 'जग्गा दर्ता फारम...')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:underline"
              >
                <span>{lang === 'en' ? 'Create Listing' : 'दर्ता गर्नुहोस्'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 3 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                {lang === 'en' ? 'Cadastral GIS Map Sheets' : 'कित्ता नापी नक्सा हेर्नुहोस्'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                {lang === 'en'
                  ? 'Inspect cadastral parcel boundaries, road access width, and valuation heatmaps.'
                  : 'नापी शाखाको आधिकारिक कित्ता, बाटोको चौडाइ र मूल्याङ्कन नक्सा निरीक्षण गर्नुहोस्।'}
              </p>
              <button
                type="button"
                onClick={() => alert(lang === 'en' ? 'Opening GIS map viewer...' : 'जीआईएस नक्सा खुल्दैछ...')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group-hover:underline"
              >
                <span>{lang === 'en' ? 'Open Cadastral Map' : 'नक्सा खोल्नुहोस्'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Live Land Area Converter Utility */}
        <section className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {lang === 'en' ? 'Nepal Land Measurement Quick Calculator' : 'नेपाल जग्गा नापी क्याल्कुलेटर'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {lang === 'en' ? 'Enter Quantity' : 'परिमाण'}
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={calcInput}
                onChange={(e) => setCalcInput(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {lang === 'en' ? 'Unit' : 'एकाइ'}
              </label>
              <select
                value={calcUnit}
                onChange={(e) => setCalcUnit(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
              >
                <option value="ropani">Ropani (रोपनी)</option>
                <option value="aana">Aana (आना)</option>
                <option value="bigha">Bigha (बिघा)</option>
                <option value="kattha">Kattha (कट्ठा)</option>
              </select>
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <div className="text-emerald-800 font-medium">
                {lang === 'en' ? 'Standard Area Equivalent:' : 'क्षेत्रफल बराबर:'}
              </div>
              <div className="font-mono text-emerald-900 font-bold text-sm">
                {calcUnit === 'ropani' &&
                  `${(calcInput * 5476).toLocaleString()} sq. ft. (~${(calcInput * 508.72).toFixed(1)} m²) • ${(calcInput * 16).toFixed(1)} Aana`}
                {calcUnit === 'aana' &&
                  `${(calcInput * 342.25).toLocaleString()} sq. ft. (~${(calcInput * 31.8).toFixed(1)} m²) • ${(calcInput / 16).toFixed(3)} Ropani`}
                {calcUnit === 'bigha' &&
                  `${(calcInput * 72900).toLocaleString()} sq. ft. (~${(calcInput * 6772.63).toFixed(1)} m²) • ${(calcInput * 20).toFixed(1)} Kattha`}
                {calcUnit === 'kattha' &&
                  `${(calcInput * 3645).toLocaleString()} sq. ft. (~${(calcInput * 338.63).toFixed(1)} m²) • ${(calcInput * 20).toFixed(1)} Dhur`}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Institutional Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. Kathmandu, Nepal.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Kathmandu Cadastral GIS Certified</span>
            <span>•</span>
            <span>15 Contact Credits Active</span>
            <span>•</span>
            <span>0% Broker Commission</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
