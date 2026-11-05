'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Upload,
  MapPin,
  Home,
  Building,
  Tag,
  Coins,
  AlertCircle,
  X,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  ListingType,
  AreaUnit,
  PropertyFacing,
  HILLY_DISTRICTS,
  TERAI_DISTRICTS,
  getRegionForDistrict,
  toSqFt,
  formatPriceNPR,
  formatArea,
  getAuthDict,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { PropertyImage } from '@/components/PropertyImage';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { num: 1, titleEn: 'Type & Location', titleNe: 'प्रकार र स्थान' },
  { num: 2, titleEn: 'Area & Specs', titleNe: 'क्षेत्रफल र विवरण' },
  { num: 3, titleEn: 'Photos', titleNe: 'तस्बिरहरू' },
  { num: 4, titleEn: 'Price & Lalpurja', titleNe: 'मूल्य र लालपुर्जा' },
  { num: 5, titleEn: 'Review & Publish', titleNe: 'समीक्षा र प्रकाशन' },
];

export default function PostPropertyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authentication state
  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Active step
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: Type & Location
  const [listingType, setListingType] = useState<ListingType>('BUY_LAND');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [ward, setWard] = useState<string>('');
  const [locality, setLocality] = useState('');

  // Step 2: Area & Specs
  const [areaValue, setAreaValue] = useState<string>('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('AANA');
  const [roadAccess, setRoadAccess] = useState('');
  const [facing, setFacing] = useState<PropertyFacing>('EAST');
  const [bedrooms, setBedrooms] = useState<string>('3');
  const [bathrooms, setBathrooms] = useState<string>('2');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Price & Lalpurja Verification
  const [priceNpr, setPriceNpr] = useState<string>('');
  const [kittaNo, setKittaNo] = useState('');
  const [hasLalpurja, setHasLalpurja] = useState(true);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-set default area unit based on District (Hilly = AANA, Terai = KATTHA)
  useEffect(() => {
    const region = getRegionForDistrict(district);
    if (region === 'TERAI') {
      if (areaUnit === 'AANA' || areaUnit === 'ROPANI') {
        setAreaUnit('KATTHA');
      }
    } else {
      if (areaUnit === 'KATTHA' || areaUnit === 'BIGHA') {
        setAreaUnit('AANA');
      }
    }
  }, [district]);

  // Auth protection check
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace('/auth');
          return;
        }

        if (isMounted) {
          setUserId(user.id);
          setLoadingUser(false);
        }
      } catch {
        router.replace('/auth');
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Handle Photo Upload to Supabase Storage
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!userId) {
      setPhotoError('You must be signed in to upload listing photos.');
      return;
    }

    if (photos.length + files.length > 10) {
      setPhotoError('You can upload a maximum of 10 photos per listing.');
      return;
    }

    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    // Validate MIME types and file sizes before attempting upload
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setPhotoError(`Invalid file format for "${file.name}". Only JPEG, PNG, and WebP images are permitted.`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setPhotoError(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }
    }

    setUploadingPhotos(true);
    setPhotoError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${Date.now()}-${cleanFileName}`;

      try {
        const { data, error } = await supabase.storage
          .from('property-photos')
          .upload(filePath, file, { 
            cacheControl: '3600', 
            upsert: false,
            contentType: file.type,
          });

        if (error) {
          console.warn('Storage upload error:', error.message);
          setPhotoError(`Upload failed for "${file.name}": ${error.message}`);
        } else if (data) {
          const { data: pubUrl } = supabase.storage
            .from('property-photos')
            .getPublicUrl(filePath);
          uploadedUrls.push(pubUrl.publicUrl);
        }
      } catch (uploadErr) {
        console.error('Upload exception:', uploadErr);
        setPhotoError(`Unexpected error uploading "${file.name}".`);
      }
    }

    if (uploadedUrls.length > 0) {
      setPhotos((prev) => [...prev, ...uploadedUrls]);
    }
    setUploadingPhotos(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!locality.trim()) {
        setErrorMessage('Please enter the locality or landmark.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const numArea = parseFloat(areaValue);
      if (!areaValue || isNaN(numArea) || numArea <= 0) {
        setErrorMessage('Please enter a valid property area greater than 0.');
        return;
      }
      if (!title.trim()) {
        // Auto-generate title if empty
        const autoTitle = `${formatArea(numArea, areaUnit, lang, { includeSqft: false })} ${listingType.replace('_', ' ')} in ${locality}, ${district}`;
        setTitle(autoTitle);
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      // Photos are optional but encouraged
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const numPrice = parseFloat(priceNpr);
      if (!priceNpr || isNaN(numPrice) || numPrice <= 0) {
        setErrorMessage('Please enter a valid property price in NPR.');
        return;
      }
      if (!ownershipConfirmed) {
        setErrorMessage('You must confirm property ownership or authority to list.');
        return;
      }
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // Final Publish Handler
  const handlePublish = async (status: 'ACTIVE' | 'DRAFT' = 'ACTIVE') => {
    if (!userId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const numArea = parseFloat(areaValue) || 1;
    const numPrice = parseFloat(priceNpr) || 1000000;
    const sqft = toSqFt(numArea, areaUnit);

    const defaultTitle =
      title.trim() ||
      `${formatArea(numArea, areaUnit, lang, { includeSqft: false })} ${listingType.replace('_', ' ')} in ${locality}, ${district}`;

    const defaultPhotos =
      photos.length > 0
        ? photos
        : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'];

    const propertyPayload = {
      owner_id: userId,
      title: defaultTitle,
      description: description.trim() || 'Direct owner listing verified on Sarvabhoomi 0% brokerage network.',
      listing_type: listingType,
      price_npr: numPrice,
      district,
      municipality: municipality.trim() || null,
      ward: ward ? parseInt(ward, 10) : null,
      locality: locality.trim(),
      area_value: numArea,
      area_unit: areaUnit,
      area_sqft: sqft,
      road_access: roadAccess.trim() || '16 ft Pitched Road',
      facing,
      bedrooms: listingType === 'BUY_HOUSE' || listingType === 'RENT_HOUSE' ? parseInt(bedrooms, 10) : null,
      bathrooms: listingType === 'BUY_HOUSE' || listingType === 'RENT_HOUSE' ? parseInt(bathrooms, 10) : null,
      owner_declared_lalpurja: hasLalpurja,
      admin_verified: false,
      lalpurja_verified: false,
      kitta_no: kittaNo.trim() || null,
      photos: defaultPhotos,
      status,
      views_count: 0,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(propertyPayload)
        .select('id')
        .single();

      if (error) {
        console.warn('Publish insert error:', error.message);
        setErrorMessage(error.message || 'Error publishing property. Please ensure database tables are created.');
        return;
      }

      if (data?.id) {
        if (status === 'ACTIVE') {
          router.push(`/properties/${data.id}`);
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish listing.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl animate-pulse">
          स
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              स
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Post Free Property</span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              0% Brokerage
            </span>
          </div>

          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200"
          >
            {lang === 'en' ? 'नेपाली' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Wizard Container */}
      <main className="max-w-3xl w-full mx-auto px-4 py-8 flex-1">
        {/* Step Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-500 -z-0"
              style={{
                width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
              }}
            />

            {STEPS.map((s) => {
              const isActive = s.num === currentStep;
              const isDone = s.num < currentStep;

              return (
                <div key={s.num} className="flex flex-col items-center gap-1 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-400 border border-slate-300'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium hidden sm:block ${
                      isActive ? 'text-emerald-700 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {lang === 'en' ? s.titleEn : s.titleNe}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: TYPE & LOCATION */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Property Type & Location' : 'सम्पत्ति प्रकार तथा लोकेसन'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Select what you are listing and its exact municipal location.'
                    : 'तपाईंले बिक्री वा भाडामा राख्न लाग्नुभएको सम्पत्ति छनोट गर्नुहोस्।'}
                </p>
              </div>

              {/* Listing Type Radio Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'BUY_LAND', label: 'Land / Ghaderi', icon: Tag },
                  { id: 'BUY_HOUSE', label: 'House / Villa', icon: Home },
                  { id: 'RENT_HOUSE', label: 'Rental House', icon: Building },
                  { id: 'COMMERCIAL', label: 'Commercial', icon: Sparkles },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setListingType(type.id as ListingType)}
                    className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                      listingType === type.id
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <type.icon className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Location Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Primary District
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  >
                    <optgroup label="🏔️ Hilly & Valley Districts (Ropani / Aana)">
                      {HILLY_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🌾 Terai Districts (Bigha / Kattha)">
                      {TERAI_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Municipality / VDC
                    </label>
                    <input
                      type="text"
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      placeholder="e.g., Budhanilkantha Municipality"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Ward Number
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="e.g., 3"
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Locality / Tole / Landmark <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g., Golfutar, near Shivapuri School"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: AREA & SPECIFICATIONS */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Area & Specifications' : 'क्षेत्रफल तथा विशेषताहरू'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Enter the land area and key specifications.'
                    : 'जग्गाको क्षेत्रफल र बाटो/मोहोडा सम्बन्धी विवरण भर्नुहोस्।'}
                </p>
              </div>

              {/* Area Input & Unit Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Area Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value)}
                    placeholder="e.g., 4.25"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                  {areaValue && (
                    <p className="mt-1.5 text-xs text-emerald-700 font-medium">
                      ≈ {toSqFt(parseFloat(areaValue) || 0, areaUnit).toLocaleString()} sq. ft.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Measurement Unit
                  </label>
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="AANA">Aana (आना) - Hilly</option>
                    <option value="ROPANI">Ropani (रोपनी) - Hilly</option>
                    <option value="KATTHA">Kattha (कट्ठा) - Terai</option>
                    <option value="BIGHA">Bigha (बिघा) - Terai</option>
                    <option value="SQFT">Square Feet (वर्ग फिट)</option>
                  </select>
                </div>
              </div>

              {/* Road Access & Facing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Road Access & Width
                  </label>
                  <input
                    type="text"
                    value={roadAccess}
                    onChange={(e) => setRoadAccess(e.target.value)}
                    placeholder="e.g., 16 ft Pitched / 13 ft Dhalan"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Facing Direction (मोहोडा)
                  </label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value as PropertyFacing)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="EAST">East (पूर्व)</option>
                    <option value="WEST">West (पश्चिम)</option>
                    <option value="NORTH">North (उत्तर)</option>
                    <option value="SOUTH">South (दक्षिण)</option>
                    <option value="NORTH_EAST">North-East (ईशान)</option>
                    <option value="SOUTH_EAST">South-East (आग्नेय)</option>
                    <option value="NORTH_WEST">North-West (वायव्य)</option>
                    <option value="SOUTH_WEST">South-West (नैऋत्य)</option>
                  </select>
                </div>
              </div>

              {/* If House: Bedrooms & Bathrooms */}
              {(listingType === 'BUY_HOUSE' || listingType === 'RENT_HOUSE') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                      Bathrooms
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Listing Title (Optional, auto-generated if blank)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Prime 4 Aana Residential Ghaderi in Golfutar"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                    Property Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mention surrounding environment, water supply, electricity, proximity to markets/schools..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: PHOTOS */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Property Photos (Up to 10)' : 'सम्पत्तिका तस्बिरहरू (१० वटासम्म)'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Upload clear photos of the plot, access road, and surroundings.'
                    : 'जग्गा वा घरका स्पष्ट तस्बिरहरू अपलोड गर्नुहोस्।'}
                </p>
              </div>

              {photoError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {uploadingPhotos ? 'Uploading to storage...' : 'Click to select or drag & drop photos'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP up to 5MB each (Max 10 photos)</p>
              </div>

              {/* Photos Preview Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100">
                      <PropertyImage src={url} alt={`Upload ${idx + 1}`} fill sizes="150px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: PRICE & LALPURJA VERIFICATION */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Price & Ownership Verification' : 'मूल्य तथा लालपुर्जा प्रमाणीकरण'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'State your direct asking price with zero middleman fee.'
                    : 'बिना दलाल सिधै खरिदकर्तालाई दिने मूल्य प्रविष्ट गर्नुहोस्।'}
                </p>
              </div>

              {/* Price Field */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Total Asking Price in NPR <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                    Rs.
                  </span>
                  <input
                    type="number"
                    value={priceNpr}
                    onChange={(e) => setPriceNpr(e.target.value)}
                    placeholder="e.g., 14500000"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-12 pr-4 py-3 text-base font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                {priceNpr && (
                  <p className="mt-2 text-xs font-bold text-emerald-800">
                    Display: {formatPriceNPR(parseFloat(priceNpr) || 0, lang)}
                  </p>
                )}
              </div>

              {/* Cadastral Kitta Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                  Cadastral Kitta Number (नापी कित्ता नम्बर)
                </label>
                <input
                  type="text"
                  value={kittaNo}
                  onChange={(e) => setKittaNo(e.target.value)}
                  placeholder="e.g., KITTA-402"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Helps buyers verify parcel boundary maps on the official survey grid.
                </p>
              </div>

              {/* Verification & Ownership Checkbox */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasLalpurja}
                    onChange={(e) => setHasLalpurja(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      I possess a legal Lalpurja (Land Ownership Certificate) for this property (subject to verification)
                    </span>
                    <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                      Self-declared certificates are displayed as &quot;Lalpurja claimed by owner — pending verification&quot; until official cadastral survey verification is conducted by Sarvabhoomi.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ownershipConfirmed}
                    onChange={(e) => setOwnershipConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Legal Ownership Declaration <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      I declare that I am the genuine legal owner or authorized representative of this property. No unauthorized broker listings allowed.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: REVIEW & PUBLISH */}
          {/* ============================================================ */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Review & Publish Listing' : 'समीक्षा तथा प्रकाशन'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Review your details before publishing free of charge.'
                    : 'विवरण जाँच गरी निःशुल्क सूचीकृत गर्नुहोस्।'}
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                      {listingType.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {title || 'Verified Property Listing'}
                    </h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{locality}, {district}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900 block">
                      {formatPriceNPR(parseFloat(priceNpr) || 0, lang)}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      {formatArea(parseFloat(areaValue) || 0, areaUnit, lang, { includeSqft: false })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Road Access</span>
                    <span className="font-bold text-slate-900">{roadAccess || '16 ft Pitched'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Facing</span>
                    <span className="font-bold text-slate-900">{facing}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Kitta No</span>
                    <span className="font-bold text-slate-900">{kittaNo || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Verification</span>
                    <span className="font-bold text-amber-700">
                      {hasLalpurja ? 'Lalpurja Claimed (Pending)' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zero Fee Guarantee Callout */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <span className="font-bold">100% Free Owner Listing:</span> No hidden commission or middleman brokerage. Direct buyer contacts are connected via Sarvabhoomi.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'en' ? 'Back' : 'पछाडि'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {currentStep === 5 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handlePublish('DRAFT')}
                    disabled={isSubmitting}
                    className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-colors"
                  >
                    Save as Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePublish('ACTIVE')}
                    disabled={isSubmitting}
                    className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish Free Property</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-all"
                >
                  <span>{lang === 'en' ? 'Continue' : 'अगाडि बढ्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <span>© 2026 Sarvabhoomi Capital & Investment Pvt. Ltd.</span>
          <span>100% Zero Brokerage P2P</span>
        </div>
      </footer>
    </div>
  );
}

