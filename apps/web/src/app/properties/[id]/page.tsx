'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Phone,
  PhoneCall,
  Heart,
  Share2,
  Calendar,
  Eye,
  Compass,
  Building,
  Coins,
  Lock,
  Unlock,
  AlertCircle,
  Home,
  Tag,
  Check,
  MessageCircle,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  Property,
  formatPriceNPR,
  formatArea,
  formatPricePerUnit,
  toSqFt,
  getAuthDict,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { ContactUnlockModal } from '@/components/ContactUnlockModal';
import { PropertyImage } from '@/components/PropertyImage';
import { Footer } from '@/components/Footer';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  const [property, setProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticated user state
  const [user, setUser] = useState<{ id: string; phone?: string; credits: number } | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [ownerContact, setOwnerContact] = useState<{
    phone: string;
    name: string;
  } | null>(null);

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
              user_intent
            )
          `)
          .eq('id', propertyId)
          .maybeSingle();

        if (propErr || !propData) {
          if (isMounted) {
            setError('Property listing not found or has been removed.');
          }
          return;
        }

        const typedProperty = propData as unknown as Property;
        if (isMounted) {
          setProperty(typedProperty);
        }

        // 3. Increment views count
        supabase
          .from('properties')
          .update({ views_count: (propData.views_count || 0) + 1 })
          .eq('id', propertyId)
          .then();

        // 4. Check if current user is owner or has already unlocked contact
        if (currentUserId && isMounted) {
          const ownerObj = typedProperty.owner;
          if (currentUserId === propData.owner_id) {
            setIsUnlocked(true);
            setOwnerContact({
              phone: ownerObj?.phone_np || '+9779841000000',
              name: ownerObj?.full_name || 'You (Owner)',
            });
          } else {
            // Check contact_unlocks table
            const { data: unlockRow } = await supabase
              .from('contact_unlocks')
              .select('id')
              .eq('user_id', currentUserId)
              .eq('property_id', propertyId)
              .maybeSingle();

            if (unlockRow) {
              setIsUnlocked(true);
              setOwnerContact({
                phone: ownerObj?.phone_np || '+9779841000000',
                name: ownerObj?.full_name || 'Verified Owner',
              });
            }

            // Check favorites
            const { data: favRow } = await supabase
              .from('property_favourites')
              .select('id')
              .eq('user_id', currentUserId)
              .eq('property_id', propertyId)
              .maybeSingle();

            if (favRow) {
              setIsFavorite(true);
            }
          }
        }

        // 5. Fetch 3 similar properties in same district or category
        const { data: similarData } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'ACTIVE')
          .neq('id', propertyId)
          .eq('district', propData.district)
          .limit(3);

        if (similarData && isMounted) {
          setSimilarProperties(similarData as Property[]);
        }
      } catch (err) {
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
    const numPhotos = (property?.photos && property.photos.length > 0) ? property.photos.length : 1;
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

  // Toggle favorite
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

  // Copy listing link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  // On contact unlock success from modal
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-xs ring-4 ring-emerald-100 animate-pulse">
            स
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {lang === 'en' ? 'Loading verified property details...' : 'सम्पत्ति विवरण लोड हुँदैछ...'}
          </span>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            {lang === 'en' ? 'Property Not Available' : 'सम्पत्ति फेला परेन'}
          </h2>
          <p className="text-xs text-slate-500">{error || 'This listing might have been removed or marked as sold.'}</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'en' ? 'Back to Search' : 'खोज सूचीमा फर्कनुहोस्'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const photos =
    property.photos && property.photos.length > 0
      ? property.photos
      : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'];

  const sqft = toSqFt(property.area_value, property.area_unit);
  const sqm = Math.round(sqft * 0.092903 * 100) / 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          <Link
            href="/search"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'en' ? 'Back to Search' : 'खोजमा फर्कनुहोस्'}</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              title="Share listing link"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">
                {copyFeedback ? (lang === 'en' ? 'Link Copied!' : 'लिङ्क कपी भयो') : 'Share'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl border transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold ${
                isFavorite
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-600' : 'text-slate-500'}`} />
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
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              {property.listing_type.replace('_', ' ')}
            </span>
            {property.admin_verified ? (
              <span 
                title="Government cadastral verified by Sarvabhoomi"
                className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Lalpurja Verified Ownership</span>
              </span>
            ) : property.owner_declared_lalpurja ? (
              <span 
                title="Lalpurja claimed by owner — pending official cadastral survey verification"
                className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold flex items-center gap-1 shadow-2xs"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Lalpurja claimed by owner — pending verification</span>
              </span>
            ) : null}
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
              0% Brokerage Direct P2P
            </span>
            {property.kitta_no && (
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-mono font-bold">
                {property.kitta_no}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {property.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {property.locality}
                {property.ward ? `, Ward ${property.ward}` : ''}
                {property.municipality ? `, ${property.municipality}` : ''}, {property.district}
              </span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>{property.views_count} views</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Listed {new Date(property.created_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Photo Gallery Showcase */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[520px] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-md group">
            {/* Ambient Blurred Backdrop */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              <PropertyImage
                src={photos[activePhotoIdx]}
                alt=""
                fill
                className="object-cover blur-3xl scale-125 opacity-40 brightness-75 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" />
            </div>

            {/* Sharp Foreground Image */}
            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
              <PropertyImage
                src={photos[activePhotoIdx]}
                alt={property.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className={`${
                  imageFitMode === 'contain' ? 'object-contain' : 'object-cover'
                } transition-all duration-300 drop-shadow-xl`}
              />
            </div>

            {/* Top Bar: Controls */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              <div className="pointer-events-auto px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <span>Photo {activePhotoIdx + 1} of {photos.length}</span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                {/* Fit Mode Toggle */}
                <button
                  type="button"
                  onClick={() => setImageFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'))}
                  className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title={imageFitMode === 'contain' ? 'Switch to Fill Frame' : 'Switch to Fit Entire Image'}
                >
                  {imageFitMode === 'contain' ? (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fill Frame</span>
                    </>
                  ) : (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Fit Whole Image</span>
                    </>
                  )}
                </button>

                {/* Fullscreen Lightbox Button */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="View Fullscreen"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Carousel Previous / Next Arrows */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition shadow-md opacity-80 hover:opacity-100 z-10"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/85 backdrop-blur-md text-white flex items-center justify-center transition shadow-md opacity-80 hover:opacity-100 z-10"
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
                  className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activePhotoIdx === idx
                      ? 'border-emerald-600 shadow-sm ring-2 ring-emerald-200'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <PropertyImage src={url} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Two-Column Property Details */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column (2 Cols): Specs, Description, GIS Cadastral Map */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Metrics Dashboard Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="pb-3 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Price
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 block">
                  {formatPriceNPR(property.price_npr, lang)}
                </span>
                <span className="text-[11px] font-bold text-emerald-700">
                  {formatPricePerUnit(property.price_npr, property.area_value, property.area_unit, lang)}
                </span>
              </div>

              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Land Area
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 block">
                  {formatArea(property.area_value, property.area_unit, lang, { includeSqft: false })}
                </span>
                <span className="text-[11px] text-slate-500">
                  {sqft.toLocaleString()} sq ft • {sqm} m²
                </span>
              </div>

              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Road Access
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 block">
                  {property.road_access || 'Standard Access'}
                </span>
                <span className="text-[11px] text-slate-500">Vehicular Access</span>
              </div>

              <div className="pt-3 sm:pt-0 sm:pl-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Orientation
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 block">
                  {property.facing || 'East Facing'}
                </span>
                <span className="text-[11px] text-slate-500">All-day Sunlight</span>
              </div>
            </div>

            {/* Description Narrative */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? 'Property Overview & Features' : 'सम्पत्ति विवरण तथा विशेषताहरू'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                {property.description ||
                  'Direct owner listing. Verified cadastral plot with clear ownership boundaries. 100% zero brokerage through Sarvabhoomi peer-to-peer network.'}
              </p>
            </div>

            {/* Specifications Matrix */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'en' ? 'Technical Specifications' : 'प्राविधिक विवरण'}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Listing Type</span>
                  <span className="font-bold text-slate-900">{property.listing_type.replace('_', ' ')}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">District / Region</span>
                  <span className="font-bold text-slate-900">{property.district}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Kitta / Parcel ID</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {property.kitta_no || 'Verified on Inquiry'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Road Width</span>
                  <span className="font-bold text-slate-900">{property.road_access || '16 ft Pitched'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block mb-1">Facing</span>
                  <span className="font-bold text-slate-900">{property.facing || 'East'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-emerald-800 block mb-1 font-semibold">Ownership Verification</span>
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lalpurja Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Cadastral Survey & Location Reference */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'en' ? 'Cadastral Survey & Location Reference' : 'नापी कित्ता तथा लोकेसन विवरण'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {property.locality}, {property.district} • Kitta #{property.kitta_no || 'Plot reference provided upon inquiry'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  {property.kitta_no ? `Kitta #${property.kitta_no}` : 'Cadastral Plot'}
                </span>
              </div>

              {/* Cadastral & Location Display */}
              <div className="relative h-64 w-full rounded-xl bg-slate-900 overflow-hidden border border-slate-200 flex items-center justify-center p-6 text-center">
                {/* Topographic grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-70" />

                <div className="relative z-10 max-w-sm space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-500/30">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">
                      {property.locality}, {property.district}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
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
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center transition flex flex-col items-center justify-center group"
                >
                  <span className="text-slate-500 block text-[10px] group-hover:text-emerald-700">Banks & ATMs</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <span>Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `Hospitals near ${property.locality}, ${property.district}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center transition flex flex-col items-center justify-center group"
                >
                  <span className="text-slate-500 block text-[10px] group-hover:text-emerald-700">Healthcare</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <span>Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `Schools near ${property.locality}, ${property.district}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-center transition flex flex-col items-center justify-center group"
                >
                  <span className="text-slate-500 block text-[10px] group-hover:text-emerald-700">Schools</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <span>Nearby</span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                  </span>
                </a>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center">
                  <span className="text-slate-500 block text-[10px]">Road Width</span>
                  <span className="font-bold text-slate-900 mt-0.5">
                    {property.road_access || 'Standard Access'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Sticky Direct Owner Contact & Unlock Card */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            {/* Primary Landowner Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    स
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Direct Landowner</h3>
                    <span className="text-[11px] text-emerald-700 font-semibold">100% Zero Brokerage</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  P2P Direct
                </span>
              </div>

              {/* Contact Status */}
              {isUnlocked && ownerContact ? (
                /* UNLOCKED STATE */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Verified Owner Name
                    </span>
                    <span className="text-sm font-bold text-emerald-950 block">
                      {ownerContact.name}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Verified Mobile Phone
                    </span>
                    <span className="font-mono text-lg font-black text-slate-900 tracking-wider block">
                      {ownerContact.phone}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${ownerContact.phone}`}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Owner</span>
                    </a>

                    <a
                      href={`https://wa.me/${ownerContact.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* LOCKED STATE */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Owner Status:</span>
                      <span className="font-bold text-slate-900">Direct Landowner</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Phone Number:</span>
                      <span className="font-mono font-bold text-slate-700">+977 9841••••••</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsUnlockModalOpen(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>
                      {lang === 'en' ? 'Unlock Owner Contact (1 Credit)' : 'जग्गाधनी सम्पर्क खोल्नुहोस् (१ क्रेडिट)'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Balance: {user ? `${user.credits} Credits` : 'Sign in to check'}</span>
                    </span>
                    <span className="text-emerald-700 font-bold text-[11px]">Free Launch Offer</span>
                  </div>
                </div>
              )}

              {/* Zero Brokerage Value Callout */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Save 2% - 3% Middleman Broker Commission</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  On this property ({formatPriceNPR(property.price_npr)}), saving 2.5% broker fee saves you{' '}
                  <span className="font-bold text-emerald-800">
                    {formatPriceNPR(property.price_npr * 0.025)}
                  </span>
                  .
                </p>
              </div>
            </div>

            {/* Verification Guarantee Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sarvabhoomi Lalpurja Protocol</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                All land boundaries are cross-verified with official Cadastral map numbers (कित्ता नम्बर) to prevent double-listing and broker fraud.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Similar Verified Properties */}
        {/* ============================================================ */}
        {similarProperties.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {lang === 'en' ? 'Similar Verified Listings in this Area' : 'यस क्षेत्रका अन्य प्रमाणित सम्पत्तिहरू'}
              </h2>
              <p className="text-xs text-slate-500">
                Direct peer-to-peer real estate in {property.district}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((sim) => (
                <Link
                  key={sim.id}
                  href={`/properties/${sim.id}`}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                    <PropertyImage
                      src={
                        sim.photos && sim.photos[0]
                          ? sim.photos[0]
                          : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={sim.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="text-base font-extrabold text-slate-900">
                      {formatPriceNPR(sim.price_npr, lang)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-700">
                      {sim.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {sim.locality}, {sim.district} • {formatArea(sim.area_value, sim.area_unit, lang, { includeSqft: false })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Contact Unlock Modal */}
      <ContactUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        property={property}
        currentUser={user}
        onUnlockSuccess={handleUnlockSuccess}
        lang={lang}
      />

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white max-w-7xl w-full mx-auto">
            <div className="pr-4">
              <h3 className="font-bold text-sm sm:text-base text-white/90 truncate max-w-md">
                {property.title}
              </h3>
              <p className="text-xs text-white/60">
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

          {/* Main Image Viewer */}
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
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                  }
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition shadow-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {photos.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-4xl mx-auto">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    activePhotoIdx === idx
                      ? 'border-emerald-500 scale-105 ring-2 ring-emerald-400/50'
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

      {/* Institutional Light Footer */}
      <Footer lang={lang} />
    </div>
  );
}
