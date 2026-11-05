'use client';

import React, { useEffect, useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  Phone,
  PhoneCall,
  MessageCircle,
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
  Heart,
  Eye,
  KeyRound,
  Trash2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Lock,
  Unlock,
  Check,
} from 'lucide-react';
import {
  LAND_MEASUREMENT_SYSTEM_INFO,
  getAuthDict,
  UserIntent,
  PreferredRegion,
  Property,
  formatPriceNPR,
  formatArea,
  toSqFt,
  fromSqFt,
  ALL_NEPAL_DISTRICTS,
  getRegionForDistrict,
} from '@sarvabhoomi/shared';
import { supabase, Profile, UserSubscription } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';

type DashboardTab = 'my-listings' | 'shortlist' | 'wallet' | 'profile';

interface UnlockedContactRecord {
  id: string;
  property_id: string;
  owner_id: string;
  unlocked_at: string;
  credits_spent: number;
  property?: {
    id: string;
    title: string;
    kitta_no?: string;
    district: string;
    locality: string;
    listing_type: string;
    price_npr: number;
  };
  owner?: {
    full_name: string;
    phone_np: string;
  };
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as DashboardTab) || 'my-listings';

  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Live data states
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [shortlistedProperties, setShortlistedProperties] = useState<Property[]>([]);
  const [unlockedContacts, setUnlockedContacts] = useState<UnlockedContactRecord[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingShortlist, setLoadingShortlist] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [tableMissingNotice, setTableMissingNotice] = useState<string | null>(null);

  // Status mutation state
  const [updatingPropertyId, setUpdatingPropertyId] = useState<string | null>(null);

  // Contact Unlock Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedPropertyForContact, setSelectedPropertyForContact] = useState<Property | null>(null);

  // Profile preferences form state
  const [profileDistrict, setProfileDistrict] = useState('Kathmandu');
  const [profileRegion, setProfileRegion] = useState<PreferredRegion>('HILLY');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Interactive Land Calculator State
  const [calcInput, setCalcInput] = useState<number>(1);
  const [calcUnit, setCalcUnit] = useState<'ROPANI' | 'AANA' | 'BIGHA' | 'KATTHA' | 'SQFT'>('ROPANI');

  // Handle tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as DashboardTab;
    if (tabParam && ['my-listings', 'shortlist', 'wallet', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load authenticated user and their profile
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
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

        if (profileErr) {
          if (profileErr.message?.includes('schema cache') || profileErr.code === 'PGRST205') {
            setTableMissingNotice(
              'Database tables need to be created in your Supabase project. Run supabase/init_sarvabhoomi.sql in the Supabase SQL Editor.'
            );
          }
        }

        if (isMounted && profileRow) {
          setProfile(profileRow);
          setProfileDistrict(profileRow.preferred_district || 'Kathmandu');
          setProfileRegion(profileRow.preferred_region || 'HILLY');
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

        // Load data for all tabs
        if (isMounted && user) {
          loadUserListings(user.id);
          loadUserShortlist(user.id);
          loadUserWalletHistory(user.id);
        }
      } catch (err) {
        console.error('Error loading dashboard session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // 1. Fetch User's Listings
  const loadUserListings = async (userId: string) => {
    setLoadingListings(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMyProperties(data as Property[]);
      }
    } catch (e) {
      console.warn('Error loading user properties:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  // 2. Fetch User's Shortlist
  const loadUserShortlist = async (userId: string) => {
    setLoadingShortlist(true);
    try {
      const { data: favs, error: favError } = await supabase
        .from('property_favourites')
        .select('property_id')
        .eq('user_id', userId);

      if (!favError && favs && favs.length > 0) {
        const propIds = favs.map((f) => f.property_id);
        const { data: props, error: propsError } = await supabase
          .from('properties')
          .select('*')
          .in('id', propIds);

        if (!propsError && props) {
          setShortlistedProperties(props as Property[]);
        }
      } else {
        setShortlistedProperties([]);
      }
    } catch (e) {
      console.warn('Error loading shortlist:', e);
    } finally {
      setLoadingShortlist(false);
    }
  };

  // 3. Fetch User's Contact Unlock History
  const loadUserWalletHistory = async (userId: string) => {
    setLoadingWallet(true);
    try {
      const { data, error } = await supabase
        .from('contact_unlocks')
        .select(`
          id,
          property_id,
          owner_id,
          unlocked_at,
          credits_spent,
          property:properties(id, title, kitta_no, district, locality, listing_type, price_npr),
          owner:profiles!contact_unlocks_owner_id_fkey(full_name, phone_np)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (!error && data) {
        setUnlockedContacts(data as unknown as UnlockedContactRecord[]);
      }
    } catch (e) {
      console.warn('Error loading contact unlocks:', e);
    } finally {
      setLoadingWallet(false);
    }
  };

  // Quick Action: Update Property Status (ACTIVE, PAUSED, SOLD)
  const handleUpdateStatus = async (propertyId: string, newStatus: 'ACTIVE' | 'PAUSED' | 'SOLD') => {
    setUpdatingPropertyId(propertyId);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (!error) {
        setMyProperties((prev) =>
          prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingPropertyId(null);
    }
  };

  // Quick Action: Remove from Shortlist
  const handleRemoveFromShortlist = async (propertyId: string) => {
    if (!profile) return;
    try {
      await supabase
        .from('property_favourites')
        .delete()
        .eq('user_id', profile.id)
        .eq('property_id', propertyId);

      setShortlistedProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (err) {
      console.error('Error removing from shortlist:', err);
    }
  };

  // Quick Action: Save Profile & Region Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_district: profileDistrict,
          preferred_region: profileRegion,
          preferred_lang: lang,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (!error) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                preferred_district: profileDistrict,
                preferred_region: profileRegion,
                preferred_lang: lang,
              }
            : null
        );
        setProfileSuccessMsg(
          lang === 'en'
            ? 'Preferences updated successfully!'
            : 'प्राथमिकता सफलतापूर्वक अद्यावधिक गरियो!'
        );
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Sign out
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

  const creditsRemaining = subscription?.credits_remaining ?? 15;
  const activeRegion = profile?.preferred_region || profileRegion || 'HILLY';
  const measurementSystem = LAND_MEASUREMENT_SYSTEM_INFO[activeRegion];

  const expirationFormatted = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '90 days from launch';

  // Calculator computations
  const sqftVal = toSqFt(calcInput || 0, calcUnit);
  const ropaniVal = fromSqFt(sqftVal, 'ROPANI');
  const aanaVal = fromSqFt(sqftVal, 'AANA');
  const bighaVal = fromSqFt(sqftVal, 'BIGHA');
  const katthaVal = fromSqFt(sqftVal, 'KATTHA');
  const sqMeters = (sqftVal * 0.092903).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm ring-4 ring-emerald-100 select-none animate-pulse">
          स
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
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Emblem + Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm ring-2 ring-emerald-100 select-none group-hover:scale-105 transition-transform">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                  {dict.brand.name}
                </span>
                <span className="hidden xl:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Dashboard
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {lang === 'en' ? 'Direct P2P Real Estate Console' : 'शून्य-दलाली घरजग्गा ड्यासबोर्ड'}
              </p>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/search" className="hover:text-emerald-700 flex items-center gap-1.5 transition-colors">
              <Search className="w-4 h-4" />
              <span>{lang === 'en' ? 'Browse Marketplace' : 'सम्पत्ति खोज्नुहोस्'}</span>
            </Link>
            <Link href="/post-property" className="hover:text-emerald-700 flex items-center gap-1.5 transition-colors">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Post Free Property' : 'निःशुल्क विज्ञापन दिनुहोस्'}</span>
            </Link>
          </div>

          {/* Right: Wallet pill & User controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-end">
            {/* User Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                {profile?.full_name || 'Verified User'}
              </span>
            </div>

            {/* Glowing Wallet Pill (Click to open Wallet tab) */}
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-sm transition-all"
              title="View credits wallet"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-900">{creditsRemaining}</span>
              <span className="text-[11px] text-emerald-700 hidden sm:inline">
                {lang === 'en' ? 'Credits' : 'क्रेडिट'}
              </span>
            </button>

            {/* Bilingual Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
            >
              <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
            </button>

            {/* Post CTA */}
            <Link
              href="/post-property"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Post Property' : 'जग्गा राख्नुहोस्'}</span>
            </Link>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Exit' : 'बाहिरिनुहोस्'}</span>
            </button>
          </div>
        </div>

        {/* Tab Bar Header */}
        <div className="border-t border-slate-200 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-semibold flex-nowrap">
              <button
                type="button"
                onClick={() => setActiveTab('my-listings')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all whitespace-nowrap min-h-touch ${
                  activeTab === 'my-listings'
                    ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'en' ? 'My Listings' : 'मेरा सम्पत्तिहरू'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                  {myProperties.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('shortlist')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all whitespace-nowrap min-h-touch ${
                  activeTab === 'shortlist'
                    ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>{lang === 'en' ? 'My Shortlist' : 'सुरक्षित गरिएका सूची'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                  {shortlistedProperties.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all whitespace-nowrap min-h-touch ${
                  activeTab === 'wallet'
                    ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'en' ? 'Credits Wallet' : 'क्रेडिट वालेट'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                  {creditsRemaining}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all whitespace-nowrap min-h-touch ${
                  activeTab === 'profile'
                    ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'en' ? 'Profile & Land Units' : 'प्रोफाइल तथा नापी'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Database Setup Notice if tables are pending */}
      {tableMissingNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-xs text-amber-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{tableMissingNotice}</span>
            </div>
            <span className="font-mono text-[11px] bg-amber-100 px-2 py-0.5 rounded text-amber-900">
              Run: supabase/init_sarvabhoomi.sql
            </span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ========================================================== */}
        {/* TAB 1: MY LISTINGS */}
        {/* ========================================================== */}
        {activeTab === 'my-listings' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-6 h-6 text-emerald-600" />
                  <span>{lang === 'en' ? 'My Posted Properties' : 'मेरा प्रकाशित सम्पत्तिहरू'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Manage your direct listings with zero brokerage. Update availability or mark as sold.'
                    : 'कुनै बिचौलिया बिना आफ्नो जग्गा तथा घरको विवरण व्यवस्थापन गर्नुहोस्।'}
                </p>
              </div>

              <Link
                href="/post-property"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'en' ? 'Post New Free Property' : 'नयाँ सम्पत्ति पोस्ट गर्नुहोस्'}</span>
              </Link>
            </div>

            {loadingListings ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs">{lang === 'en' ? 'Loading listings...' : 'लोड हुँदैछ...'}</p>
              </div>
            ) : myProperties.length === 0 ? (
              <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {lang === 'en' ? 'No properties listed yet' : 'तपाईंले कुनै सम्पत्ति पोस्ट गर्नुभएको छैन'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  {lang === 'en'
                    ? 'List your land or house 100% free with cadastral plot boundary and Lalpurja verification badge.'
                    : 'आफ्नो जग्गा वा घर १००% निःशुल्क पोस्ट गर्नुहोस् र सिधै ग्राहकहरूसँग जोडिनुहोस्।'}
                </p>
                <Link
                  href="/post-property"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Post Your First Property' : 'पहिलो सम्पत्ति पोस्ट गर्नुहोस्'}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all"
                  >
                    <div>
                      {/* Photo Header */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        {property.photos && property.photos.length > 0 ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <Building className="w-10 h-10 mb-1 text-slate-300" />
                            <span className="text-[11px]">No Photo Provided</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                              property.status === 'ACTIVE'
                                ? 'bg-emerald-600 text-white'
                                : property.status === 'SOLD'
                                ? 'bg-slate-800 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {property.status}
                          </span>
                          {property.lalpurja_verified && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Lalpurja</span>
                            </span>
                          )}
                        </div>

                        {/* Views & Unlocks counter */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] flex items-center gap-1 font-mono">
                            <Eye className="w-3 h-3" />
                            <span>{property.views_count || 0}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-md text-white text-[10px] flex items-center gap-1 font-mono font-bold">
                            <KeyRound className="w-3 h-3" />
                            <span>{property.unlocks_count || 0}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <div>
                          <div className="text-base font-bold text-slate-900 line-clamp-1">
                            {property.title}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {property.locality}, {property.district}
                            </span>
                          </div>
                        </div>

                        {/* Price & Area Specs */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Total Price</span>
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              {formatPriceNPR(property.price_npr)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Plot Area</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatArea(property.area_value, property.area_unit)}
                            </span>
                          </div>
                        </div>

                        {property.kitta_no && (
                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Cadastral Plot (कित्ता नं):</span>
                            <span className="font-mono font-bold text-slate-800">
                              #{property.kitta_no}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs pt-3">
                        <Link
                          href={`/properties/${property.id}`}
                          className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <span>{lang === 'en' ? 'View Public Page' : 'सार्वजनिक पृष्ठ हेर्नुहोस्'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Status Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          type="button"
                          disabled={updatingPropertyId === property.id}
                          onClick={() => handleUpdateStatus(property.id, 'ACTIVE')}
                          className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-colors ${
                            property.status === 'ACTIVE'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          disabled={updatingPropertyId === property.id}
                          onClick={() => handleUpdateStatus(property.id, 'PAUSED')}
                          className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-colors ${
                            property.status === 'PAUSED'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          disabled={updatingPropertyId === property.id}
                          onClick={() => handleUpdateStatus(property.id, 'SOLD')}
                          className={`py-1.5 text-[11px] font-bold rounded-lg border text-center transition-colors ${
                            property.status === 'SOLD'
                              ? 'bg-slate-100 border-slate-400 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Sold
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 2: MY SHORTLIST */}
        {/* ========================================================== */}
        {activeTab === 'shortlist' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <span>{lang === 'en' ? 'Shortlisted Properties' : 'सुरक्षित गरिएका सम्पत्तिहरू'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Properties you saved for later review. Unlock verified owner contact details directly.'
                    : 'तपाईंले पछिका लागि सुरक्षित गर्नुभएका जग्गा तथा घरहरू।'}
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{lang === 'en' ? 'Explore More Properties' : 'थप जग्गा खोज्नुहोस्'}</span>
              </Link>
            </div>

            {loadingShortlist ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs">{lang === 'en' ? 'Loading shortlist...' : 'लोड हुँदैछ...'}</p>
              </div>
            ) : shortlistedProperties.length === 0 ? (
              <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6 fill-rose-500" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {lang === 'en' ? 'Your shortlist is currently empty' : 'तपाईंको मनपर्ने सूची खाली छ'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  {lang === 'en'
                    ? 'Click the heart icon on any property in the marketplace to bookmark and compare.'
                    : 'कुनै पनि सम्पत्तिको मुटु आइकनमा क्लिक गरी यहाँ सुरक्षित गर्नुहोस्।'}
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Browse Properties' : 'सम्पत्तिहरू खोज्नुहोस्'}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortlistedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-all"
                  >
                    <div>
                      {/* Photo */}
                      <div className="relative h-44 bg-slate-100 overflow-hidden">
                        {property.photos && property.photos.length > 0 ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <Building className="w-10 h-10 mb-1 text-slate-300" />
                            <span className="text-[11px]">No Photo</span>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          {property.lalpurja_verified && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/95 text-emerald-800 border border-emerald-200 shadow-sm flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Lalpurja Verified</span>
                            </span>
                          )}
                        </div>

                        {/* Remove heart */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFromShortlist(property.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-rose-500 hover:text-slate-400 flex items-center justify-center shadow-sm transition-colors"
                          title="Remove from shortlist"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-3">
                        <div>
                          <Link
                            href={`/properties/${property.id}`}
                            className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors line-clamp-1"
                          >
                            {property.title}
                          </Link>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {property.locality}, {property.district}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Price</span>
                            <span className="font-black text-emerald-700 font-mono text-sm">
                              {formatPriceNPR(property.price_npr)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Area</span>
                            <span className="font-bold text-slate-900 font-mono">
                              {formatArea(property.area_value, property.area_unit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CTA Actions */}
                    <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center gap-2 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPropertyForContact(property);
                          setContactModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? 'Contact Landowner' : 'जग्गाधनीसँग सम्पर्क'}</span>
                      </button>

                      <Link
                        href={`/properties/${property.id}`}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        title="View Full Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 3: CREDITS WALLET */}
        {/* ========================================================== */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Wallet Overview Box */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Stage 1 Seeding Allocation</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {lang === 'en' ? 'Contact Credits Wallet' : 'सम्पर्क अनलक क्रेडिट वालेट'}
                  </h1>

                  <p className="text-emerald-100 text-xs sm:text-sm max-w-xl mt-1 leading-relaxed">
                    {lang === 'en'
                      ? '1 Credit allows you to instantly unlock and view the verified direct mobile phone number of any landowner on Sarvabhoomi with 0% brokerage.'
                      : '१ क्रेडिटले १ जग्गाधनीको प्रमाणित फोन नम्बर सिधै अनलक गर्दछ। कुनै बिचौलिया कमिसन लाग्दैन।'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-5 shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Coins className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-3xl sm:text-4xl font-black font-mono leading-none">
                      {creditsRemaining}
                    </div>
                    <div className="text-xs font-semibold text-emerald-200 mt-1">
                      {lang === 'en' ? 'Remaining Credits' : 'बाँकी क्रेडिटहरू'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-emerald-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>
                    {lang === 'en' ? 'Promotional Expiry Date' : 'म्याद समाप्ति मिति'}:{' '}
                    <strong className="text-white">{expirationFormatted}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'en' ? 'Zero Brokerage Guarantee' : '१००% शून्य दलाली ग्यारेन्टी'}</span>
                </div>
              </div>
            </div>

            {/* Unlocked Landowner Contacts History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'en' ? 'Unlocked Landowner Contacts' : 'अनलक गरिएका जग्गाधनी सम्पर्कहरू'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'en'
                      ? 'All contacts you have unlocked are permanently saved and accessible below.'
                      : 'तपाईंले अनलक गर्नुभएका सबै नम्बरहरू यहाँ सुरक्षित छन्।'}
                  </p>
                </div>
              </div>

              {loadingWallet ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs">{lang === 'en' ? 'Loading unlock history...' : 'इतिहास लोड हुँदैछ...'}</p>
                </div>
              ) : unlockedContacts.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                  <Phone className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">
                    {lang === 'en' ? 'No landowner contacts unlocked yet' : 'अहिलेसम्म कुनै नम्बर अनलक गरिएको छैन'}
                  </p>
                  <p className="mt-1">
                    {lang === 'en'
                      ? 'Browse listings in the marketplace and click "Contact Owner" to reveal numbers.'
                      : 'सम्पत्ति खोज्नुहोस् र सिधै जग्गाधनीको नम्बर हेर्नुहोस्।'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-100">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Property Title</th>
                        <th className="py-2.5 px-3">Location</th>
                        <th className="py-2.5 px-3">Landowner Name</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {unlockedContacts.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {new Date(item.unlocked_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {item.property ? (
                              <Link
                                href={`/properties/${item.property.id}`}
                                className="hover:text-emerald-700 transition-colors"
                              >
                                {item.property.title}
                              </Link>
                            ) : (
                              'Property Details'
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500">
                            {item.property ? `${item.property.locality}, ${item.property.district}` : 'Nepal'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {item.owner?.full_name || 'Landowner'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                            {item.owner?.phone_np || 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1.5">
                            {item.owner?.phone_np && (
                              <>
                                <a
                                  href={`tel:${item.owner.phone_np}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>Call</span>
                                </a>
                                <a
                                  href={`https://wa.me/${item.owner.phone_np.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold text-[11px] transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* TAB 4: PROFILE & LAND UNITS CONVERTER */}
        {/* ========================================================== */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Account Profile & Preferences */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'en' ? 'Profile & District Preferences' : 'प्रोफाइल तथा जिल्ला प्राथमिकता'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Your default measurement system automatically conforms to your selected primary district.'
                    : 'तपाईंको प्राथमिक जिल्ला अनुसार जग्गा नापी एकाइ (रोपनी वा बिघा) स्वतः समायोजन हुन्छ।'}
                </p>
              </div>

              {profileSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                {/* Full Legal Name (Readonly) */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    {lang === 'en' ? 'Full Legal Name' : 'पूरा कानुनी नाम'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.full_name || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                  />
                </div>

                {/* Mobile Number (Readonly) */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    {lang === 'en' ? 'Verified Nepal Mobile' : 'प्रमाणित मोबाइल नम्बर'}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile?.phone_np || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-emerald-700 font-bold cursor-not-allowed"
                  />
                </div>

                {/* Role / Intent */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    {lang === 'en' ? 'Platform Role' : 'प्रयोगकर्ताको भूमिका'}
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold">
                    {profile?.user_intent || 'BUYER'} (Zero Brokerage Direct Marketplace)
                  </div>
                </div>

                {/* Primary District Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    {lang === 'en' ? 'Primary District of Focus' : 'प्राथमिक जिल्ला'}
                  </label>
                  <select
                    value={profileDistrict}
                    onChange={(e) => {
                      const d = e.target.value;
                      setProfileDistrict(d);
                      setProfileRegion(getRegionForDistrict(d));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ALL_NEPAL_DISTRICTS.map((d) => (
                      <option key={d.nameEn} value={d.nameEn}>
                        {d.nameEn} ({d.nameNe}) - {d.region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Preferred Unit System Toggle */}
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    {lang === 'en' ? 'Land Unit System' : 'जग्गा नापी प्रणाली'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProfileRegion('HILLY')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        profileRegion === 'HILLY'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">Hilly (पहाडी)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Ropani - Aana - Paisa - Daam</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProfileRegion('TERAI')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        profileRegion === 'TERAI'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">Terai (तराई)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Bigha - Kattha - Dhur</div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{lang === 'en' ? 'Save Preferences' : 'प्राथमिकता सुरक्षित गर्नुहोस्'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Interactive 3-Way Nepal Land Unit Converter */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'en' ? 'Nepal Land Measurement Converter' : 'नेपाल जग्गा नापी क्यालकुलेटर'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Instant mathematical conversion between Ropani, Bigha, Sq Ft, and Sq Meters.'
                    : 'रोपनी, आना, बिघा, कट्ठा, वर्गफिट र वर्गमिटर बीचको तत्काल रूपान्तरण।'}
                </p>
              </div>

              {/* Input Form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700">Enter Value to Convert:</div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={calcInput}
                    onChange={(e) => setCalcInput(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="1"
                  />
                  <select
                    value={calcUnit}
                    onChange={(e) => setCalcUnit(e.target.value as any)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ROPANI">Ropani (रोपनी)</option>
                    <option value="AANA">Aana (आना)</option>
                    <option value="BIGHA">Bigha (बिघा)</option>
                    <option value="KATTHA">Kattha (कट्ठा)</option>
                    <option value="SQFT">Square Feet (sq ft)</option>
                  </select>
                </div>
              </div>

              {/* Conversion Output Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Hilly: Ropani
                  </span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {ropaniVal.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-slate-500">Ropani</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
                    = {aanaVal.toFixed(2)} Aana
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                    Terai: Bigha
                  </span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {bighaVal.toFixed(3)}{' '}
                    <span className="text-xs font-normal text-slate-500">Bigha</span>
                  </div>
                  <div className="text-[11px] text-teal-700 font-mono mt-0.5">
                    = {katthaVal.toFixed(2)} Kattha
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Square Feet (Sq. Ft.)
                  </span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {Math.round(sqftVal).toLocaleString()}{' '}
                    <span className="text-xs font-normal text-slate-500">sq ft</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Square Meters (Sq. M.)
                  </span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {sqMeters}{' '}
                    <span className="text-xs font-normal text-slate-500">m²</span>
                  </div>
                </div>
              </div>

              {/* Reference Constants */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px] text-slate-600 font-mono">
                <div className="text-xs font-bold text-slate-800 mb-1 font-sans">Official Survey Constants:</div>
                <div className="flex justify-between">
                  <span>1 Ropani</span>
                  <span className="text-slate-900 font-bold">16 Aana = 5,476 sq ft (508.74 m²)</span>
                </div>
                <div className="flex justify-between">
                  <span>1 Aana</span>
                  <span className="text-slate-900 font-bold">4 Paisa = 342.25 sq ft (31.80 m²)</span>
                </div>
                <div className="flex justify-between">
                  <span>1 Bigha</span>
                  <span className="text-slate-900 font-bold">20 Kattha = 72,900 sq ft (6,772.63 m²)</span>
                </div>
                <div className="flex justify-between">
                  <span>1 Kattha</span>
                  <span className="text-slate-900 font-bold">20 Dhur = 3,645 sq ft (338.63 m²)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Contact Unlock Modal */}
      <ContactUnlockModal
        isOpen={contactModalOpen}
        onClose={() => {
          setContactModalOpen(false);
          setSelectedPropertyForContact(null);
        }}
        property={selectedPropertyForContact}
        currentUser={
          profile
            ? {
                id: profile.id,
                phone: profile.phone_np,
                credits: creditsRemaining,
              }
            : null
        }
        onUnlockSuccess={(propertyId, details) => {
          setSubscription((prev) =>
            prev ? { ...prev, credits_remaining: details.creditsRemaining } : null
          );
          if (profile) {
            loadUserWalletHistory(profile.id);
          }
        }}
        lang={lang}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl animate-pulse">
            स
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
