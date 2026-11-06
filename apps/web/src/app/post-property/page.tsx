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
  Tag,
  AlertCircle,
  X,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Sparkles,
  Bed,
  Users,
  Armchair,
  Car,
  Layers,
  Calendar,
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
  formatArea,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { PropertyImage } from '@/components/PropertyImage';

type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { num: 1, titleEn: 'Type & Location', titleNe: 'प्रकार र स्थान' },
  { num: 2, titleEn: 'Rent & Details', titleNe: 'भाडा र विवरण' },
  { num: 3, titleEn: 'Photos', titleNe: 'तस्बिरहरू' },
  { num: 4, titleEn: 'Price & Ownership', titleNe: 'स्वामित्व घोषणा' },
  { num: 5, titleEn: 'Review & Submit', titleNe: 'समीक्षा र पेश' },
];

export default function PostPropertyPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'ne'>('en');

  // Authentication state
  const [loadingUser, setLoadingUser] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Active step
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: Type & Location (Subtype: House, Flat, Room, Shop)
  const [subtype, setSubtype] = useState<PropertySubtype>('FLAT');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [ward, setWard] = useState<string>('');
  const [locality, setLocality] = useState('');

  // Step 2: Rent & Details
  const [monthlyRentNpr, setMonthlyRentNpr] = useState<string>('');
  const [depositNpr, setDepositNpr] = useState<string>('');
  const [maintenanceNpr, setMaintenanceNpr] = useState<string>('');
  const [maintenanceIncluded, setMaintenanceIncluded] = useState(false);
  const [furnishing, setFurnishing] = useState<Furnishing>('SEMI');
  const [preferredTenant, setPreferredTenant] = useState<PreferredTenant>('FAMILY');
  const [availableFrom, setAvailableFrom] = useState('');
  const [bedrooms, setBedrooms] = useState<string>('2');
  const [bathrooms, setBathrooms] = useState<string>('1');
  const [floorNo, setFloorNo] = useState<string>('2');
  const [totalFloors, setTotalFloors] = useState<string>('4');
  const [hasParking, setHasParking] = useState(true);
  const [areaValue, setAreaValue] = useState<string>('750');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('SQFT');
  const [roadAccess, setRoadAccess] = useState('16 ft Pitched');
  const [facing, setFacing] = useState<PropertyFacing>('EAST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Step 3: Photos
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Ownership, Identity (Lazy Profile Gate) & Non-Brokerage Declaration
  const [kittaNo, setKittaNo] = useState('');
  const [hasLalpurja, setHasLalpurja] = useState(true);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [nonBrokerConfirmed, setNonBrokerConfirmed] = useState(false);
  const [ownerFullName, setOwnerFullName] = useState('');
  const [ownerDistrict, setOwnerDistrict] = useState('Kathmandu');
  const [ownerProfileCompleted, setOwnerProfileCompleted] = useState(false);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth protection & role check: Renter CANNOT access /post-property
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
          if (profile?.profile_completed) setOwnerProfileCompleted(true);
          setLoadingUser(false);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        router.replace('/auth');
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Handle local photo selection & Supabase Storage upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 10) {
      setPhotoError('Maximum 10 property photos allowed.');
      return;
    }

    setUploadingPhotos(true);
    setPhotoError(null);

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError(`File "${file.name}" exceeds maximum allowed 5MB limit.`);
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
          console.warn(`Supabase storage upload notice (${uploadErr.message}). Preserving photo locally.`);
        }
      } catch (uploadException) {
        console.warn('Supabase storage upload exception:', uploadException);
      }

      // If remote bucket is not configured or upload fails, fall back to base64 Data URL so the user is never blocked
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
      } else {
        setPhotoError(`Unable to process "${file.name}". Please try another image.`);
      }
    }

    setPhotos((prev) => [...prev, ...uploadedUrls]);
    setUploadingPhotos(false);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Step validation
  const validateStep = (step: WizardStep): boolean => {
    setErrorMessage(null);

    if (step === 1) {
      if (!locality.trim()) {
        setErrorMessage(lang === 'en' ? 'Please enter a locality, ward, or landmark.' : 'कृपया टोल वा चोक उल्लेख गर्नुहोस्।');
        return false;
      }
      return true;
    }

    if (step === 2) {
      const rent = parseFloat(monthlyRentNpr);
      if (isNaN(rent) || rent <= 0) {
        setErrorMessage(lang === 'en' ? 'Please enter a valid monthly rent amount.' : 'कृपया मान्य मासिक भाडा रकम प्रविष्ट गर्नुहोस्।');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!ownerFullName.trim() || ownerFullName.trim().length < 2) {
        setErrorMessage(
          lang === 'en'
            ? 'Please enter your full legal name before publishing.'
            : 'कृपया अगाडि बढ्न आफ्नो पूरा कानुनी नाम प्रविष्ट गर्नुहोस्।'
        );
        return false;
      }
      if (!ownerDistrict || ownerDistrict.trim().length < 2) {
        setErrorMessage(
          lang === 'en'
            ? 'Please select your primary district.'
            : 'कृपया आफ्नो मुख्य जिल्ला छनोट गर्नुहोस्।'
        );
        return false;
      }
      if (!ownershipConfirmed) {
        setErrorMessage(
          lang === 'en'
            ? 'Please confirm that you are the lawful owner or authorized representative.'
            : 'कृपया तपाईं घरधनी वा अधिकार प्राप्त प्रतिनिधि भएको पुष्टि गर्नुहोस्।'
        );
        return false;
      }
      if (!nonBrokerConfirmed) {
        setErrorMessage(
          lang === 'en'
            ? 'Please certify that you will not charge brokerage commission to tenants.'
            : 'कृपया भाडावालसँग कुनै दलाली शुल्क नलिने प्रतिबद्धता जनाउनुहोस्।'
        );
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(1, prev - 1) as WizardStep);
  };

  // Final Form Submission — Creates Listing with status = 'PENDING_REVIEW'
  const handlePublish = async (status: 'PENDING_REVIEW' | 'DRAFT' = 'PENDING_REVIEW') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(4)) {
      return;
    }

    if (!userId) {
      setErrorMessage('User session missing. Please re-login.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const numRent = parseFloat(monthlyRentNpr) || 15000;
    const numDeposit = depositNpr ? parseFloat(depositNpr) : null;
    const numMaint = maintenanceNpr ? parseFloat(maintenanceNpr) : null;
    const numArea = parseFloat(areaValue) || 500;
    const sqft = areaUnit === 'SQFT' ? numArea : toSqFt(numArea, areaUnit);

    const defaultTitle =
      title.trim() ||
      `${subtype} for Rent in ${locality}, ${district}`;

    const defaultPhotos =
      photos.length > 0
        ? photos
        : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'];

    const propertyPayload = {
      owner_id: userId,
      title: defaultTitle,
      description: description.trim() || 'Direct landlord listing. Verified zero-brokerage rental on Sarvabhoomi.',
      listing_type: 'RENT_HOUSE' as const,
      price_npr: numRent, // stored total field
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
      owner_declared_lalpurja: hasLalpurja,
      admin_verified: false,
      lalpurja_verified: false,
      kitta_no: kittaNo.trim() || null,
      photos: defaultPhotos,
      status, // PENDING_REVIEW per NoBroker review requirement
      views_count: 0,
      updated_at: new Date().toISOString(),
    };

    try {
      // Lazy Profile Gate: Save owner legal name & district to profiles table and mark profile completed
      const derivedRegion = getRegionForDistrict(ownerDistrict);
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: ownerFullName.trim(),
          preferred_district: ownerDistrict,
          preferred_region: derivedRegion,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileErr) {
        console.warn('Error saving owner profile details:', profileErr.message);
      }

      const { data, error } = await supabase
        .from('properties')
        .insert(propertyPayload)
        .select('id')
        .single();

      if (error) {
        console.warn('Publish insert error:', error.message);
        if (error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
          setErrorMessage('Database table "properties" was not found or schema cache needs refreshing. Run fix_storage_bucket.sql in your Supabase SQL editor.');
        } else {
          setErrorMessage(error.message || 'Error publishing listing. Please check database permissions.');
        }
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
            <span className="font-extrabold text-slate-900 text-sm">Post Free Rental Listing</span>
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
          {/* STEP 1: TYPE & LOCATION                                      */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Rental Type & Location' : 'भाडाको प्रकार तथा लोकेसन'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Select the property subtype and its exact location in Nepal.'
                    : 'तपाईंले भाडामा दिन लाग्नुभएको सम्पत्तिको प्रकार र लोकेसन रोज्नुहोस्।'}
                </p>
              </div>

              {/* Subtype Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {lang === 'en' ? 'Property Subtype' : 'सम्पत्ति प्रकार'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'FLAT', labelEn: 'Flat / Apartment', labelNe: 'फ्ल्याट', icon: Home },
                    { id: 'ROOM', labelEn: 'Single Room', labelNe: 'कोठा', icon: Bed },
                    { id: 'HOUSE', labelEn: 'Independent House', labelNe: 'घर', icon: Layers },
                    { id: 'SHOP', labelEn: 'Commercial Shop', labelNe: 'पसल / सटर', icon: Tag },
                  ].map((item) => {
                    const isSelected = subtype === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSubtype(item.id as PropertySubtype)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-2 border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <IconComp className={`w-5 h-5 mb-2 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className="text-xs block font-bold">{lang === 'en' ? item.labelEn : item.labelNe}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District & Locality Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'District' : 'जिल्ला'} *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    {ALL_NEPAL_DISTRICTS.map((d) => (
                      <option key={d.nameEn} value={d.nameEn}>
                        {lang === 'ne' ? d.nameNe : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Municipality / VDC' : 'नगरपालिका / गाउँपालिका'}
                  </label>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder="e.g. Kathmandu Metropolitan City"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Ward Number' : 'वडा नम्बर'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Locality / Landmark' : 'टोल वा चोक'} *
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Baluwatar Embassy Zone, Baneshwor..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: RENT & DETAILS                                       */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Rent & Property Details' : 'मासिक भाडा तथा थप विवरण'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {lang === 'en'
                    ? 'Enter monthly rent, security deposit, maintenance, and unit specs.'
                    : 'मासिक भाडा दर, धरौटी र फर्निसिङ सम्बन्धी विवरण भर्नुहोस्।'}
                </p>
              </div>

              {/* Rent, Deposit & Maintenance Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Monthly Rent (NPR)' : 'मासिक भाडा (रु)'} *
                  </label>
                  <input
                    type="number"
                    value={monthlyRentNpr}
                    onChange={(e) => setMonthlyRentNpr(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Security Deposit (NPR)' : 'धरौटी रकम (रु)'}
                  </label>
                  <input
                    type="number"
                    value={depositNpr}
                    onChange={(e) => setDepositNpr(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Maintenance (NPR / Month)' : 'मर्मत शुल्क (रु)'}
                  </label>
                  <input
                    type="number"
                    disabled={maintenanceIncluded}
                    value={maintenanceNpr}
                    onChange={(e) => setMaintenanceNpr(e.target.value)}
                    placeholder={maintenanceIncluded ? 'Included in Rent' : 'e.g. 1500'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 disabled:opacity-50"
                  />
                  <label className="flex items-center gap-1.5 mt-2 cursor-pointer text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={maintenanceIncluded}
                      onChange={(e) => {
                        setMaintenanceIncluded(e.target.checked);
                        if (e.target.checked) setMaintenanceNpr('');
                      }}
                      className="rounded text-emerald-600"
                    />
                    <span>Maintenance included in monthly rent</span>
                  </label>
                </div>
              </div>

              {/* Furnishing, Preferred Tenant, Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Furnishing Status' : 'फर्निसिङ'}
                  </label>
                  <select
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value as Furnishing)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="FULLY">Fully Furnished</option>
                    <option value="SEMI">Semi Furnished</option>
                    <option value="UNFURNISHED">Unfurnished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Preferred Tenant' : 'प्राथमिकता'}
                  </label>
                  <select
                    value={preferredTenant}
                    onChange={(e) => setPreferredTenant(e.target.value as PreferredTenant)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="FAMILY">Family Preferred</option>
                    <option value="BACHELOR">Bachelors / Students</option>
                    <option value="COMPANY">Company / Office</option>
                    <option value="ANY">Any Tenant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {lang === 'en' ? 'Available From' : 'उपलब्ध मिति'}
                  </label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Bedrooms, Bathrooms, Floor, Parking */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bedrooms / BHK</label>
                  <input
                    type="number"
                    min="0"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bathrooms</label>
                  <input
                    type="number"
                    min="1"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Floor No</label>
                  <input
                    type="number"
                    min="0"
                    value={floorNo}
                    onChange={(e) => setFloorNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Parking toggle & Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Built-up Area (Sq. Ft.)</label>
                  <input
                    type="number"
                    value={areaValue}
                    onChange={(e) => setAreaValue(e.target.value)}
                    placeholder="e.g. 850"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={hasParking}
                      onChange={(e) => setHasParking(e.target.checked)}
                      className="rounded text-emerald-600 w-4 h-4"
                    />
                    <span>Dedicated Parking Available (Car / Bike)</span>
                  </label>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Listing Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Beautiful 2 BHK Sunlit Flat in Baluwatar"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe amenities, surroundings, water supply, sunlight..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: PHOTOS                                               */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Property Photos (Up to 10)' : 'सम्पत्तिका तस्बिरहरू'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload clear photos of the rooms, kitchen, balcony, and entrance.
                </p>
              </div>

              {photoError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
                  <span>{photoError}</span>
                  <button type="button" onClick={() => setPhotoError(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  {uploadingPhotos ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {uploadingPhotos ? 'Uploading photos...' : 'Click to select or drag & drop photos'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">JPG, PNG, WebP up to 5MB each (Max 10 photos)</p>
              </div>

              {/* Photos Preview Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative h-28 rounded-xl overflow-hidden border border-slate-200 group">
                      <PropertyImage src={url} alt={`Photo ${idx + 1}`} fill sizes="200px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
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
          {/* STEP 4: PRICE & OWNERSHIP DECLARATION                         */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Rental Summary & Ownership Declaration' : 'भाडा सारांश र स्वामित्व घोषणा'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Certify zero-brokerage direct landlord status and ownership reference.
                </p>
              </div>

              {/* Monthly Rent Summary Card */}
              <div className="p-5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Proposed Monthly Rent
                </span>
                <span className="text-2xl font-black text-emerald-950 block">
                  {formatMonthlyRentNPR(parseFloat(monthlyRentNpr) || 0, lang)}
                </span>
                <span className="text-xs text-emerald-800 block">
                  Security Deposit: {formatDeposit(depositNpr ? parseFloat(depositNpr) : null, lang)}
                </span>
              </div>

              {/* Cadastral Kitta No Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cadastral Plot / Kitta No (कित्ता नम्बर)
                </label>
                <input
                  type="text"
                  value={kittaNo}
                  onChange={(e) => setKittaNo(e.target.value)}
                  placeholder="e.g. KITTA-402 (or leave blank if unsure)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Owner Legal Identity (Lazy Profile Gate) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    {lang === 'en' ? 'Owner Legal Identity & District' : 'घरधनीको पूरा नाम र जिल्ला'} *
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {lang === 'en'
                    ? 'Required before publishing. Saved to your profile so prospective tenants can verify direct ownership.'
                    : 'विज्ञापन प्रकाशित गर्न आफ्नो पूरा नाम र जिल्ला पुष्टि गर्नुहोस्। यो तपाईंको प्रोफाइलमा सुरक्षित हुनेछ।'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'en' ? 'Full Legal Name *' : 'पूरा कानुनी नाम *'}
                    </label>
                    <input
                      type="text"
                      value={ownerFullName}
                      onChange={(e) => {
                        setOwnerFullName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      placeholder="e.g. Ram Bahadur Shrestha"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {lang === 'en' ? 'Primary District *' : 'मुख्य जिल्ला *'}
                    </label>
                    <select
                      value={ownerDistrict}
                      onChange={(e) => {
                        setOwnerDistrict(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                    >
                      {ALL_NEPAL_DISTRICTS.map((d) => (
                        <option key={d.nameEn} value={d.nameEn}>
                          {lang === 'ne' ? d.nameNe : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5 pt-1">
                  <span>
                    ✓ {lang === 'en'
                      ? `Cadastral unit system automatically set to: ${getRegionForDistrict(ownerDistrict)} (${getRegionForDistrict(ownerDistrict) === 'HILLY' ? 'Ropani-Aana' : 'Bigha-Kattha'})`
                      : `नापी एकाइ प्रणाली स्वतः निर्धारित: ${getRegionForDistrict(ownerDistrict)}`}
                  </span>
                </div>
              </div>

              {/* Legal Non-Brokerage & Ownership Declarations */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={ownershipConfirmed}
                    onChange={(e) => setOwnershipConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 w-4 h-4"
                  />
                  <span>
                    <strong>Owner / Authorized Representative Declaration:</strong> I certify that I am the legal owner or authorized representative of this property, and all rental specifications provided are authentic.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={nonBrokerConfirmed}
                    onChange={(e) => setNonBrokerConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 w-4 h-4"
                  />
                  <span>
                    <strong>Zero Brokerage Commitment:</strong> I certify that this listing is 100% direct and I will not solicit, demand, or charge any brokerage commission from visiting or moving-in tenants.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: REVIEW & PUBLISH                                     */}
          {/* ============================================================ */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {lang === 'en' ? 'Review & Submit Listing' : 'समीक्षा तथा पेश गर्नुहोस्'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Please review your rental details. New listings are submitted for review before going live.
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
                <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      {subtype} FOR RENT
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {title || `${subtype} in ${locality}, ${district}`}
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      {locality}, {municipality ? `${municipality}, ` : ''}{district}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-700">
                      {formatMonthlyRentNPR(parseFloat(monthlyRentNpr) || 0, lang)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Deposit: {formatDeposit(depositNpr ? parseFloat(depositNpr) : null, lang)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bedrooms</span>
                    <span className="font-bold">{bedrooms} BHK</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Furnishing</span>
                    <span className="font-bold">{furnishing}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Area</span>
                    <span className="font-bold">{areaValue} Sq. Ft.</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tenant</span>
                    <span className="font-bold">{preferredTenant}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Landlord: <strong className="text-slate-900">{ownerFullName}</strong> ({ownerDistrict})
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    ✓ Direct Owner Listing
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Review Before Live:</strong> To maintain Sarvabhoomi&apos;s zero-brokerage authenticity, your listing will be created with status <strong>Pending Review</strong> and reviewed before appearing in public search.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Action Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Back' : 'पछाडि'}</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <span>{lang === 'en' ? 'Continue' : 'अगाडि बढ्नुहोस्'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePublish('PENDING_REVIEW')}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Submit Rental Listing'}</span>
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
