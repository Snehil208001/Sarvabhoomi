'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Phone,
  PhoneCall,
  MessageCircle,
  Layers,
  CheckCircle2,
  Home,
  Compass,
  Calendar,
  ExternalLink,
  Search,
  PlusCircle,
  RefreshCw,
  Heart,
  Check,
  Users,
} from 'lucide-react';
import {
  UserRole,
  Property,
  formatMonthlyRentNPR,
  ALL_NEPAL_DISTRICTS,
  getRegionForDistrict,
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-gold/40 shadow-card animate-pulse">
            <Image
              src="/logo/logo-mark.png"
              alt="Sarvabhoomi"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs text-gold font-bold tracking-wide">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-gold selection:text-black">
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
        <div className="bg-white/5 border-b border-gold/30 px-4 py-3 text-center text-xs font-bold text-white">
          Your Renter account cannot list properties. Use an Owner account with a different phone number to list rental units.
        </div>
      )}
      {errorParam === 'owner_cannot_search' && (
        <div className="bg-white/5 border-b border-gold/30 px-4 py-3 text-center text-xs font-bold text-white">
          Owner accounts manage listings and enquiries. Use a Renter account with a different phone number to browse rentals.
        </div>
      )}
      {postedParam === 'success' && (
        <div className="bg-gold text-black border-b border-gold px-4 py-3 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>Rental listing submitted successfully! It is now <strong>Pending Review</strong> and will go live once verified.</span>
        </div>
      )}

      {/* Tab Navigation Bar */}
      <div className="border-b border-gold/30 bg-black/95 backdrop-blur-md sticky top-18 sm:top-20 z-30 shadow-card w-full min-w-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-2.5 scrollbar-none text-xs sm:text-sm font-semibold flex-nowrap w-full min-w-0">
            {/* OWNER TABS */}
            {userRole === 'OWNER' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('my-listings')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'my-listings'
                      ? 'bg-gold border-gold text-black font-black shadow-card'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{lang === 'en' ? 'My Listings' : 'मेरा भाडाका घरहरू'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'my-listings' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}>
                    {myProperties.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('enquiries')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'enquiries'
                      ? 'bg-gold border-gold text-black font-black shadow-card'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Enquiries & Visits' : 'सम्पर्क र भ्रमण अनुरोध'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'enquiries' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}>
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'shortlist'
                      ? 'bg-gold border-gold text-black font-black shadow-card'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeTab === 'shortlist' ? 'fill-black text-black' : 'text-gold'}`} />
                  <span>{lang === 'en' ? 'My Shortlist' : 'सुरक्षित सूची'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'shortlist' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}>
                    {shortlistedProperties.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wallet')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'wallet'
                      ? 'bg-gold border-gold text-black font-black shadow-card'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Unlocked Landlords' : 'सम्पर्क गरिएका घरधनी'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'wallet' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}>
                    {unlockedContacts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('visits')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap min-h-touch ${
                    activeTab === 'visits'
                      ? 'bg-gold border-gold text-black font-black shadow-card'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Scheduled Visits' : 'घर हेर्ने तालिका'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'visits' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}>
                    {renterVisitRequests.length}
                  </span>
                </button>
              </>
            )}

            {/* Profile Tab (Both Roles) */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all whitespace-nowrap min-h-touch ${
                activeTab === 'profile'
                  ? 'bg-gold border-gold text-black font-black shadow-card'
                  : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.06] p-6 sm:p-7 rounded-3xl border border-gold/30 shadow-card">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Layers className="w-6 h-6 text-gold" />
                  <span>{lang === 'en' ? 'My Rental Listings' : 'मेरा भाडाका सम्पत्तिहरू'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-white/70 font-medium mt-1">
                  Manage your rental spaces with 0% brokerage. Pause or resume visibility anytime.
                </p>
              </div>

              <Link
                href="/post-property"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs sm:text-sm shadow-card transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{lang === 'en' ? 'Post Free Rental Listing' : 'नयाँ भाडाको घर राख्नुहोस्'}</span>
              </Link>
            </div>

            {loadingListings ? (
              <div className="p-12 text-center text-white/70">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold mb-2" />
                <p className="text-xs font-bold text-white">Loading listings...</p>
              </div>
            ) : myProperties.length === 0 ? (
              <div className="p-12 rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.04] text-center">
                <Home className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <h3 className="text-base font-black text-white">
                  {lang === 'en' ? 'You have not listed any rental property yet' : 'तपाईंले कुनै सम्पत्ति राख्नुभएको छैन'}
                </h3>
                <p className="text-xs text-white/70 max-w-sm mx-auto mt-1 mb-5 font-medium">
                  List your room, flat, or house 100% free of charge and connect directly with tenants.
                </p>
                <Link
                  href="/post-property"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs shadow-card"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Your First Rental Free</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {myProperties.length > 0 && myProperties.every((p) => p.status === 'PENDING_REVIEW') && (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-gold/40 flex items-center gap-3 shadow-card">
                    <span className="px-2.5 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-[10px] font-black uppercase tracking-wider shrink-0">
                      {lang === 'en' ? 'Reviewing' : 'समीक्षामा'}
                    </span>
                    <p className="text-xs font-bold text-white leading-relaxed">
                      {lang === 'en'
                        ? "Under review — we'll notify you when your listing is live to renters."
                        : 'समीक्षामा छ — विज्ञापन स्वीकृत भएपछि तपाईंलाई सूचित गरिनेछ।'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProperties.map((prop) => {
                  const monthly = prop.monthly_rent_npr || prop.price_npr;
                  return (
                    <div
                      key={prop.id}
                      className="bg-white/[0.06] rounded-3xl border border-gold/30 overflow-hidden shadow-card hover:border-gold/60 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-48 w-full bg-black/60">
                          <PropertyImage
                            src={prop.photos?.[0] || null}
                            alt={prop.title}
                            fill
                            sizes="400px"
                            className="object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-card ${
                                prop.status === 'ACTIVE'
                                  ? 'bg-gold text-black'
                                  : prop.status === 'PENDING_REVIEW'
                                  ? 'bg-white/20 text-white border border-white/30'
                                  : 'bg-white/10 text-white/70'
                              }`}
                            >
                              {prop.status === 'PENDING_REVIEW' ? 'Pending Review' : prop.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-2">
                          <div className="text-xl font-black text-gold">
                            {formatMonthlyRentNPR(monthly, lang)}
                          </div>
                          <h4 className="text-sm font-black text-white line-clamp-1">{prop.title}</h4>
                          <p className="text-xs text-white/70 flex items-center gap-1 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                            <span>{prop.locality}, {prop.district}</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                        <Link
                          href={`/properties/${prop.id}`}
                          className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
                        >
                          <span>View Public Page</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gold" />
                        </Link>

                        {prop.status === 'PENDING_REVIEW' ? (
                          <span className="text-[10px] font-bold text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full">
                            Under Admin Review
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingPropertyId === prop.id}
                            onClick={() => handleToggleListingStatus(prop.id, prop.status)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              prop.status === 'ACTIVE'
                                ? 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                                : 'bg-gold text-black font-black border-gold'
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
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  <h2 className="text-lg font-black text-white">
                    {lang === 'en' ? 'Scheduled Visit Requests Received' : 'घर हेर्न आएका अनुरोधहरू'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-gold bg-gold/20 px-3 py-1 rounded-full border border-gold/30">
                  {ownerVisitRequests.length} Requests
                </span>
              </div>

              {ownerVisitRequests.length === 0 ? (
                <p className="text-xs text-white/70 py-6 text-center font-medium">
                  No property visit requests received yet.
                </p>
              ) : (
                <div className="divide-y divide-white/10">
                  {ownerVisitRequests.map((req) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{req.renter?.full_name || 'Prospective Tenant'}</span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              req.status === 'CONFIRMED'
                                ? 'bg-gold text-black'
                                : req.status === 'DECLINED'
                                ? 'bg-white/20 text-white'
                                : 'bg-gold/20 text-gold border border-gold/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 font-medium">
                          Property: <span className="font-bold text-white">{req.property?.title}</span> ({req.property?.locality})
                        </p>
                        <p className="text-xs text-gold font-bold">
                          Date: <span>{req.visit_date}</span> • Slot: <span>{req.time_slot}</span>
                        </p>
                        {req.renter?.phone_np && (
                          <p className="text-xs text-white/70 font-mono">
                            Tenant Contact: <a href={`tel:${req.renter.phone_np}`} className="text-gold underline font-bold">{req.renter.phone_np}</a>
                          </p>
                        )}
                        {req.note && (
                          <p className="text-[11px] text-white/50 italic mt-0.5">&quot;{req.note}&quot;</p>
                        )}
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateVisitStatus(req.id, 'CONFIRMED')}
                            className="px-4 py-2 rounded-xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs shadow-card"
                          >
                            Confirm Visit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateVisitStatus(req.id, 'DECLINED')}
                            className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-xs"
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
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gold" />
                  <h2 className="text-lg font-black text-white">
                    {lang === 'en' ? 'Tenants Who Unlocked Your Contact' : 'सम्पर्क अनलक गरेका भाडावालहरू'}
                  </h2>
                </div>
                <span className="text-xs font-bold text-gold bg-gold/20 px-3 py-1 rounded-full border border-gold/30">
                  {ownerEnquiries.length} Tenants
                </span>
              </div>

              {ownerEnquiries.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Phone className="w-8 h-8 text-white/30 mx-auto mb-1" />
                  <p className="text-xs text-white/70 font-medium">
                    {lang === 'en'
                      ? 'No tenants have unlocked your contact yet. Verified tenants will appear here.'
                      : 'हालसम्म कुनै भाडावालले सम्पर्क खोल्नुभएको छैन।'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {ownerEnquiries.map((enq) => (
                    <div key={enq.id} className="py-3.5 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{enq.renter?.full_name || 'Tenant Member'}</h4>
                        <p className="text-[11px] text-white/70 font-medium">
                          Listing: {enq.property?.title} ({enq.property?.locality})
                        </p>
                      </div>
                      <div className="text-right">
                        <a
                          href={`tel:${enq.renter?.phone_np}`}
                          className="text-xs font-mono font-bold text-gold underline block"
                        >
                          {enq.renter?.phone_np || 'N/A'}
                        </a>
                        <span className="text-[10px] text-white/50">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.06] p-6 sm:p-7 rounded-3xl border border-gold/30 shadow-card">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Heart className="w-6 h-6 text-gold fill-gold" />
                  <span>{lang === 'en' ? 'My Shortlisted Rentals' : 'सुरक्षित गरिएका भाडाका सूचीहरू'}</span>
                </h1>
                <p className="text-xs sm:text-sm text-white/70 font-medium mt-1">
                  Homes and rooms bookmarked for comparison. Unlock landlord phone numbers with your free credits.
                </p>
              </div>

              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs sm:text-sm shadow-card transition-all shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Explore More Rentals</span>
              </Link>
            </div>

            {loadingShortlist ? (
              <div className="p-12 text-center text-white/70">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gold mb-2" />
                <p className="text-xs font-bold text-white">Loading shortlist...</p>
              </div>
            ) : shortlistedProperties.length === 0 ? (
              <div className="p-12 rounded-3xl border-2 border-dashed border-white/20 bg-white/[0.04] text-center">
                <Heart className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <h3 className="text-base font-black text-white">Your shortlist is empty</h3>
                <p className="text-xs text-white/70 max-w-sm mx-auto mt-1 mb-5 font-medium">
                  Browse rentals and click the heart icon to save listings here.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs shadow-card"
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
            <div className="bg-white/[0.06] border border-gold/30 rounded-3xl p-6 sm:p-7 text-white shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-gold block">
                  Renter Contact Unlocks
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-1 text-gold">
                  {creditsRemaining} Credits Remaining
                </h2>
                <p className="text-xs text-white/70 mt-1 font-medium">
                  15 complimentary credits provided upon registration to connect directly with landlords.
                </p>
              </div>
              <Link
                href="/search"
                className="px-6 py-3 rounded-2xl bg-gold text-black font-black text-xs shadow-card hover:bg-gold/90 transition-all shrink-0 active:scale-97"
              >
                Find More Rentals
              </Link>
            </div>

            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
              <h3 className="text-base font-black text-white">
                {lang === 'en' ? 'Unlocked Landlord Contacts' : 'अनलक गरिएका घरधनीहरूको सूची'}
              </h3>

              {loadingWallet ? (
                <div className="p-8 text-center text-white/70 font-bold">Loading unlocks...</div>
              ) : unlockedContacts.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <Phone className="w-10 h-10 text-white/30 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">
                      {lang === 'en' ? 'No Landlord Contacts Unlocked' : 'कुनै घरधनी सम्पर्क अनलक भएको छैन'}
                    </h4>
                    <p className="text-xs text-white/70 max-w-sm mx-auto font-medium">
                      {lang === 'en'
                        ? 'Browse rental listings and click "Contact Owner" using your free credits to view verified landlord phone numbers.'
                        : 'भाडाका सूचीहरू हेर्नुहोस् र आफ्नो निःशुल्क क्रेडिट प्रयोग गरी घरधनीको फोन नम्बर खोल्नुहोस्।'}
                    </p>
                  </div>
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl bg-gold hover:bg-gold/90 text-black font-black text-xs shadow-card"
                  >
                    <Search className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Browse Rentals' : 'भाडाका सूची हेर्नुहोस्'}</span>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {unlockedContacts.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-black text-white">{item.owner?.full_name || 'Landlord'}</h4>
                        <p className="text-xs text-white/70 font-medium">
                          {item.property?.title} ({item.property?.locality}, {item.property?.district})
                        </p>
                        <span className="text-xs text-gold font-black block mt-0.5">
                          {formatMonthlyRentNPR(item.property?.monthly_rent_npr || item.property?.price_npr, lang)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${item.owner?.phone_np}`}
                          className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs flex items-center gap-1.5 shadow-card"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>{item.owner?.phone_np}</span>
                        </a>
                        <a
                          href={`https://wa.me/${item.owner?.phone_np?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-white/10 active:scale-97"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-gold" />
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
          <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gold" />
                <h2 className="text-lg font-black text-white">
                  {lang === 'en' ? 'My Scheduled Property Visits' : 'मैले अनुरोध गरेका भ्रमणहरू'}
                </h2>
              </div>
              <span className="text-xs font-bold text-gold bg-gold/20 px-3 py-1 rounded-full border border-gold/30">
                {renterVisitRequests.length} Visits
              </span>
            </div>

            {renterVisitRequests.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <Calendar className="w-10 h-10 text-white/30 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'en' ? 'No Scheduled Visits' : 'कुनै भ्रमण तालिका छैन'}
                  </h4>
                  <p className="text-xs text-white/70 max-w-sm mx-auto font-medium">
                    {lang === 'en'
                      ? "You haven't scheduled any property visits yet. Open any rental property detail page to pick a morning, afternoon, or evening slot."
                      : 'तपाईंले कुनै घर हेर्ने समय मिलाउनुभएको छैन। जुनसुकै भाडाको विवरण पेजमा गएर समय छनोट गर्नुहोस्।'}
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl bg-gold hover:bg-gold/90 text-black font-black text-xs shadow-card"
                >
                  <Search className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Explore Rentals to Visit' : 'भाडाका सूचीहरू खोज्नुहोस्'}</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {renterVisitRequests.map((v) => (
                  <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/properties/${v.property_id}`} className="text-sm font-black text-gold hover:underline">
                          {v.property?.title}
                        </Link>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            v.status === 'CONFIRMED'
                              ? 'bg-gold text-black'
                              : v.status === 'DECLINED'
                              ? 'bg-white/20 text-white'
                              : 'bg-gold/20 text-gold border border-gold/30'
                          }`}
                        >
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-medium">
                        {v.property?.locality}, {v.property?.district}
                      </p>
                      <p className="text-xs text-white font-bold">
                        Requested Date: <span>{v.visit_date}</span> • Slot: <span>{v.time_slot}</span>
                      </p>
                      {v.owner?.phone_np && (
                        <p className="text-xs text-white/70 font-mono">
                          Landlord: <span className="font-semibold text-white">{v.owner.full_name}</span> (<a href={`tel:${v.owner.phone_np}`} className="text-gold underline font-bold">{v.owner.phone_np}</a>)
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
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-8 shadow-card space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {lang === 'en' ? 'Account Profile & Role Details' : 'खाता प्रोफाइल र भूमिका विवरण'}
              </h2>

              {/* Profile Completion Checklist (Lazy Profile) */}
              <div className="p-6 rounded-3xl bg-white/[0.04] border border-gold/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-gold" />
                      <span>{lang === 'en' ? 'Profile Completion Checklist' : 'प्रोफाइल पूर्णता चेकलिस्ट'}</span>
                    </h3>
                    <p className="text-[11px] text-white/70 mt-0.5 font-medium">
                      {lang === 'en'
                        ? 'Profile completion is lazy and never blocks access to the marketplace.'
                        : 'प्रोफाइल विवरण नभए पनि बजार चलाउन कुनै रोकतोक छैन।'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                      profile?.profile_completed
                        ? 'bg-gold text-black shadow-xs'
                        : 'bg-white/10 text-white/70 border border-white/20'
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
                  <div className="p-3.5 rounded-2xl bg-gold text-black text-xs font-bold flex items-center gap-2 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {!profile?.profile_completed && !editingProfile && (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-gold/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">
                        {lang === 'en' ? 'Complete your verified profile' : 'आफ्नो प्रोफाइल विवरण पूरा गर्नुहोस्'}
                      </h4>
                      <p className="text-[11px] text-white/70">
                        {lang === 'en'
                          ? 'Add your legal name and primary district so landlords and tenants can verify your identity.'
                          : 'आफ्नो कानुनी नाम र मुख्य जिल्ला थप्नुहोस् ताकि घरधनी र भाडावालहरूले तपाईंको पहिचान पुष्टि गर्न सकून्।'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={startEditProfile}
                      className="px-4 py-2 rounded-xl bg-gold hover:bg-gold/90 text-black font-black text-xs shrink-0 shadow-card active:scale-97"
                    >
                      {lang === 'en' ? 'Complete Profile' : 'प्रोफाइल भर्नुहोस्'}
                    </button>
                  </div>
                )}

                {/* Checklist Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Name Item */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
                        Full Legal Name
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {profile?.full_name ? (
                          <>
                            <Check className="w-4 h-4 text-gold shrink-0 stroke-[3]" />
                            <span>{profile.full_name}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-white/20 text-sm">○</span>
                            <span className="text-white/50 font-normal italic">
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
                        className="px-3 py-1 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors border border-white/20"
                      >
                        {profile?.full_name ? (lang === 'en' ? 'Edit' : 'सम्पादन') : (lang === 'en' ? 'Add' : 'थप्नुहोस्')}
                      </button>
                    )}
                  </div>

                  {/* District Item */}
                  <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 block">
                        Primary District
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        {profile?.preferred_district ? (
                          <>
                            <Check className="w-4 h-4 text-gold shrink-0 stroke-[3]" />
                            <span>{profile.preferred_district}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-white/20 text-sm">○</span>
                            <span className="text-white/50 font-normal italic">
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
                        className="px-3 py-1 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-colors border border-white/20"
                      >
                        {profile?.preferred_district ? (lang === 'en' ? 'Edit' : 'सम्पादन') : (lang === 'en' ? 'Set' : 'सेट गर्नुहोस्')}
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form */}
                {editingProfile && (
                  <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-black/80 border border-gold/30 space-y-4 pt-4 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          {lang === 'en' ? 'Full Legal Name' : 'पूरा कानुनी नाम'} *
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="e.g. Ram Bahadur Shrestha"
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white mb-1">
                          {lang === 'en' ? 'Primary District' : 'मुख्य जिल्ला'} *
                        </label>
                        <select
                          value={editDistrict}
                          onChange={(e) => setEditDistrict(e.target.value)}
                          className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                        >
                          {ALL_NEPAL_DISTRICTS.map((d) => (
                            <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                              {lang === 'ne' ? d.nameNe : d.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-[11px] text-gold font-bold">
                      ✓ Unit system derived from district: <strong className="font-black text-white">{getRegionForDistrict(editDistrict)}</strong> ({getRegionForDistrict(editDistrict) === 'HILLY' ? 'Ropani-Aana' : 'Bigha-Kattha'})
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditingProfile(false)}
                        className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold text-xs"
                      >
                        {lang === 'en' ? 'Cancel' : 'रद्द गर्नुहोस्'}
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs shadow-card"
                      >
                        {savingProfile ? (lang === 'en' ? 'Saving...' : 'सुरक्षित गरिँदैछ...') : (lang === 'en' ? 'Save Profile' : 'सुरक्षित गर्नुहोस्')}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-white/60 block font-semibold">User Role</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">
                      {userRole === 'OWNER' ? 'Property Owner / Landlord (घरधनी)' : 'Direct Renter (भाडामा लिने)'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-gold text-black text-[10px] font-black uppercase tracking-wider">
                      Permanent
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 mt-1 font-medium">
                    {userRole === 'OWNER'
                      ? 'You can list rental spaces 100% free and manage tenant visit requests.'
                      : 'You can search, shortlist rentals, unlock owner contacts and schedule visits.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                  <span className="text-white/60 block font-semibold">Phone Number</span>
                  <span className="font-mono font-black text-sm text-gold">{profile?.phone_np}</span>
                  <p className="text-[11px] text-white/60 mt-1 font-medium">
                    To use the other role, register a separate phone number.
                  </p>
                </div>
              </div>

              {/* Land Measurement Converter Component */}
              <div className="pt-4 border-t border-white/10">
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
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
