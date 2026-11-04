'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Phone,
  ArrowRight,
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
  ChevronRight,
  Layers,
  Check,
  RotateCcw,
  Coins,
  Compass,
  Building,
  UserCheck,
} from 'lucide-react';
import {
  nepalPhoneRegex,
  onboardingSchema,
  DISTRICT_REGION_MAP,
  HILLY_DISTRICTS,
  TERAI_DISTRICTS,
  ALL_DISTRICTS,
  getRegionForDistrict,
  LAND_MEASUREMENT_SYSTEM_INFO,
  getAuthDict,
  UserIntent,
  PreferredRegion,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';

type AuthStep = 'PHONE' | 'OTP' | 'ONBOARDING';

const DEV_TEST_PHONE = '9841000000';
const DEV_TEST_OTP = '123456';

export default function AuthPage() {
  const router = useRouter();

  // Language state
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  // Active step machine
  const [step, setStep] = useState<AuthStep>('PHONE');

  // Step 1: Phone State
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);

  // Step 2: OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Onboarding State
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [userIntent, setUserIntent] = useState<UserIntent>('BUYER');
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
  useEffect(() => {
    let isMounted = true;
    async function checkAuthSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          setUserId(user.id);
          if (user.phone) {
            setPhone(cleanPhone(user.phone));
          }

          // Check if already onboarded
          let activeProfile = null;
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_onboarded, full_name, user_intent, preferred_district, preferred_region')
              .eq('id', user.id)
              .maybeSingle();
            activeProfile = profile;
          } catch {
            // Ignore PGRST error if table not yet migrated
          }

          if (!activeProfile?.is_onboarded) {
            const localStored =
              typeof window !== 'undefined' ? localStorage.getItem('sb_mock_profile') : null;
            if (localStored) {
              try {
                const parsed = JSON.parse(localStored);
                if (parsed.is_onboarded) {
                  activeProfile = parsed;
                }
              } catch {
                // Ignore parse error
              }
            }
          }

          if (activeProfile?.is_onboarded) {
            router.push('/dashboard');
            return;
          }

          if (activeProfile) {
            if (activeProfile.full_name) setFullName(activeProfile.full_name);
            if (activeProfile.user_intent) setUserIntent(activeProfile.user_intent);
            if (activeProfile.preferred_district) setSelectedDistrict(activeProfile.preferred_district);
            if (activeProfile.preferred_region) setPreferredRegion(activeProfile.preferred_region);
          }

          // Transition to Onboarding if already authenticated but not fully onboarded
          setStep('ONBOARDING');
        } else {
          // Check local mock test session if available
          const localMock = typeof window !== 'undefined' ? localStorage.getItem('sb_mock_session') : null;
          if (localMock && isMounted) {
            const parsed = JSON.parse(localMock);
            const mockProfile = localStorage.getItem('sb_mock_profile');
            if (mockProfile) {
              const p = JSON.parse(mockProfile);
              if (p.is_onboarded) {
                router.push('/dashboard');
                return;
              }
            }
          }
        }
      } catch (err) {
        // Silent catch for initial check
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

  // Pre-fill Dev Test Number
  const handlePreFillDevNumber = () => {
    handlePhoneInputChange(DEV_TEST_PHONE);
    setNotice({
      type: 'info',
      message:
        lang === 'en'
          ? 'Pre-filled Dev Test Number (9841000000). OTP will be 123456.'
          : 'डेभ टेस्ट नम्बर (९८४१००००००) भरियो। प्रमाणीकरण कोड १२३४५६ हुनेछ।',
    });
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
        // If developer test number is entered, provide seamless development fallback
        if (cleaned === DEV_TEST_PHONE) {
          setNotice({
            type: 'info',
            message:
              lang === 'en'
                ? 'Dev Test Mode Active: Proceeding to OTP step with test OTP 123456.'
                : 'डेभ टेस्ट मोड सक्रिय: टेस्ट कोड १२३४५६ सँग अगाडि बढ्दै।',
          });
          setResendTimer(30);
          setCanResend(false);
          setStep('OTP');
          return;
        }

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
      // In case of local placeholder environment with dev test number
      if (cleaned === DEV_TEST_PHONE) {
        setNotice({
          type: 'info',
          message:
            lang === 'en'
              ? 'Dev Test Mode: Proceeding with test credentials (OTP: 123456).'
              : 'डेभ टेस्ट मोड: १२३४५६ कोड प्रयोग गर्नुहोस्।',
        });
        setResendTimer(30);
        setCanResend(false);
        setStep('OTP');
      } else {
        const errorMsg = err instanceof Error ? err.message : dict.phoneAuth.invalidPhoneError;
        setNotice({
          type: 'error',
          message: errorMsg,
        });
      }
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

    // Auto-advance to next box if char was entered
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

  // Pre-fill Dev Test OTP
  const handlePreFillDevOtp = () => {
    setOtpDigits(['1', '2', '3', '4', '5', '6']);
    setOtpError(null);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    const cleaned = cleanPhone(phone);
    setIsSubmitting(true);
    setNotice(null);

    try {
      await supabase.auth.signInWithOtp({
        phone: `+977${cleaned}`,
      });
      setNotice({
        type: 'success',
        message:
          lang === 'en'
            ? 'A fresh 6-digit OTP has been sent via SMS.'
            : 'नयाँ ६-अङ्कको OTP कोड सफलतापूर्वक पठाइयो।',
      });
      setResendTimer(30);
      setCanResend(false);
    } catch {
      setNotice({
        type: 'info',
        message:
          lang === 'en'
            ? 'Fresh code requested. Use 123456 for test number.'
            : 'नयाँ कोड अनुरोध गरियो। टेस्टको लागि १२३४५६ प्रयोग गर्नुहोस्।',
      });
      setResendTimer(30);
      setCanResend(false);
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
        // Fallback for Dev Test Number + 123456 in local / mock environments
        if (cleaned === DEV_TEST_PHONE && token === DEV_TEST_OTP) {
          const mockUid = '00000000-0000-0000-0000-000000000001';
          setUserId(mockUid);
          localStorage.setItem(
            'sb_mock_session',
            JSON.stringify({
              user: { id: mockUid, phone: fullPhone },
              created_at: new Date().toISOString(),
            })
          );

          // Check if mock profile is onboarded
          const storedMock = localStorage.getItem('sb_mock_profile');
          if (storedMock) {
            const p = JSON.parse(storedMock);
            if (p.is_onboarded) {
              router.push('/dashboard');
              return;
            }
          }

          setNotice({
            type: 'success',
            message:
              lang === 'en'
                ? 'Mobile verified! Please set up your investor profile.'
                : 'मोबाइल प्रमाणीकरण सफल! कृपया आफ्नो प्रोफाइल पूरा गर्नुहोस्।',
          });
          setStep('ONBOARDING');
          return;
        }

        setOtpError(error.message || dict.otp.invalidOtpError);
        return;
      }

      const verifiedUser = data?.user;
      if (verifiedUser) {
        setUserId(verifiedUser.id);

        // Query profiles table for existing onboarding status
        let activeProfile = null;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_onboarded, full_name, user_intent, preferred_district, preferred_region')
            .eq('id', verifiedUser.id)
            .maybeSingle();
          activeProfile = profile;
        } catch {
          // Ignore if table not yet migrated
        }

        if (!activeProfile?.is_onboarded) {
          const localStored =
            typeof window !== 'undefined' ? localStorage.getItem('sb_mock_profile') : null;
          if (localStored) {
            try {
              const parsed = JSON.parse(localStored);
              if (parsed.is_onboarded) {
                activeProfile = parsed;
              }
            } catch {
              // Ignore
            }
          }
        }

        if (activeProfile?.is_onboarded) {
          router.push('/dashboard');
          return;
        }

        if (activeProfile) {
          if (activeProfile.full_name) setFullName(activeProfile.full_name);
          if (activeProfile.user_intent) setUserIntent(activeProfile.user_intent);
          if (activeProfile.preferred_district) setSelectedDistrict(activeProfile.preferred_district);
          if (activeProfile.preferred_region) setPreferredRegion(activeProfile.preferred_region);
        }

        setNotice({
          type: 'success',
          message:
            lang === 'en'
              ? 'Phone verified! Complete your profile to claim 15 free contact credits.'
              : 'फोन प्रमाणीकरण सम्पन्न! १५ निःशुल्क क्रेडिट प्राप्त गर्न प्रोफाइल भर्नुहोस्।',
        });
        setStep('ONBOARDING');
      }
    } catch (err: unknown) {
      if (cleaned === DEV_TEST_PHONE && token === DEV_TEST_OTP) {
        const mockUid = '00000000-0000-0000-0000-000000000001';
        setUserId(mockUid);
        localStorage.setItem(
          'sb_mock_session',
          JSON.stringify({
            user: { id: mockUid, phone: fullPhone },
            created_at: new Date().toISOString(),
          })
        );
        setStep('ONBOARDING');
      } else {
        const errorMsg = err instanceof Error ? err.message : dict.otp.invalidOtpError;
        setOtpError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Handle District Selection & Auto-Detection of Measurement System
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

  // Step 3: Complete Onboarding Submit Handler
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using Zod onboardingSchema
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
      // Determine user ID from auth or mock session
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetUserId = user?.id || null;
      }

      if (!targetUserId) {
        // Fallback for dev environment
        targetUserId = '00000000-0000-0000-0000-000000000001';
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
        // In local mock mode, persist to localStorage so dashboard can display seamlessly
        localStorage.setItem('sb_mock_profile', JSON.stringify(profileData));
        localStorage.setItem(
          'sb_mock_subscription',
          JSON.stringify({
            user_id: targetUserId,
            plan_tier: 'LAUNCH_PROMO',
            credits_remaining: 15,
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          })
        );
      } else {
        // Ensure mock cache reflects live upsert
        localStorage.setItem('sb_mock_profile', JSON.stringify(profileData));
      }

      // Redirect immediately to /dashboard
      router.push('/dashboard');
    } catch {
      // Graceful fallback redirect
      const profileFallback = {
        id: userId || '00000000-0000-0000-0000-000000000001',
        phone_np: fullPhone,
        full_name: fullName.trim(),
        user_intent: userIntent,
        preferred_region: preferredRegion,
        preferred_district: selectedDistrict,
        preferred_lang: lang,
        is_onboarded: true,
      };
      localStorage.setItem('sb_mock_profile', JSON.stringify(profileFallback));
      router.push('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeMeasurement = LAND_MEASUREMENT_SYSTEM_INFO[preferredRegion];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* Ambient background glow & institutional grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-emerald-600/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none -z-20" />

      {/* Institutional Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Sarvabhoomi Emblem & Brand Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-300/40 select-none">
                स
              </div>
              <div className="absolute -inset-0.5 rounded-xl bg-emerald-500/20 blur group-hover:bg-emerald-500/30 transition-all -z-10" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                  {dict.brand.name}
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Institutional P2P
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block line-clamp-1 max-w-lg">
                {dict.brand.tagline}
              </p>
            </div>
          </div>

          {/* Instant 1-Click Bilingual Toggle & Status */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLang}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/90 hover:border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm shadow-black/40 group active:scale-95"
              aria-label="Toggle Interface Language"
            >
              <Globe2 className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="font-semibold tracking-wide">
                {lang === 'en' ? 'नेपाली (NE)' : 'English (EN)'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {/* Unified 3-Step Container */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">
          {/* Top 3-Step Progress Bar */}
          <div className="border-b border-slate-800/80 bg-slate-950/60 p-4 sm:px-6">
            <div className="flex items-center justify-between relative">
              {/* Connecting Progress Lines */}
              <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
              <div
                className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-500 -z-0"
                style={{
                  width:
                    step === 'PHONE' ? '0%' : step === 'OTP' ? '50%' : '100%',
                }}
              />

              {/* Step 1: PHONE */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 'PHONE'
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                      : step === 'OTP' || step === 'ONBOARDING'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {step === 'OTP' || step === 'ONBOARDING' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    '1'
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium tracking-wide ${
                    step === 'PHONE' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {lang === 'en' ? 'Mobile' : 'मोबाइल'}
                </span>
              </div>

              {/* Step 2: OTP */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 'OTP'
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                      : step === 'ONBOARDING'
                      ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {step === 'ONBOARDING' ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    '2'
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium tracking-wide ${
                    step === 'OTP' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {lang === 'en' ? 'OTP Code' : 'प्रमाणीकरण'}
                </span>
              </div>

              {/* Step 3: ONBOARDING */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 'ONBOARDING'
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md shadow-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-[11px] font-medium tracking-wide ${
                    step === 'ONBOARDING' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {lang === 'en' ? 'Profile' : 'प्रोफाइल'}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Notices */}
          {notice && (
            <div
              className={`p-3.5 mx-6 mt-6 rounded-xl text-xs flex items-start gap-2.5 border ${
                notice.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : notice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-200'
              }`}
            >
              {notice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{notice.message}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: NEPAL MOBILE NUMBER INPUT */}
          {/* ============================================================ */}
          {step === 'PHONE' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{dict.promo.claimBadge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {dict.phoneAuth.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  {dict.phoneAuth.subtitle}
                </p>
              </div>

              {/* Dev Test Helper Note Card */}
              <div className="mb-6 p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <span className="text-emerald-400 font-semibold font-mono">🧪 Dev Test:</span>
                  <span className="font-mono text-white">9841000000</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">OTP: <span className="font-mono text-emerald-400">123456</span></span>
                </div>
                <button
                  type="button"
                  onClick={handlePreFillDevNumber}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors whitespace-nowrap"
                >
                  {lang === 'en' ? 'Quick Fill' : 'स्वतः भर्नुहोस्'}
                </button>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor={phoneInputId}
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                    >
                      {dict.phoneAuth.phoneLabel}
                    </label>
                    {detectedCarrier && (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        {detectedCarrier}
                      </span>
                    )}
                  </div>

                  <div className="relative flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                    {/* Fixed Nepal Flag & Prefix */}
                    <div className="bg-slate-900 px-3.5 flex items-center border-r border-slate-800 text-sm font-mono text-slate-200 select-none gap-1.5 shrink-0">
                      <span className="text-base">🇳🇵</span>
                      <span className="font-semibold tracking-wider text-emerald-400">+977</span>
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
                      className="w-full bg-transparent px-4 py-3.5 text-base sm:text-lg font-mono text-white placeholder:text-slate-600 focus:outline-none tracking-widest"
                    />

                    <div className="flex items-center pr-3.5 text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                  </div>

                  {phoneError ? (
                    <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
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
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
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
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-400">
                  <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
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
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>SMS Verification</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setNotice(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{dict.otp.changePhone}</span>
                  </button>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {dict.otp.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  {dict.otp.subtitle(phone)}
                </p>
              </div>

              {/* Dev Test Helper Note Card for OTP */}
              <div className="mb-6 p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                  <span className="text-emerald-400 font-semibold">🧪 Dev OTP:</span>
                  <span className="text-white font-bold tracking-widest">123456</span>
                </div>
                <button
                  type="button"
                  onClick={handlePreFillDevOtp}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-medium border border-emerald-500/30 transition-colors whitespace-nowrap"
                >
                  {lang === 'en' ? 'Fill 123456' : '१२३४५६ भर्नुहोस्'}
                </button>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 text-center">
                    {dict.otp.otpLabel}
                  </label>

                  {/* 6 Individual High-Contrast Digit Boxes */}
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
                        className="w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold text-white bg-slate-950/90 border border-slate-800 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 focus:outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="mt-3 text-xs text-rose-400 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {otpError}
                    </p>
                  )}
                </div>

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>{dict.otp.resendPrompt}</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
                    >
                      {dict.otp.resendButton}
                    </button>
                  ) : (
                    <span className="text-slate-500 font-mono">
                      {dict.otp.resendInSeconds(resendTimer)}
                    </span>
                  )}
                </div>

                {/* Submit Verify OTP Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
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
          {/* STEP 3: NEPAL-SPECIFIC ONBOARDING */}
          {/* ============================================================ */}
          {step === 'ONBOARDING' && (
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Profile & Measurement Setup</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {dict.onboarding.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  {dict.onboarding.subtitle}
                </p>
              </div>

              <form onSubmit={handleCompleteOnboarding} className="space-y-6">
                {/* 1. Full Legal Name (as per Citizenship / Lalpurja) */}
                <div>
                  <label
                    htmlFor={nameInputId}
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
                  >
                    {dict.onboarding.fullNameLabel}
                    <span className="text-slate-500 text-[11px] normal-case ml-1">
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
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all text-sm"
                  />
                  {onboardingErrors.fullName && (
                    <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {onboardingErrors.fullName}
                    </p>
                  )}
                </div>

                {/* 2. Interactive Role / Objective Selector Cards */}
                <div>
                  <div className="mb-2.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {dict.onboarding.intentLabel}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {dict.onboarding.intentSubtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Role 1: BUYER */}
                    <button
                      type="button"
                      onClick={() => setUserIntent('BUYER')}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        userIntent === 'BUYER'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            userIntent === 'BUYER'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Home className="w-4 h-4" />
                        </div>
                        {userIntent === 'BUYER' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white mb-0.5">
                          {dict.onboarding.intents.BUYER.title}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                          {lang === 'en' ? '0% Commission' : '०% कमिसन'}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {dict.onboarding.intents.BUYER.description}
                        </div>
                      </div>
                    </button>

                    {/* Role 2: OWNER */}
                    <button
                      type="button"
                      onClick={() => setUserIntent('OWNER')}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        userIntent === 'OWNER'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            userIntent === 'OWNER'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Tag className="w-4 h-4" />
                        </div>
                        {userIntent === 'OWNER' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white mb-0.5">
                          {dict.onboarding.intents.OWNER.title}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                          {lang === 'en' ? '100% Free Listing' : '१००% निःशुल्क सूची'}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {dict.onboarding.intents.OWNER.description}
                        </div>
                      </div>
                    </button>

                    {/* Role 3: INVESTOR_NRN */}
                    <button
                      type="button"
                      onClick={() => setUserIntent('INVESTOR_NRN')}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        userIntent === 'INVESTOR_NRN'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            userIntent === 'INVESTOR_NRN'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        {userIntent === 'INVESTOR_NRN' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white mb-0.5">
                          {dict.onboarding.intents.INVESTOR_NRN.title}
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                          {lang === 'en' ? 'Wealth Tracker' : 'पुँजी वृद्धि ट्र्याकर'}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {dict.onboarding.intents.INVESTOR_NRN.description}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Primary District Selector (Grouped Hilly/Valley vs Terai) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor={districtSelectId}
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
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
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white appearance-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all text-sm"
                    >
                      <optgroup label="🏔️ Hilly & Valley Districts (पहाड तथा उपत्यका - Ropani System)">
                        {HILLY_DISTRICTS.map((d) => (
                          <option key={d} value={d} className="bg-slate-950 text-white">
                            {d}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="🌾 Terai & Inner Terai Districts (तराई तथा भित्री मधेस - Bigha System)">
                        {TERAI_DISTRICTS.map((d) => (
                          <option key={d} value={d} className="bg-slate-950 text-white">
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* 4. Default Land Measurement System & 1-Click Override */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      {dict.onboarding.regionLabel}
                    </label>
                    {regionAutoDetected ? (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {lang === 'en' ? 'Auto-Detected' : 'स्वतः छनोट'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
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
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🏔️</span>
                          <span>{lang === 'en' ? 'Hilly / Valley' : 'पहाड / उपत्यका'}</span>
                        </span>
                        {preferredRegion === 'HILLY' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-emerald-400 mb-1">
                        {lang === 'en' ? 'Ropani - Aana - Paisa - Daam' : 'रोपनी - आना - पैसा - दाम'}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {dict.onboarding.regions.HILLY.description}
                      </div>
                    </button>

                    {/* Terai Option */}
                    <button
                      type="button"
                      onClick={() => handleManualRegionOverride('TERAI')}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        preferredRegion === 'TERAI'
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🌾</span>
                          <span>{lang === 'en' ? 'Terai Plains' : 'तराई / भित्री मधेस'}</span>
                        </span>
                        {preferredRegion === 'TERAI' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-emerald-400 mb-1">
                        {lang === 'en' ? 'Bigha - Kattha - Dhur' : 'बिघा - कट्ठा - धुर'}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {dict.onboarding.regions.TERAI.description}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Promotional Credit Trigger Callout Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/20 border border-emerald-500/30 flex items-start gap-3 shadow-lg">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{dict.promo.claimTitle}</span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        15 CREDITS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {dict.promo.claimDescription}
                    </p>
                  </div>
                </div>

                {/* Submit Onboarding Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !fullName.trim()}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{dict.onboarding.submitting}</span>
                    </>
                  ) : (
                    <>
                      <span>{dict.onboarding.submitButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Institutional Dark Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. Kathmandu, Nepal.
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Kathmandu Cadastral GIS Certified</span>
            <span>•</span>
            <span>100% Zero Brokerage P2P</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

