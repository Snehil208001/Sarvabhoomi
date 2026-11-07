'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Heart,
  Share2,
  Calendar,
  Eye,
  Coins,
  Unlock,
  AlertCircle,
  MessageCircle,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Send,
} from 'lucide-react';
import {
  Property,
  formatMonthlyRentNPR,
  formatDeposit,
  formatArea,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';
import { PropertyImage } from '@/components/PropertyImage';
import { RenterNameModal } from '@/components/auth/RenterNameModal';
import { PropertyCard } from '@/components/PropertyCard';
import { Footer } from '@/components/Footer';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [lang, setLang] = useState<'en' | 'ne'>('en');

  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticated user state
  const [user, setUser] = useState<{ id: string; phone?: string; credits: number; userRole?: 'RENTER' | 'OWNER' | null; fullName?: string | null } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [ownerContact, setOwnerContact] = useState<{
    phone: string;
    name: string;
  } | null>(null);

  // Visit Request State
  const [visitRequest, setVisitRequest] = useState<{
    id: string;
    visit_date: string;
    time_slot: string;
    status: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  } | null>(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTimeSlot, setVisitTimeSlot] = useState('Morning (9 AM - 12 PM)');
  const [visitNote, setVisitNote] = useState('');
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [visitSuccessMsg, setVisitSuccessMsg] = useState<string | null>(null);
  const [showNameModalForVisit, setShowNameModalForVisit] = useState(false);

  // Photo viewer state
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Modal state
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Feedback notice
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!propertyId) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch current authenticated user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        let currentUserId: string | null = null;
        if (authUser && isMounted) {
          currentUserId = authUser.id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('user_role, full_name')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser({
            id: authUser.id,
            phone: authUser.phone,
            credits: sub?.credits_remaining ?? 15,
            userRole: profile?.user_role || null,
            fullName: profile?.full_name || null,
          });
        }

        // 2. Fetch Property row with joined owner profile
        const { data: propData, error: propErr } = await supabase
          .from('properties')
          .select(`
            *,
            owner:profiles (
              id,
              full_name,
              phone_np,
              user_role,
              user_intent
            )
          `)
          .eq('id', propertyId)
          .maybeSingle();

        if (propErr) throw propErr;
        if (!propData) {
          if (isMounted) setError('Rental property not found.');
          return;
        }

        if (isMounted) {
          setProperty(propData as unknown as Property);
        }

        // Increment view count
        await supabase
          .from('properties')
          .update({ views_count: (propData.views_count || 0) + 1 })
          .eq('id', propertyId);

        // Check if unlocked or favorited
        if (currentUserId && isMounted) {
          const { data: unlockRow } = await supabase
            .from('contact_unlocks')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('property_id', propertyId)
            .maybeSingle();

          if (unlockRow) {
            setIsUnlocked(true);
            const ownerProfile = (propData as any).owner;
            setOwnerContact({
              phone: ownerProfile?.phone_np || 'N/A',
              name: ownerProfile?.full_name || 'Landlord',
            });
          }

          const { data: favRow } = await supabase
            .from('property_favourites')
            .select('id')
            .eq('user_id', currentUserId)
            .eq('property_id', propertyId)
            .maybeSingle();

          if (favRow) setIsFavorite(true);

          // Check if visit request exists
          const { data: vReq } = await supabase
            .from('property_visit_requests')
            .select('id, visit_date, time_slot, status')
            .eq('property_id', propertyId)
            .eq('renter_id', currentUserId)
            .maybeSingle();

          if (vReq && isMounted) {
            setVisitRequest(vReq as any);
          }
        }

        // 3. Fetch similar rentals in the same district
        const { data: simData } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'ACTIVE')
          .eq('listing_type', 'RENT_HOUSE')
          .eq('district', propData.district)
          .neq('id', propData.id)
          .limit(3);

        if (simData && isMounted) {
          setSimilarProperties(simData as unknown as Property[]);
        }
      } catch (err: unknown) {
        console.error('Error loading property detail:', err);
        if (isMounted) {
          setError('Failed to load property details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  // Lightbox keyboard navigation & escape to close
  useEffect(() => {
    if (!isLightboxOpen) return;
    const numPhotos = property?.photos && property.photos.length > 0 ? property.photos.length : 1;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft' && numPhotos > 1) {
        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : numPhotos - 1));
      }
      if (e.key === 'ArrowRight' && numPhotos > 1) {
        setActivePhotoIdx((prev) => (prev < numPhotos - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, property?.photos]);

  const handleToggleFavorite = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const nextState = !isFavorite;
    setIsFavorite(nextState);

    if (nextState) {
      await supabase.from('property_favourites').insert({
        user_id: user.id,
        property_id: propertyId,
      });
    } else {
      await supabase
        .from('property_favourites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleUnlockSuccess = (
    _id: string,
    details: { phone: string; name: string; creditsRemaining: number }
  ) => {
    setIsUnlocked(true);
    setOwnerContact({
      phone: details.phone,
      name: details.name,
    });
    if (user) {
      setUser((prev) => (prev ? { ...prev, credits: details.creditsRemaining } : null));
    }
  };

  // Schedule a Visit Request
  const executeVisitRequest = async () => {
    if (!user || !property || !visitDate) return;
    setSubmittingVisit(true);
    setVisitSuccessMsg(null);

    try {
      const { data: newV, error: vErr } = await supabase
        .from('property_visit_requests')
        .insert({
          property_id: propertyId,
          renter_id: user.id,
          owner_id: property.owner_id,
          visit_date: visitDate,
          time_slot: visitTimeSlot,
          note: visitNote.trim() || null,
          status: 'PENDING',
        })
        .select('id, visit_date, time_slot, status')
        .single();

      if (!vErr && newV) {
        setVisitRequest(newV as any);
        setVisitSuccessMsg(
          lang === 'en'
            ? 'Visit request sent to owner! Awaiting confirmation.'
            : 'घर हेर्ने अनुरोध पठाइयो! घरधनीको स्वीकृतिको प्रतीक्षामा।'
        );
      } else if (vErr) {
        console.warn('Error saving visit request:', vErr.message);
      }
    } catch (err) {
      console.error('Error submitting visit request:', err);
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth');
      return;
    }
    if (!visitDate) return;

    // Lazy Profile Gate: Prompt for name if missing, then continue automatically
    if (!user.fullName || user.fullName.trim() === '') {
      setShowNameModalForVisit(true);
      return;
    }

    await executeVisitRequest();
  };

  const handleNameSavedForVisit = async (savedName: string) => {
    setUser((prev) => (prev ? { ...prev, fullName: savedName } : null));
    setShowNameModalForVisit(false);
    await executeVisitRequest();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-gold/40 shadow-card animate-pulse">
            <Image
              src="/logo/logo-mark.png"
              alt="Sarvabhoomi"
              width={48}
              height={48}
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs text-white/70 font-semibold tracking-wide">
            {lang === 'en' ? 'Loading rental details...' : 'भाडाको विवरण लोड हुँदैछ...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-8 max-w-md w-full text-center space-y-4 shadow-card text-white backdrop-blur-md">
          <div className="w-14 h-14 rounded-2xl bg-white/5 text-gold flex items-center justify-center mx-auto border border-gold/30">
            <AlertCircle className="w-7 h-7 text-gold" />
          </div>
          <h2 className="text-xl font-black text-gold tracking-tight">
            {lang === 'en' ? 'Property Not Available' : 'सम्पत्ति फेला परेन'}
          </h2>
          <p className="text-xs text-white/70 leading-relaxed font-medium">
            {error || 'This listing might have been removed or is no longer active.'}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs shadow-card transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'en' ? 'Back to Search' : 'खोज सूचीमा फर्कनुहोस्'}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Owner detail gate: An OWNER who opens a listing directly gets a designed restricted view
  if (user?.userRole === 'OWNER') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between">
        <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-gold/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/70 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gold" />
              <span>{lang === 'en' ? 'Back to Dashboard' : 'ड्यासबोर्डमा फर्कनुहोस्'}</span>
            </Link>

            <button
              type="button"
              onClick={() => setLang((l) => (l === 'en' ? 'ne' : 'en'))}
              className="px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-gold text-xs font-bold transition-colors shadow-subtle"
              title="Toggle language"
            >
              {lang === 'en' ? 'नेपाली' : 'English'}
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-8 sm:p-10 max-w-lg w-full text-center space-y-5 shadow-card backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-gold/30 flex items-center justify-center mx-auto text-gold shadow-subtle">
              <ShieldAlert className="w-8 h-8 text-gold" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-[10px] font-black uppercase tracking-wider inline-block">
                {lang === 'en' ? 'Owner Portal Restricted' : 'घरधनी पहुँच सीमित'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {lang === 'en'
                  ? "Owners can't browse rentals — this is a renter view"
                  : 'घरधनीहरूले भाडाका विज्ञापन ब्राउज गर्न सक्नुहुन्न — यो भाडामा बस्नेहरूको लागि हो'}
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-medium">
              {lang === 'en'
                ? 'Your Sarvabhoomi account is registered as a Property Owner. As an owner, you can post new rental listings and manage tenant visit requests in your dedicated dashboard.'
                : 'तपाईंको खाता घरधनी (Owner) को रूपमा दर्ता छ। घरधनीको रूपमा तपाईं आफ्ना भाडाका घर-कोठाका विज्ञापन राख्न र ग्राहकहरूको अनुरोध व्यवस्थापन गर्न सक्नुहुन्छ।'}
            </p>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs sm:text-sm shadow-card transition-all"
              >
                <span>{lang === 'en' ? 'Go to Owner Dashboard' : 'घरधनी ड्यासबोर्डमा जानुहोस्'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
            </div>
          </div>
        </main>

        <Footer lang={lang} />
      </div>
    );
  }

  const photos =
    property.photos && property.photos.length > 0 ? property.photos : [];

  const monthlyRent = property.monthly_rent_npr || property.price_npr;
  const deposit = property.deposit_npr;
  const maintenance = property.maintenance_npr;
  const sqft = property.area_sqft || Math.round(property.area_value);

  // Minimum date for visit is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-gold/30 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/70 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gold" />
            <span>{lang === 'en' ? 'Back to Search' : 'खोजमा फर्कनुहोस्'}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setLang((l) => (l === 'en' ? 'ne' : 'en'))}
              className="px-2.5 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-gold text-xs font-bold transition-colors shadow-subtle"
              title="Toggle language"
            >
              {lang === 'en' ? 'नेपाली' : 'English'}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-subtle"
              title="Share listing link"
            >
              <Share2 className="w-4 h-4 text-gold" />
              <span className="hidden sm:inline">
                {copyFeedback ? (lang === 'en' ? 'Link Copied!' : 'लिङ्क कपी भयो') : 'Share'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition-all shadow-subtle flex items-center gap-1.5 text-xs font-bold ${
                isFavorite
                  ? 'bg-gold text-black border-gold'
                  : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-black text-black' : 'text-gold'}`} />
              <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">
        {/* Title & Badges Bar */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-gold border border-gold/30 text-xs font-black uppercase tracking-wider">
              {property.property_subtype || 'Rental'}
            </span>
            {property.admin_verified ? (
              <span
                title="Government cadastral verified by Sarvabhoomi"
                className="px-3 py-1 rounded-full bg-gold text-black text-xs font-black flex items-center gap-1 shadow-subtle"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Lalpurja Verified</span>
              </span>
            ) : property.owner_declared_lalpurja ? (
              <span
                title="Lalpurja claimed by owner — pending cadastral verification by Sarvabhoomi"
                className="px-3 py-1 rounded-full bg-white/10 text-gold border border-gold/30 text-xs font-bold flex items-center gap-1 shadow-subtle"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-gold" />
                <span>Lalpurja Claimed (Pending)</span>
              </span>
            ) : null}

            <span className="px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-bold uppercase tracking-wider">
              0% Brokerage
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
            {property.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-white/70">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <MapPin className="w-4 h-4 text-gold shrink-0" />
              <span>
                {property.locality}
                {property.ward ? `, Ward ${property.ward}` : ''}, {property.district}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Eye className="w-3.5 h-3.5 text-gold/70" />
              <span>{property.views_count || 1} views</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Calendar className="w-3.5 h-3.5 text-gold/70" />
              <span>Listed {new Date(property.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Photo Gallery with Ambient Backdrop or No-Photo Placeholder */}
        {/* ============================================================ */}
        {photos.length === 0 ? (
          <div className="relative h-[240px] sm:h-[320px] rounded-3xl overflow-hidden shadow-card border border-gold/30 bg-white/[0.04] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-gold/30 flex items-center justify-center text-gold mb-3 shadow-card">
              <Eye className="w-7 h-7 text-gold/60" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">
              {lang === 'en' ? 'No photos uploaded yet' : 'हालसम्म कुनै तस्बिर छैन'}
            </h3>
            <p className="text-xs text-white/70 max-w-sm font-medium">
              {lang === 'en'
                ? 'The landlord has not uploaded photos for this rental listing yet. You can schedule a visit to inspect the property in person.'
                : 'घरधनीले हालसम्म यस भाडाको सम्पत्तिको तस्बिर अपलोड गर्नुभएको छैन। सम्पत्ति प्रत्यक्ष हेर्नको लागि भिजिट तय गर्नुहोस्।'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative h-[360px] sm:h-[460px] md:h-[520px] rounded-3xl overflow-hidden shadow-card border border-gold/30 bg-black">
              {/* Ambient Blurred Backdrop */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                <PropertyImage
                  src={photos[activePhotoIdx]}
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover blur-3xl opacity-40 scale-125 brightness-75 transition-all duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
              </div>

              {/* Foreground Display Image */}
              <div
                onClick={() => setIsLightboxOpen(true)}
                className={`relative w-full h-full cursor-zoom-in flex items-center justify-center z-1 transition-all ${
                  imageFitMode === 'contain' ? 'p-3 sm:p-6' : ''
                }`}
              >
                <PropertyImage
                  src={photos[activePhotoIdx]}
                  alt={`${property.title} - Photo ${activePhotoIdx + 1}`}
                  fill
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  className={`${
                    imageFitMode === 'contain' ? 'object-contain drop-shadow-2xl' : 'object-cover'
                  } transition-all duration-300`}
                  priority
                />
              </div>

              {/* Gallery Control Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                <span className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-black/80 border border-gold/30 backdrop-blur-md text-gold text-xs font-mono font-bold shadow-card">
                  Photo {activePhotoIdx + 1} of {photos.length}
                </span>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setImageFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'))}
                    className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black border border-gold/30 backdrop-blur-md text-gold text-xs font-bold flex items-center gap-1.5 transition-colors shadow-card"
                  >
                    {imageFitMode === 'contain' ? (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-gold" />
                        <span className="hidden sm:inline">Fill Frame</span>
                      </>
                    ) : (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-gold" />
                        <span className="hidden sm:inline">Fit Whole Image</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black border border-gold/30 backdrop-blur-md text-gold text-xs font-bold flex items-center gap-1.5 transition-colors shadow-card"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </button>
                </div>
              </div>

              {/* Previous / Next Arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 hover:bg-black border border-gold/30 backdrop-blur-md text-gold flex items-center justify-center transition shadow-card z-10"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 hover:bg-black border border-gold/30 backdrop-blur-md text-gold flex items-center justify-center transition shadow-card z-10"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails row */}
            {photos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {photos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-20 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      activePhotoIdx === idx
                        ? 'border-gold shadow-card ring-2 ring-gold/50'
                        : 'border-white/10 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <PropertyImage src={url} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* Two-Column Rental Details & Actions                          */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 Cols): Rent Breakdown, Specs, Cadastral Map */}
          <div className="lg:col-span-2 space-y-8">
            {/* Rent Breakdown Dashboard Banner */}
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <div className="pb-3 sm:pb-0">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                  Monthly Rent
                </span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-gold tracking-tight mt-0.5 block">
                  {formatMonthlyRentNPR(monthlyRent, lang)}
                </span>
                <span className="text-[11px] font-bold text-white/60">Fixed Monthly</span>
              </div>

              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                  Security Deposit
                </span>
                <span className="text-base sm:text-lg font-black text-white mt-0.5 block">
                  {formatDeposit(deposit, lang)}
                </span>
                <span className="text-[11px] text-white/60">Refundable at move-out</span>
              </div>

              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                  Maintenance
                </span>
                <span className="text-base sm:text-lg font-black text-white mt-0.5 block">
                  {maintenance
                    ? `Rs. ${maintenance.toLocaleString('en-IN')}/mo`
                    : property.maintenance_included
                      ? 'Included in Rent'
                      : 'No Maintenance Fee'}
                </span>
                <span className="text-[11px] text-white/60">Society / Water maintenance</span>
              </div>

              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                  Built-up Area
                </span>
                <span className="text-base sm:text-lg font-black text-white mt-0.5 block">
                  {sqft.toLocaleString()} sq. ft.
                </span>
                <span className="text-[11px] text-white/60">
                  {formatArea(property.area_value, property.area_unit, lang, { includeSqft: false })}
                </span>
              </div>
            </div>

            {/* Description Narrative */}
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
              <h3 className="text-lg font-black text-gold tracking-tight">
                {lang === 'en' ? 'Rental Overview & Description' : 'भाडा सम्बन्धी थप विवरण'}
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed whitespace-pre-line font-medium">
                {property.description ||
                  'Direct landlord listing. Verified property specs with zero middleman commission. Rent directly through Sarvabhoomi peer-to-peer network.'}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
              <h3 className="text-lg font-black text-gold tracking-tight">
                {lang === 'en' ? 'Rental Specifications & Amenities' : 'सुविधा तथा प्राविधिक विवरण'}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Property Subtype</span>
                  <span className="font-bold text-white">{property.property_subtype || 'Rental'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Bedrooms / BHK</span>
                  <span className="font-bold text-white">
                    {property.bedrooms ? `${property.bedrooms} BHK (${property.bedrooms} Bedrooms)` : 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Bathrooms</span>
                  <span className="font-bold text-white">
                    {property.bathrooms ? `${property.bathrooms} Bathrooms` : 'Not specified'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Furnishing Status</span>
                  <span className="font-bold text-white">
                    {property.furnishing
                      ? `${property.furnishing.charAt(0) + property.furnishing.slice(1).toLowerCase()} Furnished`
                      : 'Not specified'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Preferred Tenant</span>
                  <span className="font-bold text-white">{property.preferred_tenant || 'Any Tenant'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Floor Information</span>
                  <span className="font-bold text-white">
                    {property.floor_no !== null && property.floor_no !== undefined
                      ? `Floor ${property.floor_no}${property.total_floors ? ` of ${property.total_floors}` : ''}`
                      : 'Independent Floor'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Dedicated Parking</span>
                  <span className="font-bold text-white">
                    {property.parking ? 'Available (Yes)' : 'No Dedicated Parking'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Available From</span>
                  <span className="font-bold text-white">
                    {property.available_from ? `From ${property.available_from}` : 'Ready to Move'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Facing / Orientation</span>
                  <span className="font-bold text-white">{property.facing || 'East Facing'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Road Width</span>
                  <span className="font-bold text-white">{property.road_access || '16 ft Pitched'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
                  <span className="text-white/60 block mb-1 font-medium">Cadastral Kitta No</span>
                  <span className="font-mono font-bold text-gold">
                    {property.kitta_no || 'Verified on Inquiry'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-gold text-black border border-gold">
                  <span className="text-black/80 block mb-1 font-semibold">Ownership Verification</span>
                  <span className="font-black text-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>Lalpurja Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Cadastral Survey & Location Reference */}
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-7 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gold tracking-tight">
                    {lang === 'en' ? 'Location & Neighborhood Reference' : 'लोकेसन तथा वरपरका सुविधाहरू'}
                  </h3>
                  <p className="text-xs text-white/70 font-medium">
                    {property.locality}, {property.district} • Kitta #{property.kitta_no || 'Verified plot reference'}
                  </p>
                </div>
              </div>

              {/* Cadastral & Location Display */}
              <div className="relative h-64 w-full rounded-2xl bg-black overflow-hidden border border-white/10 flex items-center justify-center p-6 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,169,100,0.15)_0%,transparent_70%)]" />

                <div className="relative z-10 max-w-sm space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gold text-black flex items-center justify-center mx-auto shadow-card">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">
                      {property.locality}, {property.district}
                    </h4>
                    <p className="text-xs text-white/70 mt-0.5">
                      Ward / Area: {property.locality} • Official District: {property.district}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${property.locality}, ${property.district}, Nepal`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold hover:bg-gold/90 active:scale-97 text-black text-xs font-black transition-all shadow-card"
                    >
                      <span>{lang === 'en' ? 'Explore on Google Maps' : 'गुगल नक्सामा हेर्नुहोस्'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Area Landmark Queries */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `Banks near ${property.locality}, ${property.district}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-center transition flex flex-col items-center justify-center group"
                >
                  <span className="text-white/60 block text-[10px] group-hover:text-gold">Banks & ATMs</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5 group-hover:text-gold">
                    <span>Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/50 group-hover:text-gold" />
                  </span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `Hospitals near ${property.locality}, ${property.district}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-center transition flex flex-col items-center justify-center group"
                >
                  <span className="text-white/60 block text-[10px] group-hover:text-gold">Healthcare</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5 group-hover:text-gold">
                    <span>Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/50 group-hover:text-gold" />
                  </span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `Schools near ${property.locality}, ${property.district}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-center transition flex flex-col items-center justify-center group"
                >
                  <span className="text-white/60 block text-[10px] group-hover:text-gold">Schools</span>
                  <span className="font-bold text-white flex items-center gap-1 mt-0.5 group-hover:text-gold">
                    <span>Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-white/50 group-hover:text-gold" />
                  </span>
                </a>
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center flex flex-col items-center justify-center">
                  <span className="text-white/60 block text-[10px]">Road Width</span>
                  <span className="font-bold text-white mt-0.5">{property.road_access || 'Standard Access'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Direct Owner Contact, Schedule Visit & Savings */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            {/* Primary Landlord Contact Card */}
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-gold/40 shadow-xs">
                    <Image
                      src="/logo/logo-mark.png"
                      alt="Direct Landlord"
                      width={36}
                      height={36}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Direct Landlord</h3>
                    <span className="text-[11px] text-gold font-bold">100% Zero Brokerage</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  P2P Direct
                </span>
              </div>

              {/* Contact Status */}
              {isUnlocked && ownerContact ? (
                /* UNLOCKED STATE */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                      Verified Landlord Name
                    </span>
                    <span className="text-sm font-black text-white block">{ownerContact.name}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
                      Direct Mobile Number
                    </span>
                    <span className="text-base font-mono font-bold text-gold block select-all">
                      {ownerContact.phone}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${ownerContact.phone}`}
                      className="py-3 px-4 rounded-xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-card"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Landlord</span>
                    </a>

                    <a
                      href={`https://wa.me/${ownerContact.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 active:scale-97 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 text-gold" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* LOCKED STATE */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/70 font-medium">
                      <span>Owner Status:</span>
                      <span className="font-bold text-white">Direct Landlord</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/70 font-medium">
                      <span>Phone Number:</span>
                      <span className="font-mono font-bold text-gold">+977 98••••••••</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsUnlockModalOpen(true)}
                    className="w-full py-4 px-6 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-sm tracking-wide shadow-card flex items-center justify-center gap-2 transition-all"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>
                      {lang === 'en' ? 'Unlock Owner Contact (1 Credit)' : 'घरधनी सम्पर्क खोल्नुहोस् (१ क्रेडिट)'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-white/70 px-1 font-semibold">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-gold" />
                      <span>Balance: {user ? `${user.credits} Credits` : 'Sign in to check'}</span>
                    </span>
                    <span className="text-gold font-black text-[11px]">15 Free Unlocks</span>
                  </div>
                </div>
              )}

              {/* Zero Brokerage Savings Line on Monthly Rent */}
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-white/70">
                <div className="flex items-center gap-2 font-bold text-gold">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>100% Zero Middleman Brokerage</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                  Traditional brokers in Nepal charge 1 month&apos;s full rent as commission. By connecting directly on Sarvabhoomi, you save{' '}
                  <span className="font-black text-gold">
                    Rs. {monthlyRent.toLocaleString('en-IN')}
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Schedule a Visit Card */}
            <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Calendar className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-black text-white">
                  {lang === 'en' ? 'Schedule a Property Visit' : 'घर हेर्न समय मिलाउनुहोस्'}
                </h3>
              </div>

              {visitRequest ? (
                /* Visit Request Sent State */
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      {lang === 'en' ? 'Visit Request Sent to Landlord' : 'घर हेर्ने अनुरोध पठाइयो'}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        visitRequest.status === 'CONFIRMED'
                          ? 'bg-gold text-black'
                          : visitRequest.status === 'DECLINED'
                            ? 'bg-white/20 text-white'
                            : 'bg-gold/20 text-gold border border-gold/30'
                      }`}
                    >
                      {visitRequest.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed font-medium">
                    Date: <span className="font-bold text-white">{visitRequest.visit_date}</span> • Slot:{' '}
                    <span className="font-bold text-white">{visitRequest.time_slot}</span>
                  </p>
                  <p className="text-[11px] text-white/60 font-medium">
                    {visitRequest.status === 'PENDING'
                      ? 'The landlord has received your requested date/time slot. They will confirm or contact you directly.'
                      : visitRequest.status === 'CONFIRMED'
                        ? 'The landlord has confirmed your visit slot!'
                        : 'The landlord is not available for this slot. Please choose another slot.'}
                  </p>
                </div>
              ) : (
                /* Visit Request Form */
                <form onSubmit={handleScheduleVisit} className="space-y-3">
                  {visitSuccessMsg && (
                    <div className="p-3 rounded-xl bg-gold text-black text-xs font-bold shadow-xs">
                      {visitSuccessMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      min={minDateStr}
                      value={visitDate}
                      required
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                      Time Slot
                    </label>
                    <select
                      value={visitTimeSlot}
                      onChange={(e) => setVisitTimeSlot(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    >
                      <option value="Morning (9 AM - 12 PM)" className="bg-black text-white">Morning (9 AM - 12 PM)</option>
                      <option value="Afternoon (12 PM - 3 PM)" className="bg-black text-white">Afternoon (12 PM - 3 PM)</option>
                      <option value="Evening (3 PM - 6 PM)" className="bg-black text-white">Evening (3 PM - 6 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                      Note for Landlord (Optional)
                    </label>
                    <input
                      type="text"
                      value={visitNote}
                      onChange={(e) => setVisitNote(e.target.value)}
                      placeholder="e.g. Coming with family, looking to move next week"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingVisit || !visitDate}
                    className="w-full py-3 px-4 rounded-xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingVisit ? 'Sending...' : 'Request Property Visit'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Verification Guarantee Card */}
            <div className="bg-white/[0.04] border border-gold/20 rounded-3xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-gold">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <span>Sarvabhoomi Lalpurja Protocol</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                Land and home ownership is verified against Cadastral Kitta records (कित्ता नम्बर) to guarantee zero middleman impersonation.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Verified Rentals in Same District */}
        {similarProperties.length > 0 && (
          <div className="pt-8 border-t border-white/10 space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gold tracking-tight">
                {lang === 'en' ? 'Similar Rentals in this District' : 'यस जिल्लाका अन्य भाडाका घर तथा कोठाहरू'}
              </h2>
              <p className="text-xs text-white/70 font-semibold mt-1">
                Direct peer-to-peer rentals in {property.district}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((sim) => (
                <PropertyCard
                  key={sim.id}
                  property={sim}
                  lang={lang}
                  onUnlock={() => router.push(`/properties/${sim.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Contact Unlock Modal */}
      {property && (
        <ContactUnlockModal
          isOpen={isUnlockModalOpen}
          onClose={() => setIsUnlockModalOpen(false)}
          property={property}
          currentUser={user}
          onUnlockSuccess={handleUnlockSuccess}
          lang={lang}
        />
      )}

      {/* Lazy Name Modal for Visit Request */}
      {user && (
        <RenterNameModal
          isOpen={showNameModalForVisit}
          userId={user.id}
          lang={lang}
          onClose={() => setShowNameModalForVisit(false)}
          onSuccess={handleNameSavedForVisit}
        />
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white max-w-7xl w-full mx-auto">
            <div className="pr-4">
              <h3 className="font-bold text-sm sm:text-base text-white/90 truncate max-w-md">
                {property.title}
              </h3>
              <p className="text-xs text-gold font-mono">
                Photo {activePhotoIdx + 1} of {photos.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 w-full max-w-7xl mx-auto my-3 flex items-center justify-center overflow-hidden">
            <PropertyImage
              src={photos[activePhotoIdx]}
              alt={property.title}
              fill
              sizes="100vw"
              className="object-contain"
            />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 hover:bg-black text-gold border border-gold/30 flex items-center justify-center transition shadow-card"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/80 hover:bg-black text-gold border border-gold/30 flex items-center justify-center transition shadow-card"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {photos.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activePhotoIdx === idx
                      ? 'border-gold scale-105 ring-2 ring-gold/50'
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <PropertyImage src={url} alt={`Thumbnail ${idx + 1}`} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Institutional Footer */}
      <Footer lang={lang} />
    </div>
  );
}
