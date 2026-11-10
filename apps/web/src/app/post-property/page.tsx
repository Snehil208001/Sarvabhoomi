'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Upload,
  Home,
  AlertCircle,
  X,
  RefreshCw,
  Check,
  Maximize2,
  Eye,
  Camera,
  Sparkles,
  MapPin,
  Armchair,
  Users,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  AreaUnit,
  PropertyFacing,
  PropertySubtype,
  Furnishing,
  PreferredTenant,
  ALL_NEPAL_DISTRICTS,
  getRegionForDistrict,
  toSqFt,
  formatMonthlyRentNPR,
  formatDeposit,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { PropertyImage } from '@/components/PropertyImage';
import { Footer } from '@/components/Footer';

type WizardStep = 1 | 2 | 3 | 4;

const WIZARD_STEPS = [
  { num: 1, titleEn: 'Location & Basics', titleNe: 'स्थान र प्रकार' },
  { num: 2, titleEn: 'Rent & Specs', titleNe: 'भाडा र विवरण' },
  { num: 3, titleEn: 'Photos', titleNe: 'तस्बिरहरू' },
  { num: 4, titleEn: 'Lalpurja & Publish', titleNe: 'स्वामित्व र पेश' },
];

const KEY_DISTRICT_HUBS = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kaski', 'Chitwan', 'Rupandehi'];

export default function PostPropertyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authentication state
  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Active step (1-4)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: Location & Basics
  const [subtype, setSubtype] = useState<PropertySubtype>('FLAT');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [ward, setWard] = useState<string>('');
  const [locality, setLocality] = useState('');
  const [bedrooms, setBedrooms] = useState<string>('2');

  // Step 2: Rent & Specs
  const [monthlyRentNpr, setMonthlyRentNpr] = useState<string>('');
  const [depositNpr, setDepositNpr] = useState<string>('');
  const [maintenanceNpr, setMaintenanceNpr] = useState<string>('');
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);
  const [furnishing, setFurnishing] = useState<Furnishing>('SEMI');
  const [preferredTenant, setPreferredTenant] = useState<PreferredTenant>('FAMILY');
  const [availableFrom, setAvailableFrom] = useState('');
  const [bathrooms, setBathrooms] = useState<string>('1');
  const [floorNo, setFloorNo] = useState<string>('2');
  const [totalFloors, setTotalFloors] = useState<string>('4');
  const [hasParking, setHasParking] = useState(true);
  const [areaValue, setAreaValue] = useState<string>('650');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('SQFT');
  const [roadAccess, setRoadAccess] = useState('16 ft Pitched');
  const [facing, setFacing] = useState<PropertyFacing>('EAST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Photos (Drag & Drop + Cover Badge)
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Lalpurja Verification & Declaration
  const [kittaNo, setKittaNo] = useState('');
  const [verifyLater, setVerifyLater] = useState(false);
  const [hasLalpurja, setHasLalpurja] = useState(true);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [nonBrokerConfirmed, setNonBrokerConfirmed] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerDistrict, setOwnerDistrict] = useState('Kathmandu');

  // Inline Validation Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mobile Live Preview Drawer State
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Auth protection & role check
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/auth?mode=signup&next=/post-property');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role, full_name, preferred_district, profile_completed')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.user_role === 'RENTER') {
          router.replace('/dashboard?error=renter_cannot_post');
          return;
        }

        if (isMounted) {
          setUserId(user.id);
          if (profile?.full_name) setOwnerFullName(profile.full_name);
          if (profile?.preferred_district) setOwnerDistrict(profile.preferred_district);
          setLoadingUser(false);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        router.replace('/auth?mode=signup&next=/post-property');
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Photo processing for file input and drag-and-drop
  const processFiles = async (files: FileList | File[]) => {
    if (photos.length + files.length > 10) {
      setPhotoError('Maximum 10 property photos allowed.');
      return;
    }

    setUploadingPhotos(true);
    setPhotoError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPhotoError(`"${file.name}" is not a valid image file.`);
        continue;
      }

      // Validate size (< 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError(`"${file.name}" exceeds maximum allowed 5MB limit.`);
        continue;
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const folderName = userId || 'public';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folderName}/${fileName}`;

      let photoUrl: string | null = null;

      try {
        const { error: uploadErr } = await supabase.storage
          .from('property-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadErr) {
          const { data: publicData } = supabase.storage
            .from('property-photos')
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            photoUrl = publicData.publicUrl;
          }
        } else {
          console.warn(`Supabase storage notice: ${uploadErr.message}. Storing photo locally.`);
        }
      } catch (uploadException) {
        console.warn('Storage upload exception:', uploadException);
      }

      // Fallback to base64 Data URL so landlord is never blocked if storage bucket isn't provisioned
      if (!photoUrl) {
        try {
          const base64Url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          photoUrl = base64Url;
        } catch (readErr) {
          console.error('Failed to read file as data URL:', readErr);
        }
      }

      if (photoUrl) {
        uploadedUrls.push(photoUrl);
      }
    }

    setPhotos((prev) => [...prev, ...uploadedUrls]);
    setUploadingPhotos(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Field validation for each step
  const validateStep = (step: WizardStep): boolean => {
    const errors: Record<string, string> = {};
    setErrorMessage(null);

    if (step === 1) {
      if (!district) errors.district = lang === 'en' ? 'Please select a district.' : 'कृपया जिल्ला छनोट गर्नुहोस्।';
      if (!locality.trim()) {
        errors.locality = lang === 'en' ? 'Locality or area name is required.' : 'टोल वा क्षेत्रको नाम अनिवार्य छ।';
      }
    } else if (step === 2) {
      const rent = parseFloat(monthlyRentNpr);
      if (isNaN(rent) || rent <= 0) {
        errors.monthlyRentNpr = lang === 'en' ? 'Please enter a valid monthly rent in NPR.' : 'कृपया मान्य मासिक भाडा प्रविष्ट गर्नुहोस्।';
      }
      const area = parseFloat(areaValue);
      if (isNaN(area) || area <= 0) {
        errors.areaValue = lang === 'en' ? 'Please enter a valid area value.' : 'कृपया मान्य क्षेत्रफल प्रविष्ट गर्नुहोस्।';
      }
    } else if (step === 4) {
      if (!ownerFullName.trim() || ownerFullName.trim().length < 2) {
        errors.ownerFullName = lang === 'en' ? 'Full legal name is required.' : 'पूरा कानुनी नाम अनिवार्य छ।';
      }
      if (!ownershipConfirmed) {
        errors.ownershipConfirmed = lang === 'en' ? 'You must confirm lawful ownership.' : 'स्वामित्व पुष्टि गर्नुपर्छ।';
      }
      if (!nonBrokerConfirmed) {
        errors.nonBrokerConfirmed = lang === 'en' ? 'You must certify zero brokerage.' : 'शून्य दलाली प्रमाणित गर्नुपर्छ।';
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Auto-scroll to first error element
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as WizardStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-generated or custom listing title
  const previewTitle =
    title.trim() ||
    `${subtype === 'FLAT' ? `${bedrooms} BHK Flat` : subtype === 'ROOM' ? 'Single Room' : subtype === 'HOUSE' ? 'Independent House' : 'Commercial Shop'} in ${locality || 'Kathmandu'}, ${district}`;

  // Publish Listing
  const handlePublish = async (status: 'PENDING_REVIEW' | 'DRAFT' = 'PENDING_REVIEW') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      return;
    }

    if (!userId) {
      setErrorMessage('User session missing. Please sign in again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const numRent = parseFloat(monthlyRentNpr) || 15000;
    const numDeposit = depositNpr ? parseFloat(depositNpr) : null;
    const numMaint = maintenanceNpr ? parseFloat(maintenanceNpr) : null;
    const numArea = parseFloat(areaValue) || 650;
    const sqft = areaUnit === 'SQFT' ? numArea : toSqFt(numArea, areaUnit);

    const propertyPayload = {
      owner_id: userId,
      title: previewTitle,
      description:
        description.trim() ||
        `Direct landlord listing for rent in ${locality}, ${district}. 100% Zero brokerage peer-to-peer verified on Sarvabhoomi.`,
      listing_type: 'RENT_HOUSE' as const,
      price_npr: numRent,
      monthly_rent_npr: numRent,
      deposit_npr: numDeposit,
      maintenance_npr: numMaint,
      maintenance_included: maintenanceIncluded,
      furnishing,
      property_subtype: subtype,
      preferred_tenant: preferredTenant,
      available_from: availableFrom || null,
      floor_no: floorNo ? parseInt(floorNo, 10) : null,
      total_floors: totalFloors ? parseInt(totalFloors, 10) : null,
      parking: hasParking,
      district,
      municipality: municipality.trim() || null,
      ward: ward ? parseInt(ward, 10) : null,
      locality: locality.trim(),
      area_value: numArea,
      area_unit: areaUnit,
      area_sqft: sqft,
      road_access: roadAccess.trim() || '16 ft Pitched Road',
      facing,
      bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
      bathrooms: bathrooms ? parseInt(bathrooms, 10) : null,
      owner_declared_lalpurja: !verifyLater && hasLalpurja,
      admin_verified: false,
      lalpurja_verified: false,
      kitta_no: !verifyLater && kittaNo.trim() ? kittaNo.trim() : null,
      photos,
      status,
      views_count: 0,
      updated_at: new Date().toISOString(),
    };

    try {
      // Save profile identity
      const derivedRegion = getRegionForDistrict(ownerDistrict);
      await supabase
        .from('profiles')
        .update({
          full_name: ownerFullName.trim(),
          preferred_district: ownerDistrict,
          preferred_region: derivedRegion,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      const { error } = await supabase
        .from('properties')
        .insert(propertyPayload)
        .select('id')
        .single();

      if (error) {
        console.warn('Publish insert error:', error.message);
        setErrorMessage(error.message || 'Error publishing listing. Please check database permissions.');
        return;
      }

      router.push('/dashboard?posted=success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish listing.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-gold/40 animate-pulse shadow-card">
          <Image
            src="/logo/logo-mark.png"
            alt="Sarvabhoomi"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-gold/30 shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-white/70 hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gold" />
            <span>{lang === 'en' ? 'Back to Dashboard' : 'ड्यासबोर्ड'}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-gold/40 shadow-xs">
              <Image
                src="/logo/logo-mark.png"
                alt="Sarvabhoomi"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-black text-white text-sm tracking-tight hidden sm:inline">
              {lang === 'en' ? 'Post Property Free' : 'नयाँ भाडा विज्ञापन'}
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-gold/20 text-gold border border-gold/30 uppercase tracking-wider">
              0% Brokerage
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobilePreviewOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gold/40 bg-white/5 text-gold text-xs font-bold"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Preview' : 'पूर्वावलोकन'}</span>
            </button>

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
              className="text-xs font-bold text-white/70 hover:text-gold px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-colors"
            >
              {lang === 'en' ? 'नेपाली' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Wizard & Live Preview Layout */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1">
        {/* Step Progress Tracker & Estimated Time Badge */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? '⚡ Takes under 2 minutes • 100% Free to Post'
                  : '⚡ २ मिनेटमै पूरा हुने • १००% निःशुल्क'}
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-white/60">
              {lang === 'en' ? `Step ${currentStep} of 4` : `चरण ${currentStep} / ४`}
            </span>
          </div>

          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />
            <div
              className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-gold transition-all duration-500 -z-0"
              style={{
                width: `${((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100}%`,
              }}
            />

            {WIZARD_STEPS.map((s) => {
              const isActive = s.num === currentStep;
              const isDone = s.num < currentStep;

              return (
                <div key={s.num} className="flex flex-col items-center gap-1.5 relative z-10">
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone) setCurrentStep(s.num as WizardStep);
                    }}
                    disabled={!isDone && !isActive}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isActive
                        ? 'bg-gold text-black ring-4 ring-gold/20 shadow-card scale-110'
                        : isDone
                        ? 'bg-gold/20 text-gold border border-gold/40 cursor-pointer'
                        : 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </button>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold hidden sm:block ${
                      isActive ? 'text-gold font-black' : isDone ? 'text-white/80' : 'text-white/40'
                    }`}
                  >
                    {lang === 'en' ? s.titleEn : s.titleNe}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-Column Grid: Form (Col 7) + Live Preview (Col 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Multi-Step Wizard Form Card */}
          <div className="lg:col-span-7 bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-8 shadow-card space-y-6 backdrop-blur-md">
            {/* Global Error Notice */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-gold/40 text-xs text-gold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-gold" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Location & Basics */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gold tracking-tight">
                    {lang === 'en' ? 'Step 1: Location & Property Basics' : 'चरण १: सम्पत्ति प्रकार र ठेगाना'}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 font-medium">
                    {lang === 'en'
                      ? 'Tell tenants where your property is located and what subtype you are renting.'
                      : 'भाडामा दिन लाग्नुभएको घर वा कोठाको प्रकार र स्थान खुलाउनुहोस्।'}
                  </p>
                </div>

                {/* Subtype Pill Selector */}
                <div>
                  <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                    {lang === 'en' ? 'Property Subtype *' : 'सम्पत्ति प्रकार *'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'FLAT' as const, labelEn: 'Flat / Apt', labelNe: 'फ्ल्याट', desc: 'Private unit' },
                        { id: 'ROOM' as const, labelEn: 'Single Room', labelNe: 'एकल कोठा', desc: '1 Room' },
                        { id: 'HOUSE' as const, labelEn: 'Full House', labelNe: 'घर', desc: 'Independent' },
                        { id: 'SHOP' as const, labelEn: 'Shop / Shutter', labelNe: 'पसल / सटर', desc: 'Commercial' },
                      ]
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSubtype(item.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          subtype === item.id
                            ? 'bg-gold text-black border-gold shadow-subtle font-black'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-black">{lang === 'en' ? item.labelEn : item.labelNe}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* BHK Selector for Flats & Houses */}
                {(subtype === 'FLAT' || subtype === 'HOUSE') && (
                  <div>
                    <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                      {lang === 'en' ? 'Bedrooms (BHK)' : 'कोठा संख्या (BHK)'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['1', '2', '3', '4'].map((bhk) => (
                        <button
                          key={bhk}
                          type="button"
                          onClick={() => setBedrooms(bhk)}
                          className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                            bedrooms === bhk
                              ? 'bg-gold text-black border-gold shadow-subtle'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {bhk} BHK
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* District Quick Hubs & Dropdown */}
                <div id="field-district">
                  <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    {lang === 'en' ? 'District *' : 'जिल्ला *'}
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {KEY_DISTRICT_HUBS.map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setDistrict(hub)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          district === hub
                            ? 'bg-gold text-black font-black'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-gold"
                  >
                    {ALL_NEPAL_DISTRICTS.map((d) => (
                      <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                        {lang === 'ne' ? d.nameNe : d.nameEn}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.district && (
                    <p className="text-gold text-xs font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.district}</span>
                    </p>
                  )}
                </div>

                {/* Locality & Ward Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2" id="field-locality">
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Locality / Area Landmark *' : 'टोल वा मुख्य चिनारी *'}
                    </label>
                    <input
                      type="text"
                      value={locality}
                      onChange={(e) => {
                        setLocality(e.target.value);
                        if (fieldErrors.locality) setFieldErrors((prev) => ({ ...prev, locality: '' }));
                      }}
                      placeholder={lang === 'en' ? 'e.g. Baluwatar, Pulchowk, Lakeside' : 'उदा. बालुवाटार, पुल्चोक, लेकसाइड'}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                    {fieldErrors.locality && (
                      <p className="text-gold text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{fieldErrors.locality}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Ward No.' : 'वडा नं.'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="35"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Municipality / Tole (Optional) */}
                <div>
                  <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    {lang === 'en' ? 'Municipality / Metro (Optional)' : 'नगरपालिका वा महानगरपालिका'}
                  </label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. Kathmandu Metropolitan City' : 'उदा. काठमाडौं महानगरपालिका'}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: Rent & Specs */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gold tracking-tight">
                    {lang === 'en' ? 'Step 2: Monthly Rent & Rental Specs' : 'चरण २: मासिक भाडा तथा सुविधा'}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 font-medium">
                    {lang === 'en'
                      ? 'Set transparent pricing with zero middleman fees. Tenants love clear deposit and maintenance rules.'
                      : 'स्पष्ट र पारदर्शी मूल्य निर्धारण गर्नुहोस्।'}
                  </p>
                </div>

                {/* Monthly Rent Input */}
                <div id="field-monthlyRentNpr">
                  <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                    {lang === 'en' ? 'Monthly Rent (NPR) *' : 'मासिक भाडा दर (रु.) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-black text-sm">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={monthlyRentNpr}
                      onChange={(e) => {
                        setMonthlyRentNpr(e.target.value);
                        if (fieldErrors.monthlyRentNpr) setFieldErrors((prev) => ({ ...prev, monthlyRentNpr: '' }));
                      }}
                      placeholder="e.g. 18500"
                      className="w-full bg-black/60 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-lg font-black text-gold focus:outline-none focus:border-gold"
                    />
                  </div>
                  {fieldErrors.monthlyRentNpr && (
                    <p className="text-gold text-xs font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.monthlyRentNpr}</span>
                    </p>
                  )}
                </div>

                {/* Security Deposit & Maintenance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Security Deposit (NPR)' : 'सुरक्षा धरौटी रकम (रु.)'}
                    </label>
                    <input
                      type="number"
                      value={depositNpr}
                      onChange={(e) => setDepositNpr(e.target.value)}
                      placeholder={monthlyRentNpr ? `e.g. ${monthlyRentNpr} (1 Month)` : 'e.g. 20000'}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Monthly Maintenance (NPR)' : 'मासिक मर्मत शुल्क (रु.)'}
                    </label>
                    <input
                      type="number"
                      disabled={maintenanceIncluded}
                      value={maintenanceNpr}
                      onChange={(e) => setMaintenanceNpr(e.target.value)}
                      placeholder={maintenanceIncluded ? 'Included in Rent' : 'e.g. 1500'}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold disabled:opacity-40"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-white/80">
                      <input
                        type="checkbox"
                        checked={maintenanceIncluded}
                        onChange={(e) => {
                          setMaintenanceIncluded(e.target.checked);
                          if (e.target.checked) setMaintenanceNpr('');
                        }}
                        className="rounded accent-gold w-3.5 h-3.5"
                      />
                      <span>{lang === 'en' ? 'Maintenance included in rent' : 'मर्मत शुल्क भाडामै समावेश'}</span>
                    </label>
                  </div>
                </div>

                {/* Area Input & Measurement Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="field-areaValue">
                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Built-up Area *' : 'क्षेत्रफल *'}
                    </label>
                    <input
                      type="number"
                      value={areaValue}
                      onChange={(e) => {
                        setAreaValue(e.target.value);
                        if (fieldErrors.areaValue) setFieldErrors((prev) => ({ ...prev, areaValue: '' }));
                      }}
                      placeholder="e.g. 650"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                    {fieldErrors.areaValue && (
                      <p className="text-gold text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{fieldErrors.areaValue}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Area Unit' : 'एकाइ'}
                    </label>
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-gold"
                    >
                      <option value="SQFT" className="bg-black text-white">Square Feet (वर्ग फिट)</option>
                      <option value="AANA" className="bg-black text-white">Aana (आना)</option>
                      <option value="ROPANI" className="bg-black text-white">Ropani (रोपनी)</option>
                      <option value="KATTHA" className="bg-black text-white">Kattha (कट्ठा)</option>
                      <option value="BIGHA" className="bg-black text-white">Bigha (बिघा)</option>
                    </select>
                  </div>
                </div>

                {/* Furnishing Status */}
                <div>
                  <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                    {lang === 'en' ? 'Furnishing Status' : 'फर्निसिङ'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'FULLY' as const, label: lang === 'en' ? 'Fully Furnished' : 'पूर्ण फर्निसिङ' },
                      { id: 'SEMI' as const, label: lang === 'en' ? 'Semi-Furnished' : 'आंशिक' },
                      { id: 'UNFURNISHED' as const, label: lang === 'en' ? 'Unfurnished' : 'बिना फर्निसिङ' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFurnishing(item.id)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          furnishing === item.id
                            ? 'bg-gold text-black border-gold shadow-subtle font-black'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Tenant */}
                <div>
                  <label className="block text-xs font-black text-white/90 mb-2 uppercase tracking-wider">
                    {lang === 'en' ? 'Preferred Tenant' : 'प्राथमिकता'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'FAMILY' as const, label: lang === 'en' ? 'Family' : 'परिवार' },
                      { id: 'BACHELOR' as const, label: lang === 'en' ? 'Bachelors / Students' : 'विद्यार्थी/पेसाकर्मी' },
                      { id: 'COMPANY' as const, label: lang === 'en' ? 'Corporate / Office' : 'कम्पनी/कार्यालय' },
                      { id: 'ANY' as const, label: lang === 'en' ? 'Any Tenant' : 'जोसुकै' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPreferredTenant(item.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                          preferredTenant === item.id
                            ? 'bg-gold text-black border-gold shadow-subtle font-black'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parking, Floor, Availability */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Dedicated Parking' : 'पार्किङ सुविधा'}
                    </label>
                    <select
                      value={hasParking ? 'true' : 'false'}
                      onChange={(e) => setHasParking(e.target.value === 'true')}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-3 text-xs font-bold text-white focus:outline-none focus:border-gold"
                    >
                      <option value="true" className="bg-black text-white">Yes, Parking Available</option>
                      <option value="false" className="bg-black text-white">No Dedicated Parking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Floor No.' : 'तल्ला'}
                    </label>
                    <input
                      type="number"
                      value={floorNo}
                      onChange={(e) => setFloorNo(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Available From' : 'उपलब्ध मिति'}
                    </label>
                    <input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Photos (Drag & Drop + Cover Badge) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gold tracking-tight">
                    {lang === 'en' ? 'Step 3: Property Photos' : 'चरण ३: तस्बिरहरू अपलोड गर्नुहोस्'}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 font-medium">
                    {lang === 'en'
                      ? 'Listings with authentic photos receive 4x more direct unlock requests. The first photo is your main cover photo.'
                      : 'तस्बिर भएका विज्ञापनमा ४ गुणा बढी सिधा सम्पर्क अनुरोध आउँछ। पहिलो तस्बिर मुख्य कभर फोटो हुनेछ।'}
                  </p>
                </div>

                {photoError && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-gold/40 text-xs text-gold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-gold" />
                    <span>{photoError}</span>
                  </div>
                )}

                {/* Drag & Drop Target Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-gold bg-gold/15 scale-102'
                      : 'border-gold/40 bg-white/[0.03] hover:bg-white/[0.06] hover:border-gold'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                  />

                  <div className="w-14 h-14 rounded-2xl bg-gold text-black flex items-center justify-center mx-auto mb-3 shadow-subtle">
                    {uploadingPhotos ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6 stroke-[2.5]" />
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-white">
                    {uploadingPhotos
                      ? lang === 'en'
                        ? 'Uploading & Processing Photos...'
                        : 'तस्बिर प्रशोधन हुँदैछ...'
                      : lang === 'en'
                      ? 'Drag & drop photos here, or click to browse'
                      : 'तस्बिरहरू यहाँ तानेर ल्याउनुहोस् वा क्लिक गरी छनोट गर्नुहोस्'}
                  </h3>

                  <p className="text-xs text-white/60 mt-1">
                    {lang === 'en'
                      ? 'Supports JPG, PNG, WEBP up to 5MB each (Max 10 photos)'
                      : 'JPG, PNG, WEBP (५ एमबी सम्म, बढीमा १० तस्बिर)'}
                  </p>
                </div>

                {/* Uploaded Thumbnails Grid with Main Cover Photo Badge */}
                {photos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white/70">
                      <span>{photos.length} of 10 photos uploaded</span>
                      <span className="text-gold font-semibold">
                        {lang === 'en' ? 'First photo is your cover badge' : 'पहिलो तस्बिर मुख्य कभर'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {photos.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 bg-black group shadow-card"
                        >
                          <PropertyImage src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />

                          {/* Main Cover Photo Badge on First Image */}
                          {idx === 0 && (
                            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-gold text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-subtle">
                              <Sparkles className="w-3 h-3 text-black" />
                              <span>Main Cover</span>
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 text-white hover:bg-gold hover:text-black flex items-center justify-center transition-all z-10 shadow-subtle"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Lalpurja Verification & Declaration */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-gold tracking-tight">
                    {lang === 'en' ? 'Step 4: Lalpurja & Ownership Declaration' : 'चरण ४: स्वामित्व प्रमाणीकरण र पेश'}
                  </h2>
                  <p className="text-xs text-white/70 mt-1 font-medium">
                    {lang === 'en'
                      ? 'Sarvabhoomi protects tenants and landlords with government cadastral verification.'
                      : 'नक्कली विज्ञापन रोक्न स्वामित्व प्रमाणीकरण गर्नुहोस्।'}
                  </p>
                </div>

                {/* Privacy Reassurance Banner */}
                <div className="p-4 rounded-2xl bg-gold/10 border border-gold/40 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gold uppercase tracking-wider">
                      {lang === 'en' ? 'Cadastral Privacy & Security Guarantee' : 'सरकारी नापी गोपनीयता र सुरक्षा'}
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed font-medium">
                      {lang === 'en'
                        ? '🔒 Used strictly for ownership verification to award the Gold Verified badge. Never shared publicly.'
                        : '🔒 यो विवरण केवल स्वामित्व प्रमाणीकरण र "गोल्ड भेरिफाइड" ब्याज प्रदान गर्न प्रयोग गरिन्छ। सार्वजनिक रूपमा कहिल्यै देखाइने छैन।'}
                    </p>
                  </div>
                </div>

                {/* Verification Mode: Instant Gold vs Fast-Track / Later */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      {lang === 'en' ? 'Verification Preference' : 'प्रमाणीकरण विकल्प'}
                    </span>
                    <span className="text-[10px] font-black text-gold bg-gold/15 border border-gold/30 px-2.5 py-0.5 rounded-full uppercase">
                      {verifyLater ? 'Fast-Track (Verify Later)' : 'Instant Gold Cadastral'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setVerifyLater(false)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        !verifyLater
                          ? 'bg-gold text-black border-gold shadow-subtle font-black'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-xs">
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>{lang === 'en' ? 'Verify Now (Gold Badge)' : 'अहिले प्रमाणित गर्ने'}</span>
                      </div>
                      <p className="text-[10px] opacity-80 font-normal">
                        {lang === 'en'
                          ? 'Enter Kitta # for official cadastral badge and top ranking'
                          : 'कित्ता नम्बर प्रविष्ट गरी पहिलो प्राथमिकता पाउनुहोस्'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerifyLater(true)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        verifyLater
                          ? 'bg-gold text-black border-gold shadow-subtle font-black'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-xs">
                        <Clock className="w-4 h-4 stroke-[2.5]" />
                        <span>{lang === 'en' ? 'Fast-Track / Verify Later' : 'पछि प्रमाणित गर्ने'}</span>
                      </div>
                      <p className="text-[10px] opacity-80 font-normal">
                        {lang === 'en'
                          ? 'Publish immediately, submit Lalpurja from dashboard later'
                          : 'तुरुन्त पोस्ट गर्नुहोस्, पछि ड्यासबोर्डबाट लालपुर्जा थप्नुहोस्'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Kitta Number input if not verifying later */}
                {!verifyLater && (
                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Official Cadastral Kitta / Parcel Number' : 'सरकारी नापी कित्ता नम्बर'}
                    </label>
                    <input
                      type="text"
                      value={kittaNo}
                      onChange={(e) => setKittaNo(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. 412 or 1058' : 'उदा. ४१२ वा १०५८'}
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold font-mono"
                    />
                  </div>
                )}

                {/* Landlord Identity (Full Name & District) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="field-ownerFullName">
                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Owner Full Legal Name *' : 'घरधनीको पूरा कानुनी नाम *'}
                    </label>
                    <input
                      type="text"
                      value={ownerFullName}
                      onChange={(e) => {
                        setOwnerFullName(e.target.value);
                        if (fieldErrors.ownerFullName) setFieldErrors((prev) => ({ ...prev, ownerFullName: '' }));
                      }}
                      placeholder="e.g. Ram Bahadur Shrestha"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                    {fieldErrors.ownerFullName && (
                      <p className="text-gold text-xs font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{fieldErrors.ownerFullName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-white/90 mb-1.5 uppercase tracking-wider">
                      {lang === 'en' ? 'Owner Home District' : 'घरधनीको जिल्ला'}
                    </label>
                    <input
                      type="text"
                      value={ownerDistrict}
                      onChange={(e) => setOwnerDistrict(e.target.value)}
                      placeholder="e.g. Kathmandu"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Mandatory Certifications */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ownershipConfirmed}
                      onChange={(e) => {
                        setOwnershipConfirmed(e.target.checked);
                        if (fieldErrors.ownershipConfirmed) setFieldErrors((prev) => ({ ...prev, ownershipConfirmed: '' }));
                      }}
                      className="mt-0.5 rounded accent-gold w-4 h-4 shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">
                        {lang === 'en'
                          ? 'I certify that I am the lawful owner or authorized representative'
                          : 'म प्रमाणित गर्दछु कि म यस सम्पत्तिको वास्तविक घरधनी वा अधिकार प्राप्त प्रतिनिधि हुँ'}
                      </span>
                      <span className="text-[11px] text-white/60">
                        {lang === 'en' ? 'Fraudulent postings violate Nepal Property Law.' : 'गलत दाबी कानुन विपरित छ।'}
                      </span>
                    </div>
                  </label>
                  {fieldErrors.ownershipConfirmed && (
                    <p className="text-gold text-xs font-bold px-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.ownershipConfirmed}</span>
                    </p>
                  )}

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nonBrokerConfirmed}
                      onChange={(e) => {
                        setNonBrokerConfirmed(e.target.checked);
                        if (fieldErrors.nonBrokerConfirmed) setFieldErrors((prev) => ({ ...prev, nonBrokerConfirmed: '' }));
                      }}
                      className="mt-0.5 rounded accent-gold w-4 h-4 shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">
                        {lang === 'en'
                          ? 'I agree to the 0% Brokerage Policy (I will not charge commission to tenants)'
                          : 'म ०% दलाली नीतिमा सहमत छु (म भाडावालसँग कुनै दलाली शुल्क लिने छैन)'}
                      </span>
                      <span className="text-[11px] text-white/60">
                        {lang === 'en' ? 'Sarvabhoomi is strictly a direct peer-to-peer marketplace.' : 'सर्वभूमि प्रत्यक्ष भाडा बजार हो।'}
                      </span>
                    </div>
                  </label>
                  {fieldErrors.nonBrokerConfirmed && (
                    <p className="text-gold text-xs font-bold px-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{fieldErrors.nonBrokerConfirmed}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation & Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'पछाडि'}</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-subtle active:scale-97 transition-all"
                >
                  <span>{lang === 'en' ? 'Continue' : 'अगाडि बढ्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePublish('DRAFT')}
                    className="px-4 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {lang === 'en' ? 'Save Draft' : 'ड्राफ्ट सुरक्षित'}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handlePublish('PENDING_REVIEW')}
                    className="px-6 py-3 rounded-xl bg-gold hover:bg-gold/90 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-subtle active:scale-97 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{lang === 'en' ? 'Publishing...' : 'पेश हुँदैछ...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 stroke-[2.5]" />
                        <span>{lang === 'en' ? 'Publish Rental Listing Free' : 'विज्ञापन निःशुल्क पेश गर्नुहोस्'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Tenant Preview Card (Sticky Desktop) */}
          <div className="hidden lg:block lg:col-span-5 space-y-3 sticky top-24 self-start">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {lang === 'en' ? 'Live Tenant Preview' : 'प्रत्यक्ष पूर्वावलोकन'}
                </span>
              </div>
              <span className="text-[10px] text-white/50 font-mono">
                Updates in real-time
              </span>
            </div>

            {/* Live Property Card Mockup */}
            <div className="bg-white/[0.06] rounded-2xl border border-gold/40 overflow-hidden shadow-card backdrop-blur-md">
              {/* Image banner */}
              <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
                <PropertyImage
                  src={photos[0] || null}
                  alt={previewTitle}
                  fill
                  className="object-cover"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                  {!verifyLater && (
                    <span className="px-2.5 py-1 rounded-md bg-gold text-black text-[10px] font-black uppercase tracking-wide flex items-center gap-1 shadow-subtle">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Gold Verified</span>
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-md bg-black/80 text-gold border border-gold/40 text-[10px] font-black uppercase tracking-wide">
                    Direct Owner • 0% Fee
                  </span>
                </div>

                {/* Subtype Pill */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded bg-black/85 text-gold border border-gold/30 text-[10px] font-bold tracking-wider uppercase">
                    {subtype}
                  </span>
                  {photos.length > 1 && (
                    <span className="px-2 py-0.5 rounded bg-black/85 text-white/80 border border-white/20 text-[10px] font-medium flex items-center gap-1">
                      <Camera className="w-3 h-3 text-gold" />
                      <span>{photos.length}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-3">
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <h4 className="text-xl font-black text-gold tracking-tight">
                        {formatMonthlyRentNPR(parseFloat(monthlyRentNpr) || 15000, lang)}
                      </h4>
                      <span className="text-xs text-white/60 font-semibold">/ mo</span>
                    </div>
                    {depositNpr && (
                      <span className="text-[11px] font-bold text-white/70">
                        Deposit: {formatDeposit(parseFloat(depositNpr), lang)}
                      </span>
                    )}
                  </div>

                  {/* Savings Micro-Badge */}
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md w-fit">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Save NPR {Number(parseFloat(monthlyRentNpr) || 15000).toLocaleString('en-IN')} brokerage</span>
                  </div>

                  <h5 className="text-sm font-bold text-white line-clamp-1 mt-2">
                    {previewTitle}
                  </h5>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="truncate">
                    {locality ? `${locality}${ward ? `, Ward ${ward}` : ''}, ` : ''}{district}
                  </span>
                </div>

                {/* Specs row */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-1 text-white truncate">
                    <Maximize2 className="w-3.5 h-3.5 text-gold/80 shrink-0" />
                    <span className="truncate">{bedrooms ? `${bedrooms} BHK` : `${areaValue} sq.ft`}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white truncate">
                    <Armchair className="w-3.5 h-3.5 text-gold/80 shrink-0" />
                    <span className="truncate">{furnishing}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white truncate">
                    <Users className="w-3.5 h-3.5 text-gold/80 shrink-0" />
                    <span className="truncate">{preferredTenant}</span>
                  </div>
                </div>
              </div>

              {/* Action mockup */}
              <div className="p-4 pt-0 border-t border-white/10 flex items-center justify-between gap-3 mt-1">
                <span className="text-xs font-bold text-white/70">View Details</span>
                <span className="px-3.5 py-2 rounded-xl bg-gold text-black font-black text-xs">
                  Unlock Owner Contact
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Live Preview Modal (< lg) */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/[0.06] rounded-3xl border border-gold/40 shadow-card max-w-sm w-full overflow-hidden text-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-black text-gold uppercase tracking-wider">
                {lang === 'en' ? 'Live Tenant Preview' : 'प्रत्यक्ष पूर्वावलोकन'}
              </span>
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              <PropertyImage src={photos[0] || null} alt={previewTitle} fill className="object-cover" />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-gold text-black text-[10px] font-black uppercase">
                {!verifyLater ? 'Gold Verified' : 'Direct Owner'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h4 className="text-lg font-black text-gold">
                  {formatMonthlyRentNPR(parseFloat(monthlyRentNpr) || 15000, lang)}
                </h4>
                <span className="text-xs text-white/60">/ month</span>
              </div>
              <h5 className="text-sm font-bold text-white line-clamp-1">{previewTitle}</h5>
              <p className="text-xs text-white/70">
                {locality ? `${locality}, ` : ''}{district}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMobilePreviewOpen(false)}
              className="w-full py-3 rounded-xl bg-gold text-black font-black text-xs uppercase"
            >
              {lang === 'en' ? 'Close Preview' : 'पूर्वावलोकन बन्द गर्नुहोस्'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer lang={lang} />
    </div>
  );
}
