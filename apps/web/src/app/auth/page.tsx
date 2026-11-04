'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Globe2,
  RefreshCw,
  Home,
  Tag,
  TrendingUp,
  MapPin,
  Sparkles,
  Lock,
  Check,
  RotateCcw,
  Coins,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import {
  nepalPhoneRegex,
  onboardingSchema,
  HILLY_DISTRICTS,
  TERAI_DISTRICTS,
  getRegionForDistrict,
  getAuthDict,
  UserIntent,
  PreferredRegion,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';

type AuthStep = 'PHONE' | 'OTP' | 'ROLE_SELECTION' | 'ONBOARDING_FORM';

interface StepItem {
  id: AuthStep;
  num: number;
  labelEn: string;
  labelNe: string;
}

const STEPS: StepItem[] = [
  { id: 'PHONE', num: 1, labelEn: 'Mobile', labelNe: 'मोबाइल' },
  { id: 'OTP', num: 2, labelEn: 'OTP', labelNe: 'ओटीपी' },
  { id: 'ROLE_SELECTION', num: 3, labelEn: 'Select Role', labelNe: 'भूमिका' },
  { id: 'ONBOARDING_FORM', num: 4, labelEn: 'Profile Details', labelNe: 'विवरण' },
];

export default function AuthPage() {
  const router = useRouter();

  // Language state (defaults to English, toggles to Nepali)
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  // Active step machine: strictly initialized to 'PHONE'
  const [step, setStep] = useState<AuthStep>('PHONE');

  // Step 1: Phone State (clean, empty by default)
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);

  // Step 2: OTP State (clean, empty by default)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3 & 4: Role Selection & Onboarding State
  const [userId, setUserId] = useState<string | null>(null);
  const [userIntent, setUserIntent] = useState<UserIntent>('BUYER');
  const [fullName, setFullName] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Kathmandu');
  const [preferredRegion, setPreferredRegion] = useState<PreferredRegion>('HILLY');
  const [regionAutoDetected, setRegionAutoDetected] = useState(true);
  const [onboardingErrors, setOnboardingErrors] = useState<Record<string, string>>({});

  // Global loading and feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  const phoneInputId = useId();
  const nameInputId = useId();
  const districtSelectId = useId();

  // Clean raw phone input (strip +977, 977, spaces, hyphens)
  const cleanPhone = (val: string) => {
    return val.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, '');
  };

  // Check initial Supabase authentication status on mount
  // RULE: Only redirect if is_onboarded === true. Otherwise strictly remain at step 'PHONE'.
  useEffect(() => {
    let isMounted = true;
    async function checkAuthSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          setUserId(user.id);
          if (user.phone) {
            setPhone(cleanPhone(user.phone));
          }

          // Check if already onboarded in public.profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_onboarded, full_name, user_intent, preferred_district, preferred_region')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.is_onboarded) {
            router.push('/dashboard');
            return;
          }

          // Do NOT fast-forward step here! Keep the user strictly on Step 1 ('PHONE').
          // Pre-populate fields in case they progress forward.
          if (profile) {
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.user_intent) setUserIntent(profile.user_intent);
            if (profile.preferred_district) setSelectedDistrict(profile.preferred_district);
            if (profile.preferred_region) setPreferredRegion(profile.preferred_region);
          }
        }
      } catch {
        // Continue to Step 1: PHONE as guest
      }
    }

    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // Resend Countdown Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Toggle Language between English and Nepali
  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ne' : 'en'));
  };

  // Evaluate phone input with real-time carrier detection
  const handlePhoneInputChange = (raw: string) => {
    const cleaned = cleanPhone(raw);
    setPhone(cleaned);

    if (!cleaned) {
      setPhoneError(null);
      setDetectedCarrier(null);
      return;
    }

    if (nepalPhoneRegex.test(cleaned)) {
      setPhoneError(null);
      if (
        cleaned.startsWith('984') ||
        cleaned.startsWith('985') ||
        cleaned.startsWith('986') ||
        cleaned.startsWith('974') ||
        cleaned.startsWith('975')
      ) {
        setDetectedCarrier('Nepal Telecom (NTC)');
      } else if (
        cleaned.startsWith('980') ||
        cleaned.startsWith('981') ||
        cleaned.startsWith('982') ||
        cleaned.startsWith('970')
      ) {
        setDetectedCarrier('Ncell Axiata');
      } else {
        setDetectedCarrier('Nepali Mobile Network');
      }
    } else {
      setDetectedCarrier(null);
      if (cleaned.length === 10) {
        setPhoneError(dict.phoneAuth.invalidPhoneError);
      } else {
        setPhoneError(null);
      }
    }
  };

  // Step 1: Send OTP Submit Handler
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanPhone(phone);

    if (!nepalPhoneRegex.test(cleaned)) {
      setPhoneError(dict.phoneAuth.invalidPhoneError);
      return;
    }

    setPhoneError(null);
    setIsSubmitting(true);
    setNotice(null);

    const fullPhone = `+977${cleaned}`;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        setNotice({
          type: 'error',
          message: error.message || dict.phoneAuth.invalidPhoneError,
        });
        return;
      }

      setNotice({
        type: 'success',
        message:
          lang === 'en'
            ? `6-Digit OTP dispatched to ${fullPhone}`
            : `६-अङ्कको OTP कोड ${fullPhone} मा पठाइयो`,
      });
      setResendTimer(30);
      setCanResend(false);
      setStep('OTP');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : dict.phoneAuth.invalidPhoneError;
      setNotice({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle individual OTP digit change
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setOtpError(null);

    // Auto-advance to next box if character was entered
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation in OTP boxes
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpDigits(updated);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    const cleaned = cleanPhone(phone);
    setIsSubmitting(true);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+977${cleaned}`,
      });

      if (error) {
        setNotice({
          type: 'error',
          message: error.message || 'Failed to resend code.',
        });
        return;
      }

      setNotice({
        type: 'success',
        message:
          lang === 'en'
            ? 'A fresh 6-digit OTP has been sent via SMS.'
            : 'नयाँ ६-अङ्कको OTP कोड सफलतापूर्वक पठाइयो।',
      });
      setResendTimer(30);
      setCanResend(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error resending verification code.';
      setNotice({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP Submit Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join('');
    const cleaned = cleanPhone(phone);

    if (token.length !== 6 || !/^\d{6}$/.test(token)) {
      setOtpError(dict.otp.invalidOtpError);
      return;
    }

    setOtpError(null);
    setIsSubmitting(true);
    setNotice(null);

    const fullPhone = `+977${cleaned}`;

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token,
        type: 'sms',
      });

      if (error) {
        setOtpError(error.message || dict.otp.invalidOtpError);
        return;
      }

      const verifiedUser = data?.user;
      if (verifiedUser) {
        setUserId(verifiedUser.id);

        // Query public.profiles table for onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded, full_name, user_intent, preferred_district, preferred_region')
          .eq('id', verifiedUser.id)
          .maybeSingle();

        if (profile?.is_onboarded) {
          router.push('/dashboard');
          return;
        }

        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.user_intent) setUserIntent(profile.user_intent);
          if (profile.preferred_district) setSelectedDistrict(profile.preferred_district);
          if (profile.preferred_region) setPreferredRegion(profile.preferred_region);
        }

        setNotice({
          type: 'success',
          message:
            lang === 'en'
              ? 'Phone verified! Select your role to continue.'
              : 'फोन प्रमाणीकरण सम्पन्न! अगाडि बढ्न आफ्नो भूमिका छनोट गर्नुहोस्।',
        });
        // Transition strictly to Step 3: ROLE_SELECTION
        setStep('ROLE_SELECTION');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : dict.otp.invalidOtpError;
      setOtpError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Handle District Selection & Auto-Detection of Measurement System
  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    const autoRegion = getRegionForDistrict(newDistrict);
    setPreferredRegion(autoRegion);
    setRegionAutoDetected(true);
  };

  // Manual override for Land Measurement System
  const handleManualRegionOverride = (region: PreferredRegion) => {
    setPreferredRegion(region);
    setRegionAutoDetected(false);
  };

  // Step 4: Complete Onboarding Submit Handler
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using Zod onboardingSchema from @sarvabhoomi/shared
    const parseResult = onboardingSchema.safeParse({
      fullName,
      userIntent,
      preferredRegion,
      preferredDistrict: selectedDistrict,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setOnboardingErrors(errors);
      return;
    }

    setOnboardingErrors({});
    setIsSubmitting(true);
    setNotice(null);

    const cleaned = cleanPhone(phone);
    const fullPhone = `+977${cleaned}`;

    try {
      let targetUserId = userId;
      if (!targetUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        targetUserId = user?.id || null;
      }

      if (!targetUserId) {
        setNotice({
          type: 'error',
          message: 'Unable to identify authenticated user session. Please sign in again.',
        });
        setStep('PHONE');
        return;
      }

      // Upsert profile into public.profiles
      const profileData = {
        id: targetUserId,
        phone_np: fullPhone,
        full_name: fullName.trim(),
        user_intent: userIntent,
        preferred_region: preferredRegion,
        preferred_district: selectedDistrict,
        preferred_lang: lang,
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (upsertError) {
        setNotice({
          type: 'error',
          message: upsertError.message || 'Failed to update profile. Please try again.',
        });
        return;
      }

      // Redirect immediately to /dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error completing onboarding.';
      setNotice({
        type: 'error',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Progress Index calculation
  const getStepIndex = (s: AuthStep) => {
    switch (s) {
      case 'PHONE':
        return 0;
      case 'OTP':
        return 1;
      case 'ROLE_SELECTION':
        return 2;
      case 'ONBOARDING_FORM':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(step);

  // Role Metadata Definition
  const ROLES: {
    id: UserIntent;
    titleEn: string;
    titleNe: string;
    descEn: string;
    descNe: string;
    badgeEn: string;
    badgeNe: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'BUYER',
      titleEn: 'Direct Property Buyer',
      titleNe: 'प्रत्यक्ष खरिदकर्ता (Direct Buyer)',
      descEn: 'Buy land (Ghaderi) or houses with 0% brokerage.',
      descNe: 'कुनै पनि दलाली शुल्क बिना सिधै जग्गाधनीसँग घरजग्गा खरिद गर्नुहोस्।',
      badgeEn: '0% Broker Commission',
      badgeNe: '०% कमिसन',
      icon: Home,
    },
    {
      id: 'OWNER',
      titleEn: 'Property Owner / Seller',
      titleNe: 'जग्गाधनी तथा बिक्रेता (Property Owner)',
      descEn: 'List land or residential property 100% free of charge.',
      descNe: 'आफ्नो जग्गा वा घर १००% निःशुल्क सूचीकृत गरी सिधै बिक्री गर्नुहोस्।',
      badgeEn: '100% Free Listing',
      badgeNe: '१००% निःशुल्क सूची',
      icon: Tag,
    },
    {
      id: 'INVESTOR_NRN',
      titleEn: 'NRN / Institutional Investor',
      titleNe: 'लगानीकर्ता / एनआरएन (Investor / NRN)',
      descEn: 'Track wealth, portfolio assets, and market vs. government valuations.',
      descNe: 'पुँजी वृद्धि, पोर्टफोलियो सम्पत्ति तथा सरकारी र बजार मूल्याङ्कन ट्र्याक गर्नुहोस्।',
      badgeEn: 'Wealth & Valuation Tracker',
      badgeNe: 'पुँजी वृद्धि ट्र्याकर',
      icon: TrendingUp,
    },
    {
      id: 'AGENT_BROKER',
      titleEn: 'Licensed Real Estate Agent / Facilitator',
      titleNe: 'घरजग्गा सहजकर्ता / एजेन्ट (Facilitator / Agent)',
      descEn: 'Manage multiple client portfolios with verified cadastral plots.',
      descNe: 'प्रमाणित कित्ता नापी नक्सा सहित धेरै ग्राहकहरूको पोर्टफोलियो व्यवस्थापन गर्नुहोस्।',
      badgeEn: 'Multi-Client GIS Portfolio',
      badgeNe: 'बहु-ग्राहक जीआईएस',
      icon: Briefcase,
    },
  ];

  const selectedRoleMeta = ROLES.find((r) => r.id === userIntent) || ROLES[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-600 selection:text-white">
      {/* Institutional Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          {/* Sarvabhoomi Emblem & Brand Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl sm:text-2xl shadow-xs ring-4 ring-emerald-50 select-none">
                स
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg">
                  {dict.brand.name}
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Institutional P2P
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block line-clamp-1 max-w-lg">
                {dict.brand.tagline}
              </p>
            </div>
          </div>

          {/* Instant 1-Click Bilingual Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-xs active:scale-95"
              aria-label="Toggle Interface Language"
            >
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <span className="tracking-wide">
                {lang === 'en' ? 'नेपाली (NE)' : 'English (EN)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
        {/* Unified 4-Step Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {/* Top 4-Step Progress Bar */}
          <div className="border-b border-slate-100 bg-slate-50/80 p-4 sm:px-6">
            <div className="flex items-center justify-between relative">
              {/* Connecting Progress Track */}
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-500 -z-0"
                style={{
                  width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%`,
                }}
              />

              {STEPS.map((s, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;

                return (
                  <div key={s.id} className="flex flex-col items-center gap-1 relative z-10">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium tracking-tight ${
                        isActive
                          ? 'text-emerald-700 font-bold'
                          : isCompleted
                          ? 'text-slate-700 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {lang === 'en' ? s.labelEn : s.labelNe}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Notices */}
          {notice && (
            <div
              className={`p-3.5 mx-6 mt-6 rounded-xl text-xs flex items-start gap-2.5 border ${
                notice.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              {notice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed font-medium">{notice.message}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: NEPAL MOBILE NUMBER INPUT */}
          {/* ============================================================ */}
          {step === 'PHONE' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{dict.promo.claimBadge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {dict.phoneAuth.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {dict.phoneAuth.subtitle}
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor={phoneInputId}
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      {dict.phoneAuth.phoneLabel}
                    </label>
                    {detectedCarrier && (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {detectedCarrier}
                      </span>
                    )}
                  </div>

                  <div className="relative flex rounded-xl overflow-hidden border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all shadow-xs">
                    {/* Fixed Nepal Flag & Prefix */}
                    <div className="bg-slate-50 px-3.5 flex items-center border-r border-slate-200 text-sm font-mono text-slate-700 select-none gap-1.5 shrink-0">
                      <span className="text-base">🇳🇵</span>
                      <span className="font-semibold tracking-wider text-slate-800">+977</span>
                    </div>

                    {/* 10-Digit Mobile Input */}
                    <input
                      id={phoneInputId}
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      placeholder={dict.phoneAuth.phonePlaceholder}
                      maxLength={10}
                      autoFocus
                      className="w-full bg-transparent px-4 py-3.5 text-base sm:text-lg font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none tracking-widest"
                    />

                    <div className="flex items-center pr-3.5 text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>

                  {phoneError ? (
                    <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {phoneError}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-500">
                      {dict.phoneAuth.phoneHint}
                    </p>
                  )}
                </div>

                {/* Submit Send OTP Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || phone.length !== 10}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-semibold text-sm tracking-wide shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{dict.phoneAuth.sendingOtp}</span>
                    </>
                  ) : (
                    <>
                      <span>{dict.phoneAuth.sendOtpButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Promotional Credit Highlight */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
                  <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'New signup bonus: 15 Free landowner contact unlock credits included.'
                      : 'नयाँ दर्ता बोनस: १५ निःशुल्क जग्गाधनी सम्पर्क अनलक क्रेडिट उपलब्ध।'}
                  </span>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: 6-DIGIT SUPABASE OTP VERIFICATION */}
          {/* ============================================================ */}
          {step === 'OTP' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>SMS Verification</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setNotice(null);
                      setOtpDigits(['', '', '', '', '', '']);
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{dict.otp.changePhone}</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {dict.otp.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {dict.otp.subtitle(phone)}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3 text-center">
                    {dict.otp.otpLabel}
                  </label>

                  {/* 6 Individual Segmented Boxes */}
                  <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoFocus={idx === 0}
                        className="w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all shadow-xs"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="mt-3 text-xs text-rose-600 flex items-center justify-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {otpError}
                    </p>
                  )}
                </div>

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <span>{dict.otp.resendPrompt}</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-4"
                    >
                      {dict.otp.resendButton}
                    </button>
                  ) : (
                    <span className="text-slate-400 font-mono">
                      {dict.otp.resendInSeconds(resendTimer)}
                    </span>
                  )}
                </div>

                {/* Submit Verify OTP Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-semibold text-sm tracking-wide shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{dict.otp.verifying}</span>
                    </>
                  ) : (
                    <>
                      <span>{dict.otp.verifyButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: ROLE SELECTION (STANDALONE SCREEN) */}
          {/* ============================================================ */}
          {step === 'ROLE_SELECTION' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'en' ? 'Step 3 of 4: User Intent' : 'चरण ३: प्रयोगकर्ता भूमिका'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {lang === 'en' ? 'Select Your Role in Nepal Real Estate' : 'नेपाल घरजग्गा बजारमा आफ्नो भूमिका रोज्नुहोस्'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {lang === 'en'
                    ? 'Choose how you intend to use Sarvabhoomi to access customized zero-brokerage tools and parcel analytics.'
                    : 'शून्य-दलाली सुविधा र कित्ता नापी नक्सा उपकरणहरू प्राप्त गर्न आफ्नो मुख्य उद्देश्य छनोट गर्नुहोस्।'}
                </p>
              </div>

              {/* 4 Distinct Role Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
                {ROLES.map((role) => {
                  const isSelected = userIntent === role.id;
                  const IconComponent = role.icon;

                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setUserIntent(role.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                        isSelected
                          ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-100'
                          : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-bold text-slate-900 mb-1">
                          {lang === 'en' ? role.titleEn : role.titleNe}
                        </div>
                        <div className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider mb-2">
                          {lang === 'en' ? role.badgeEn : role.badgeNe}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {lang === 'en' ? role.descEn : role.descNe}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('OTP')}
                  className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'पछाडि'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('ONBOARDING_FORM')}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>{lang === 'en' ? 'Continue to Profile Setup' : 'प्रोफाइल विवरण भर्न अगाडि बढ्नुहोस्'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: PROFILE & REGISTRATION FORM */}
          {/* ============================================================ */}
          {step === 'ONBOARDING_FORM' && (
            <div className="p-6 sm:p-8">
              {/* Role Summary Pill */}
              <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                    {React.createElement(selectedRoleMeta.icon, { className: 'w-4 h-4' })}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block leading-tight">
                      {lang === 'en' ? 'Selected Role' : 'छनोट गरिएको भूमिका'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {lang === 'en' ? selectedRoleMeta.titleEn : selectedRoleMeta.titleNe}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('ROLE_SELECTION')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
                >
                  {lang === 'en' ? 'Change Role' : 'परिवर्तन'}
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {dict.onboarding.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {dict.onboarding.subtitle}
                </p>
              </div>

              <form onSubmit={handleCompleteOnboarding} className="space-y-6">
                {/* 1. Full Legal Name (as per Citizenship / Lalpurja) */}
                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2"
                  >
                    {dict.onboarding.fullNameLabel}
                    <span className="text-slate-400 text-[11px] normal-case ml-1">
                      ({lang === 'en' ? 'as per Citizenship / Lalpurja' : 'नागरिकता वा लालपुर्जा अनुसार'})
                    </span>
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (onboardingErrors.fullName) {
                        setOnboardingErrors((prev) => ({ ...prev, fullName: '' }));
                      }
                    }}
                    placeholder={dict.onboarding.fullNamePlaceholder}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all text-sm shadow-xs"
                  />
                  {onboardingErrors.fullName && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {onboardingErrors.fullName}
                    </p>
                  )}
                </div>

                {/* 2. Primary District Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor={districtSelectId}
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      {dict.onboarding.districtLabel}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'en' ? 'Auto-configures measurement units' : 'नापी प्रणाली स्वतः निर्धारण हुन्छ'}
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id={districtSelectId}
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 appearance-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all text-sm shadow-xs"
                    >
                      <optgroup label="🏔️ Hilly & Valley Districts (पहाड तथा उपत्यका - Ropani System)">
                        {HILLY_DISTRICTS.map((d) => (
                          <option key={d} value={d} className="bg-white text-slate-900">
                            {d}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🌾 Terai & Inner Terai Districts (तराई तथा भित्री मधेस - Bigha System)">
                        {TERAI_DISTRICTS.map((d) => (
                          <option key={d} value={d} className="bg-white text-slate-900">
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* 3. Default Land Measurement System & 1-Click Override */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                      {dict.onboarding.regionLabel}
                    </label>
                    {regionAutoDetected ? (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        {lang === 'en' ? 'Auto-Detected' : 'स्वतः छनोट'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {lang === 'en' ? 'Manual Override' : 'म्यानुअल परिवर्तन'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mb-3">
                    {dict.onboarding.regionSubtitle}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Hilly Option */}
                    <button
                      type="button"
                      onClick={() => handleManualRegionOverride('HILLY')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        preferredRegion === 'HILLY'
                          ? 'border-2 border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600/20'
                          : 'border border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>🏔️</span>
                          <span>{lang === 'en' ? 'Hilly / Valley' : 'पहाड / उपत्यका'}</span>
                        </span>
                        {preferredRegion === 'HILLY' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-emerald-700 mb-1">
                        {lang === 'en' ? 'Ropani - Aana - Paisa - Daam' : 'रोपनी - आना - पैसा - दाम'}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {dict.onboarding.regions.HILLY.description}
                      </div>
                    </button>

                    {/* Terai Option */}
                    <button
                      type="button"
                      onClick={() => handleManualRegionOverride('TERAI')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        preferredRegion === 'TERAI'
                          ? 'border-2 border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600/20'
                          : 'border border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>🌾</span>
                          <span>{lang === 'en' ? 'Terai Plains' : 'तराई / भित्री मधेस'}</span>
                        </span>
                        {preferredRegion === 'TERAI' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-emerald-700 mb-1">
                        {lang === 'en' ? 'Bigha - Kattha - Dhur' : 'बिघा - कट्ठा - धुर'}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {dict.onboarding.regions.TERAI.description}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Promotional Credit Trigger Callout Card */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                      <span>{dict.promo.claimTitle}</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                        15 CREDITS
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-relaxed">
                      {dict.promo.claimDescription}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep('ROLE_SELECTION')}
                    className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Back' : 'पछाडि'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !fullName.trim()}
                    className="flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm tracking-wide shadow-xs hover:shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>{dict.onboarding.submitting}</span>
                      </>
                    ) : (
                      <>
                        <span>{dict.onboarding.submitButton}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Institutional Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. Kathmandu, Nepal.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Kathmandu Cadastral GIS Certified</span>
            <span>•</span>
            <span>100% Zero Brokerage P2P</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
