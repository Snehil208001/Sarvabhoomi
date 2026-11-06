'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Sparkles,
  Phone,
  PhoneCall,
  MessageCircle,
  Layers,
  CheckCircle2,
  Coins,
  Building,
  Home,
  Tag,
  Compass,
  Calendar,
  ExternalLink,
  Search,
  PlusCircle,
  RefreshCw,
  Heart,
  Eye,
  KeyRound,
  Trash2,
  AlertCircle,
  Clock,
  Check,
  X,
  Users,
  Edit3,
} from 'lucide-react';
import {
  UserRole,
  Property,
  formatMonthlyRentNPR,
  formatDeposit,
  formatArea,
  ALL_NEPAL_DISTRICTS,
  getRegionForDistrict,
  getAuthDict,
} from '@sarvabhoomi/shared';
import { supabase, Profile, UserSubscription } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';
import { PropertyImage } from '@/components/PropertyImage';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PropertyCard } from '@/components/PropertyCard';
import { LandCalculator } from '@/components/LandCalculator';

type OwnerTab = 'my-listings' | 'enquiries' | 'profile';
type RenterTab = 'shortlist' | 'wallet' | 'visits' | 'profile';
type DashboardTab = OwnerTab | RenterTab;

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
    monthly_rent_npr?: number | null;
  };
  owner?: {
    full_name: string;
    phone_np: string;
  };
}

interface VisitRequestRecord {
  id: string;
  property_id: string;
  renter_id: string;
  owner_id: string;
  visit_date: string;
  time_slot: string;
  note?: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  created_at: string;
  property?: {
    id: string;
    title: string;
    locality: string;
    district: string;
  };
  renter?: {
    full_name: string;
    phone_np: string;
  };
  owner?: {
    full_name: string;
    phone_np: string;
  };
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<DashboardTab>('shortlist');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  // Owner state
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [ownerVisitRequests, setOwnerVisitRequests] = useState<VisitRequestRecord[]>([]);
  const [ownerEnquiries, setOwnerEnquiries] = useState<any[]>([]);
  const [updatingPropertyId, setUpdatingPropertyId] = useState<string | null>(null);

  // Renter state
  const [shortlistedProperties, setShortlistedProperties] = useState<Property[]>([]);
  const [loadingShortlist, setLoadingShortlist] = useState(false);
  const [unlockedContacts, setUnlockedContacts] = useState<UnlockedContactRecord[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [renterVisitRequests, setRenterVisitRequests] = useState<VisitRequestRecord[]>([]);

  // Contact Unlock Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedPropertyForContact, setSelectedPropertyForContact] = useState<Property | null>(null);

  // Profile editing state (Lazy Profile Checklist)
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDistrict, setEditDistrict] = useState('Kathmandu');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  const startEditProfile = () => {
    setEditName(profile?.full_name || '');
    setEditDistrict(profile?.preferred_district || 'Kathmandu');
    setProfileSuccessMsg(null);
    setEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    setProfileSuccessMsg(null);

    const trimmedName = editName.trim();
    const hasName = trimmedName.length >= 2;
    const hasDistrict = editDistrict.trim().length >= 2;
    const isCompleted = hasName && hasDistrict;
    const derivedRegion = getRegionForDistrict(editDistrict);

    try {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName || null,
          preferred_district: editDistrict,
          preferred_region: derivedRegion,
          profile_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (!error && updated) {
        setProfile(updated as Profile);
        setEditingProfile(false);
        setProfileSuccessMsg(
          lang === 'en' ? 'Profile updated successfully!' : 'प्रोफाइल सफलतापूर्वक अद्यावधिक भयो!'
        );
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Load user and profile
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

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted && profileRow) {
          if (!profileRow.user_role) {
            router.replace('/auth');
            return;
          }

          setProfile(profileRow);
          if (profileRow.preferred_lang) {
            setLang(profileRow.preferred_lang);
          }

          // Set default active tab based on role
          const role = profileRow.user_role as UserRole;
          const paramTab = searchParams.get('tab') as DashboardTab | null;

          if (role === 'OWNER') {
            if (paramTab && ['my-listings', 'enquiries', 'profile'].includes(paramTab)) {
              setActiveTab(paramTab);
            } else {
              setActiveTab('my-listings');
            }
            loadOwnerData(user.id);
          } else {
            if (paramTab && ['shortlist', 'wallet', 'visits', 'profile'].includes(paramTab)) {
              setActiveTab(paramTab);
            } else {
              setActiveTab('shortlist');
            }
            loadRenterData(user.id);
          }
        }

        // Fetch subscriptions
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
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  // Load Owner Data: My Listings & Received Enquiries / Visits
  const loadOwnerData = async (userId: string) => {
    setLoadingListings(true);
    try {
      // 1. My Listings
      const { data: props } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (props) setMyProperties(props as Property[]);

      // 2. Received Visit Requests
      const { data: vReqs } = await supabase
        .from('property_visit_requests')
        .select(`
          id,
          property_id,
          renter_id,
          owner_id,
          visit_date,
          time_slot,
          note,
          status,
          created_at,
          property:properties(id, title, locality, district),
          renter:profiles!property_visit_requests_renter_id_fkey(full_name, phone_np)
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (vReqs) setOwnerVisitRequests(vReqs as unknown as VisitRequestRecord[]);

      // 3. Received Contact Unlocks (Enquiries)
      const myPropertyIds = (props || []).map((p) => p.id);
      if (myPropertyIds.length > 0) {
        const { data: enqs } = await supabase
          .from('contact_unlocks')
          .select(`
            id,
            property_id,
            created_at,
            property:properties(title, locality),
            renter:profiles!contact_unlocks_user_id_fkey(full_name, phone_np)
          `)
          .in('property_id', myPropertyIds)
          .order('created_at', { ascending: false });

        if (enqs) setOwnerEnquiries(enqs);
      } else {
        setOwnerEnquiries([]);
      }
    } catch (e) {
      console.warn('Error loading owner data:', e);
    } finally {
      setLoadingListings(false);
    }
  };

  // Load Renter Data: Shortlist, Unlocks & Sent Visits
  const loadRenterData = async (userId: string) => {
    setLoadingShortlist(true);
    setLoadingWallet(true);
    try {
      // 1. Shortlist
      const { data: favs } = await supabase
        .from('property_favourites')
        .select('property_id')
        .eq('user_id', userId);

      if (favs && favs.length > 0) {
        const propIds = favs.map((f) => f.property_id);
        const { data: props } = await supabase
          .from('properties')
          .select('*')
          .in('id', propIds);

        if (props) setShortlistedProperties(props as Property[]);
      } else {
        setShortlistedProperties([]);
      }

      // 2. Unlocked Contacts
      const { data: unlocks } = await supabase
        .from('contact_unlocks')
        .select(`
          id,
          property_id,
          owner_id,
          unlocked_at,
          credits_spent,
          property:properties(id, title, kitta_no, district, locality, listing_type, price_npr, monthly_rent_npr),
          owner:profiles!contact_unlocks_owner_id_fkey(full_name, phone_np)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (unlocks) setUnlockedContacts(unlocks as unknown as UnlockedContactRecord[]);

      // 3. Sent Visit Requests
      const { data: sentVisits } = await supabase
        .from('property_visit_requests')
        .select(`
          id,
          property_id,
          renter_id,
          owner_id,
          visit_date,
          time_slot,
          note,
          status,
          created_at,
          property:properties(id, title, locality, district),
          owner:profiles!property_visit_requests_owner_id_fkey(full_name, phone_np)
        `)
        .eq('renter_id', userId)
        .order('created_at', { ascending: false });

      if (sentVisits) setRenterVisitRequests(sentVisits as unknown as VisitRequestRecord[]);
    } catch (e) {
      console.warn('Error loading renter data:', e);
    } finally {
      setLoadingShortlist(false);
      setLoadingWallet(false);
    }
  };

  // Owner Action: Toggle Listing Status (PAUSED <-> ACTIVE)
  const handleToggleListingStatus = async (propertyId: string, currentStatus: string) => {
    if (currentStatus === 'PENDING_REVIEW') return; // Cannot activate pending listing

    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setUpdatingPropertyId(propertyId);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', propertyId);

      if (!error) {
        setMyProperties((prev) =>
          prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus as any } : p))
        );
      }
    } catch (e) {
      console.error('Error toggling listing status:', e);
    } finally {
      setUpdatingPropertyId(null);
    }
  };

  // Owner Action: Confirm or Decline Visit Request
  const handleUpdateVisitStatus = async (requestId: string, newStatus: 'CONFIRMED' | 'DECLINED') => {
    try {
      const { error } = await supabase
        .from('property_visit_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        setOwnerVisitRequests((prev) =>
          prev.map((v) => (v.id === requestId ? { ...v, status: newStatus } : v))
        );
      }
    } catch (e) {
      console.error('Error updating visit status:', e);
    }
  };

  const userRole = (profile?.user_role || 'RENTER') as UserRole;
  const creditsRemaining = subscription?.credits_remaining ?? 15;

  const errorParam = searchParams.get('error');
  const postedParam = searchParams.get('posted');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-xs ring-4 ring-emerald-100 animate-pulse">
            स
          </div>
          <span className="text-xs text-slate-500 font-medium">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
        currentUser={
          profile
            ? {
                id: profile.id,
                fullName: profile.full_name || 'Verified Member',
                credits: creditsRemaining,
                userRole: userRole,
              }
            : null
        }
      />

      {/* Cross-Role Notice Banner */}
      {errorParam === 'renter_cannot_post' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-xs font-semibold text-amber-900">
          Your Renter account cannot list properties. Use an Owner account with a different phone number to list rental units.
        </div>
      )}
      {errorParam === 'owner_cannot_search' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-xs font-semibold text-amber-900">
          Owner accounts manage listings and enquiries. Use a Renter account with a different phone number to browse rentals.
        </div>
      )}
      {postedParam === 'success' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 text-center text-xs font-semibold text-emerald-900 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Rental listing submitted successfully! It is now <strong>Pending Review</strong> and will go live once verified.</span>
        </div>
      )}

      {/* Tab Navigation Bar */}
      <div className="border-b border-slate-200 bg-white sticky top-18 sm:top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-2 scrollbar-none text-xs sm:text-sm font-semibold flex-nowrap">
            {/* OWNER TABS */}
            {userRole === 'OWNER' && (
              <>
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
                  <span>{lang === 'en' ? 'My Listings' : 'मेरा भाडाका घरहरू'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                    {myProperties.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('enquiries')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'enquiries'
                      ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Enquiries & Visits' : 'सम्पर्क र भ्रमण अनुरोध'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                    {ownerVisitRequests.length + ownerEnquiries.length}
                  </span>
                </button>
              </>
            )}

            {/* RENTER TABS */}
            {userRole === 'RENTER' && (
              <>
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
                  <span>{lang === 'en' ? 'My Shortlist' : 'सुरक्षित सूची'}</span>
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
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Unlocked Landlords' : 'सम्पर्क गरिएका घरधनी'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                    {unlockedContacts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('visits')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'visits'
                      ? 'bg-white border-emerald-300 text-emerald-800 shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'en' ? 'Scheduled Visits' : 'घर हेर्ने तालिका'}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                    {renterVisitRequests.length}
                  </span>
                </button>
              </>
            )}

            {/* Profile Tab (Both Roles) */}
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
              <span>{lang === 'en' ? 'Profile & Preferences' : 'प्रोफाइल तथा सेटिङ'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ============================================================ */}
        {/* OWNER VIEW: MY LISTINGS TAB                                  */}
        {/* ============================================================ */}
        {userRole === 'OWNER' && activeTab === 'my-listings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-6 h-6 text-emerald-600" />
                  <span>{lang === 'en' ? 'My Rental Listings' : 'मेरा भाडाका सम्पत्तिहरू'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage your rental spaces with 0% brokerage. Pause or resume visibility anytime.
                </p>
              </div>

              <Link
                href="/post-property"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'en' ? 'Post Free Rental Listing' : 'नयाँ भाडाको घर राख्नुहोस्'}</span>
              </Link>
            </div>

            {loadingListings ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs">Loading listings...</p>
              </div>
            ) : myProperties.length === 0 ? (
              <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  {lang === 'en' ? 'You have not listed any rental property yet' : 'तपाईंले कुनै सम्पत्ति राख्नुभएको छैन'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  List your room, flat, or house 100% free of charge and connect directly with tenants.
                </p>
                <Link
                  href="/post-property"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Your First Rental Free</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map((prop) => {
                  const monthly = prop.monthly_rent_npr || prop.price_npr;
                  return (
                    <div
                      key={prop.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-48 w-full bg-slate-100">
                          <PropertyImage
                            src={prop.photos?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80'}
                            alt={prop.title}
                            fill
                            sizes="400px"
                            className="object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                                prop.status === 'ACTIVE'
                                  ? 'bg-emerald-600 text-white'
                                  : prop.status === 'PENDING_REVIEW'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-700 text-white'
                              }`}
                            >
                              {prop.status === 'PENDING_REVIEW' ? 'Pending Review' : prop.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-2">
                          <div className="text-xl font-black text-emerald-700">
                            {formatMonthlyRentNPR(monthly, lang)}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{prop.title}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{prop.locality}, {prop.district}</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                        <Link
                          href={`/properties/${prop.id}`}
                          className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <span>View Public Page</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        {prop.status === 'PENDING_REVIEW' ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                            Under Admin Review
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingPropertyId === prop.id}
                            onClick={() => handleToggleListingStatus(prop.id, prop.status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              prop.status === 'ACTIVE'
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
                            }`}
                          >
                            {prop.status === 'ACTIVE' ? 'Pause Listing' : 'Resume Listing'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* OWNER VIEW: ENQUIRIES & VISIT REQUESTS TAB                   */}
        {/* ============================================================ */}
        {userRole === 'OWNER' && activeTab === 'enquiries' && (
          <div className="space-y-8">
            {/* Scheduled Visit Requests Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    {lang === 'en' ? 'Scheduled Visit Requests Received' : 'घर हेर्न आएका अनुरोधहरू'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {ownerVisitRequests.length} Requests
                </span>
              </div>

              {ownerVisitRequests.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No property visit requests received yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ownerVisitRequests.map((req) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{req.renter?.full_name || 'Prospective Tenant'}</span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              req.status === 'CONFIRMED'
                                ? 'bg-emerald-600 text-white'
                                : req.status === 'DECLINED'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Property: <span className="font-semibold text-slate-900">{req.property?.title}</span> ({req.property?.locality})
                        </p>
                        <p className="text-xs text-emerald-800 font-medium">
                          Date: <span className="font-bold">{req.visit_date}</span> • Slot: <span className="font-bold">{req.time_slot}</span>
                        </p>
                        {req.renter?.phone_np && (
                          <p className="text-xs text-slate-500 font-mono">
                            Tenant Contact: <a href={`tel:${req.renter.phone_np}`} className="text-emerald-700 underline font-bold">{req.renter.phone_np}</a>
                          </p>
                        )}
                        {req.note && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">&quot;{req.note}&quot;</p>
                        )}
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateVisitStatus(req.id, 'CONFIRMED')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            Confirm Visit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateVisitStatus(req.id, 'DECLINED')}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Tenant Contact Unlocks Section */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    {lang === 'en' ? 'Tenants Who Unlocked Your Contact' : 'सम्पर्क अनलक गरेका भाडावालहरू'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {ownerEnquiries.length} Tenants
                </span>
              </div>

              {ownerEnquiries.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No tenants have unlocked your phone number yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ownerEnquiries.map((enq) => (
                    <div key={enq.id} className="py-3 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{enq.renter?.full_name || 'Tenant Member'}</h4>
                        <p className="text-[11px] text-slate-500">
                          Listing: {enq.property?.title} ({enq.property?.locality})
                        </p>
                      </div>
                      <div className="text-right">
                        <a
                          href={`tel:${enq.renter?.phone_np}`}
                          className="text-xs font-mono font-bold text-emerald-700 underline block"
                        >
                          {enq.renter?.phone_np || 'N/A'}
                        </a>
                        <span className="text-[10px] text-slate-400">
                          {new Date(enq.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RENTER VIEW: SHORTLIST TAB                                   */}
        {/* ============================================================ */}
        {userRole === 'RENTER' && activeTab === 'shortlist' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                  <span>{lang === 'en' ? 'My Shortlisted Rentals' : 'सुरक्षित गरिएका भाडाका सूचीहरू'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Homes and rooms bookmarked for comparison. Unlock landlord phone numbers with your free credits.
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Explore More Rentals</span>
              </Link>
            </div>

            {loadingShortlist ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                <p className="text-xs">Loading shortlist...</p>
              </div>
            ) : shortlistedProperties.length === 0 ? (
              <div className="p-12 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Your shortlist is empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                  Browse rentals and click the heart icon to save listings here.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  <Search className="w-4 h-4" />
                  <span>Browse Rental Marketplace</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shortlistedProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    isFavourite={true}
                    onUnlock={() => {
                      setSelectedPropertyForContact(prop);
                      setContactModalOpen(true);
                    }}
                    lang={lang}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* RENTER VIEW: UNLOCKED LANDLORDS TAB                          */}
        {/* ============================================================ */}
        {userRole === 'RENTER' && activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-200 block">
                  Renter Contact Unlocks
                </span>
                <h2 className="text-2xl font-black mt-1">
                  {creditsRemaining} Credits Remaining
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  15 complimentary credits provided upon registration to connect directly with landlords.
                </p>
              </div>
              <Link
                href="/search"
                className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-xs hover:bg-emerald-50 transition-colors"
              >
                Find More Rentals
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? 'Unlocked Landlord Contacts' : 'अनलक गरिएका घरधनीहरूको सूची'}
              </h3>

              {loadingWallet ? (
                <div className="p-8 text-center text-slate-400">Loading unlocks...</div>
              ) : unlockedContacts.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  You have not unlocked any landlord contacts yet. Browse rentals and click &quot;Contact Owner&quot;.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {unlockedContacts.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.owner?.full_name || 'Landlord'}</h4>
                        <p className="text-xs text-slate-600 font-medium">
                          {item.property?.title} ({item.property?.locality}, {item.property?.district})
                        </p>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                          {formatMonthlyRentNPR(item.property?.monthly_rent_npr || item.property?.price_npr, lang)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${item.owner?.phone_np}`}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{item.owner?.phone_np}</span>
                        </a>
                        <a
                          href={`https://wa.me/${item.owner?.phone_np?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-50"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RENTER VIEW: SCHEDULED VISITS TAB                            */}
        {/* ============================================================ */}
        {userRole === 'RENTER' && activeTab === 'visits' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  {lang === 'en' ? 'My Scheduled Property Visits' : 'मैले अनुरोध गरेका भ्रमणहरू'}
                </h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                {renterVisitRequests.length} Visits
              </span>
            </div>

            {renterVisitRequests.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  You haven&apos;t scheduled any visits yet. Open any rental property detail page to schedule a visit slot.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {renterVisitRequests.map((v) => (
                  <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/properties/${v.property_id}`} className="text-sm font-bold text-slate-900 hover:text-emerald-700">
                          {v.property?.title}
                        </Link>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            v.status === 'CONFIRMED'
                              ? 'bg-emerald-600 text-white'
                              : v.status === 'DECLINED'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {v.property?.locality}, {v.property?.district}
                      </p>
                      <p className="text-xs text-emerald-800 font-medium">
                        Requested Date: <span className="font-bold">{v.visit_date}</span> • Slot: <span className="font-bold">{v.time_slot}</span>
                      </p>
                      {v.owner?.phone_np && (
                        <p className="text-xs text-slate-600">
                          Landlord: <span className="font-semibold">{v.owner.full_name}</span> (<a href={`tel:${v.owner.phone_np}`} className="text-emerald-700 underline font-bold">{v.owner.phone_np}</a>)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PROFILE TAB (BOTH ROLES)                                     */}
        {/* ============================================================ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'en' ? 'Account Profile & Role Details' : 'खाता प्रोफाइल र भूमिका विवरण'}
              </h2>

              {/* Profile Completion Checklist (Lazy Profile) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'en' ? 'Profile Completion Checklist' : 'प्रोफाइल पूर्णता चेकलिस्ट'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lang === 'en'
                        ? 'Profile completion is lazy and never blocks access to the marketplace.'
                        : 'प्रोफाइल विवरण नभए पनि बजार चलाउन कुनै रोकतोक छैन।'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      profile?.profile_completed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {profile?.profile_completed
                      ? lang === 'en'
                        ? 'Completed (100%)'
                        : 'पूर्ण भएको (१००%)'
                      : lang === 'en'
                      ? 'Incomplete (Lazy)'
                      : 'अपूर्ण (ऐच्छिक)'}
                  </span>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {/* Checklist Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Name Item */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Full Legal Name
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        {profile?.full_name ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{profile.full_name}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-300 text-sm">○</span>
                            <span className="text-slate-400 font-normal italic">
                              {lang === 'en' ? 'Not provided yet' : 'विवरण नभरेको'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!editingProfile && (
                      <button
                        type="button"
                        onClick={startEditProfile}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                      >
                        {profile?.full_name ? (lang === 'en' ? 'Edit' : 'सम्पादन') : (lang === 'en' ? 'Add' : 'थप्नुहोस्')}
                      </button>
                    )}
                  </div>

                  {/* District Item */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                        Primary District
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        {profile?.preferred_district ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{profile.preferred_district}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-300 text-sm">○</span>
                            <span className="text-slate-400 font-normal italic">
                              {lang === 'en' ? 'Not set' : 'छनोट नभएको'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!editingProfile && (
                      <button
                        type="button"
                        onClick={startEditProfile}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                      >
                        {profile?.preferred_district ? (lang === 'en' ? 'Edit' : 'सम्पादन') : (lang === 'en' ? 'Set' : 'सेट गर्नुहोस्')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form */}
                {editingProfile && (
                  <form onSubmit={handleSaveProfile} className="p-4 rounded-xl bg-white border border-emerald-200 space-y-4 pt-4 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'en' ? 'Full Legal Name' : 'पूरा कानुनी नाम'} *
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Ram Bahadur Shrestha"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'en' ? 'Primary District' : 'मुख्य जिल्ला'} *
                        </label>
                        <select
                          value={editDistrict}
                          onChange={(e) => setEditDistrict(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                        >
                          {ALL_NEPAL_DISTRICTS.map((d) => (
                            <option key={d.nameEn} value={d.nameEn}>
                              {lang === 'ne' ? d.nameNe : d.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-800 font-semibold">
                      ✓ Unit system derived from district: <strong className="font-bold">{getRegionForDistrict(editDistrict)}</strong> ({getRegionForDistrict(editDistrict) === 'HILLY' ? 'Ropani-Aana' : 'Bigha-Kattha'})
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs"
                      >
                        {lang === 'en' ? 'Cancel' : 'रद्द गर्नुहोस्'}
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                      >
                        {savingProfile ? (lang === 'en' ? 'Saving...' : 'सुरक्षित गरिँदैछ...') : (lang === 'en' ? 'Save Profile' : 'सुरक्षित गर्नुहोस्')}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 block font-semibold">User Role</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {userRole === 'OWNER' ? 'Property Owner / Landlord (घरधनी)' : 'Direct Renter (भाडामा लिने)'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Permanent
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {userRole === 'OWNER'
                      ? 'You can list rental spaces 100% free and manage tenant visit requests.'
                      : 'You can search, shortlist rentals, unlock owner contacts and schedule visits.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 block font-semibold">Phone Number</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{profile?.phone_np}</span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    To use the other role, register a separate phone number.
                  </p>
                </div>
              </div>

              {/* Land Measurement Converter Component */}
              <div className="pt-4 border-t border-slate-100">
                <LandCalculator lang={lang} />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Unlock Contact Modal */}
      {selectedPropertyForContact && (
        <ContactUnlockModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          property={selectedPropertyForContact}
          currentUser={
            profile
              ? {
                  id: profile.id,
                  phone: profile.phone_np,
                  credits: creditsRemaining,
                  fullName: profile.full_name,
                }
              : null
          }
          onUnlockSuccess={() => {
            if (profile) loadRenterData(profile.id);
          }}
          lang={lang}
        />
      )}

      {/* Footer */}
      <Footer lang={lang} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
