'use client';

import React, { useState, useEffect, useId, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe2, Sparkles, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  nepalPhoneRegex,
  getAuthDict,
  UserRole,
} from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { PhoneStep } from '@/components/auth/PhoneStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { RoleStep } from '@/components/auth/RoleStep';

export type AuthStep = 'PHONE' | 'OTP' | 'ROLE_SELECT';
export type AuthMode = 'login' | 'signup';

interface StepItem {
  id: AuthStep;
  num: number;
  labelEn: string;
  labelNe: string;
}

const SIGNUP_STEPS: StepItem[] = [
  { id: 'PHONE', num: 1, labelEn: 'Mobile', labelNe: 'मोबाइल' },
  { id: 'OTP', num: 2, labelEn: 'OTP', labelNe: 'ओटीपी' },
  { id: 'ROLE_SELECT', num: 3, labelEn: 'Select Role', labelNe: 'भूमिका' },
];

const LOGIN_STEPS: StepItem[] = [
  { id: 'PHONE', num: 1, labelEn: 'Mobile', labelNe: 'मोबाइल' },
  { id: 'OTP', num: 2, labelEn: 'Verify & Sign In', labelNe: 'लगइन प्रमाणीकरण' },
];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode: 'login' or 'signup' (initialized from URL ?mode=login / ?mode=signup)
  const [authMode, setAuthMode] = useState<AuthMode>('signup');

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'login' || modeParam === 'signup') {
      setAuthMode(modeParam);
    }
  }, [searchParams]);

  // Language state (defaults to English, toggles to Nepali)
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  // Active step machine: strictly initialized to 'PHONE'
  const [step, setStep] = useState<AuthStep>('PHONE');

  // Step 1: Phone State
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [userCheckPreview, setUserCheckPreview] = useState<{
    exists: boolean;
    isOnboarded: boolean;
    userIntent: string | null;
  } | null>(null);

  // Step 2: OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Role Selection State
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('RENTER');
  const [isRoleMigration, setIsRoleMigration] = useState<boolean>(false);

  // Global loading and feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  const phoneInputId = useId();

  // Clean raw phone input (strip +977, 977, spaces, hyphens)
  const cleanPhone = (val: string) => {
    return val.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, '');
  };

  // Check initial Supabase authentication status on mount
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
            setPhoneLocal(cleanPhone(user.phone));
          }

          // Check if already onboarded in public.profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_onboarded, user_role')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.is_onboarded) {
            if (!profile.user_role) {
              // Existing onboarded user without user_role set: show one-time role selection
              setIsRoleMigration(true);
              setStep('ROLE_SELECT');
              return;
            }
            if (profile.user_role === 'RENTER') {
              router.push('/search');
            } else {
              router.push('/dashboard');
            }
            return;
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

  // Debounced check to detect user registration & onboarding status while typing
  useEffect(() => {
    const cleaned = cleanPhone(phoneLocal);
    if (!nepalPhoneRegex.test(cleaned)) {
      setUserCheckPreview(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-user?phone=${cleaned}`);
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json.success && json.data) {
            setUserCheckPreview({
              exists: json.data.exists,
              isOnboarded: json.data.isOnboarded,
              userIntent: json.data.userIntent,
            });
            const userExists = Boolean(json.data.exists && json.data.isOnboarded);
            setIsExistingUser(userExists);
          }
        }
      } catch (err) {
        console.warn('Debounced user status check warning:', err);
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [phoneLocal]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'ne' : 'en'));
  };

  const handleSwitchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setNotice(null);
    setPhoneError(null);
    setOtpError(null);
  };

  const handlePhoneInputChange = (raw: string) => {
    const cleaned = cleanPhone(raw);
    setPhoneLocal(cleaned);

    if (!cleaned) {
      setPhoneError(null);
      setDetectedCarrier(null);
      setUserCheckPreview(null);
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
      setUserCheckPreview(null);
      if (cleaned.length === 10) {
        setPhoneError(dict.phoneAuth.invalidPhoneError);
      } else {
        setPhoneError(null);
      }
    }
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cleanPhone(phoneLocal);

    if (!nepalPhoneRegex.test(cleaned)) {
      setPhoneError(dict.phoneAuth.invalidPhoneError);
      return;
    }

    setPhoneError(null);
    setIsSubmitting(true);
    setNotice(null);

    const fullPhone = `+977${cleaned}`;

    try {
      let resolvedExisting = false;
      try {
        const checkRes = await fetch('/api/auth/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: fullPhone }),
        });

        if (checkRes.ok) {
          const checkJson = await checkRes.json();
          if (checkJson.success && checkJson.data) {
            const { exists, isOnboarded } = checkJson.data;
            resolvedExisting = Boolean(exists && isOnboarded);
            setIsExistingUser(resolvedExisting);
            if (resolvedExisting) {
              setAuthMode('login');
            } else {
              setAuthMode('signup');
            }
          }
        }
      } catch (checkErr) {
        console.warn('Pre-flight check warning:', checkErr);
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: {
          shouldCreateUser: !resolvedExisting,
        },
      });

      if (error) {
        setNotice({
          type: 'error',
          message: error.message || dict.phoneAuth.invalidPhoneError,
        });
        return;
      }

      let successMsg: string;
      if (resolvedExisting) {
        successMsg =
          lang === 'en'
            ? `Welcome back! Account found. 6-digit login code sent to ${fullPhone}.`
            : `स्वागत छ! दर्ता भएको खाता भेटियो। लगइन कोड ${fullPhone} मा पठाइयो।`;
      } else {
        successMsg =
          lang === 'en'
            ? `New account verification: 6-digit OTP code sent to ${fullPhone}.`
            : `नयाँ खाता प्रमाणीकरण: ६-अङ्कको ओटीपी ${fullPhone} मा पठाइयो।`;
      }

      setNotice({
        type: 'success',
        message: successMsg,
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

  // STEP 2: OTP digit handlers
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setOtpError(null);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

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

  const handleResendOtp = async () => {
    if (!canResend) return;
    const cleaned = cleanPhone(phoneLocal);
    setIsSubmitting(true);
    setNotice(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+977${cleaned}`,
        options: {
          shouldCreateUser: !isExistingUser,
        },
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

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otpDigits.join('');
    const cleaned = cleanPhone(phoneLocal);

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

        // Fetch profile to verify role and onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_onboarded, user_role')
          .eq('id', verifiedUser.id)
          .maybeSingle();

        if (profile?.is_onboarded) {
          if (!profile.user_role) {
            setIsRoleMigration(true);
            setStep('ROLE_SELECT');
            return;
          }
          if (profile.user_role === 'RENTER') {
            router.push('/search');
          } else {
            router.push('/dashboard');
          }
          return;
        }

        // New user or pending role selection: go directly to Step 3 (Role)
        setNotice({
          type: 'success',
          message:
            lang === 'en'
              ? 'Phone verified! Select your role to get started.'
              : 'फोन प्रमाणीकरण सम्पन्न! अगाडि बढ्न आफ्नो भूमिका छनोट गर्नुहोस्।',
        });
        setStep('ROLE_SELECT');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : dict.otp.invalidOtpError;
      setOtpError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 3: Confirm Role & Complete Signup
  const handleConfirmRole = async () => {
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

    setIsSubmitting(true);
    setNotice(null);

    const cleaned = cleanPhone(phoneLocal);
    const fullPhone = `+977${cleaned}`;

    try {
      if (isRoleMigration) {
        // Role migration for existing user
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_role: userRole,
            user_intent: (userRole === 'OWNER' ? 'OWNER' : 'BUYER') as 'OWNER' | 'BUYER',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (updateError) {
          setNotice({
            type: 'error',
            message: updateError.message || 'Failed to update user role.',
          });
          return;
        }
      } else {
        // New user signup: Upsert profile immediately without blocking profile form
        const profileData = {
          id: targetUserId,
          phone_np: fullPhone,
          full_name: null,
          user_role: userRole,
          user_intent: (userRole === 'OWNER' ? 'OWNER' : 'BUYER') as 'OWNER' | 'BUYER',
          preferred_region: null,
          preferred_district: null,
          preferred_lang: lang,
          is_onboarded: true,
          profile_completed: false,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });

        if (upsertError) {
          setNotice({
            type: 'error',
            message: upsertError.message || 'Failed to setup account. Please try again.',
          });
          return;
        }
      }

      // Instant destination redirect based on role
      if (userRole === 'RENTER') {
        router.push('/search');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Error saving role selection.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoginFlow = authMode === 'login' || isExistingUser;
  const activeSteps = isLoginFlow ? LOGIN_STEPS : SIGNUP_STEPS;

  const getStepIndex = (s: AuthStep) => {
    switch (s) {
      case 'PHONE':
        return 0;
      case 'OTP':
        return 1;
      case 'ROLE_SELECT':
        return 2;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(step);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between font-sans selection:bg-gold selection:text-black">
      {/* Top Header */}
      <header className="border-b border-gold/30 bg-black/95 backdrop-blur-md sticky top-0 z-40 shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gold flex items-center justify-center font-black text-black text-xl sm:text-2xl shadow-card select-none">
              स
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-white text-base sm:text-lg">
                  {dict.brand.name}
                </span>
                <span className="hidden md:inline-flex px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-gold/20 text-gold border border-gold/30">
                  0% Brokerage
                </span>
              </div>
              <p className="text-xs text-white/70 hidden sm:block line-clamp-1 max-w-lg font-medium">
                {dict.brand.tagline}
              </p>
            </div>
          </div>

          {/* Bilingual Toggle */}
          <button
            type="button"
            onClick={handleToggleLang}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-all shadow-subtle active:scale-97"
            aria-label="Toggle Interface Language"
          >
            <Globe2 className="w-4 h-4 text-gold" />
            <span className="tracking-wide">
              {lang === 'en' ? 'नेपाली (NE)' : 'English (EN)'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
        <div className="bg-white/[0.06] border border-gold/30 rounded-3xl shadow-card overflow-hidden">
          {/* Top Progress Bar */}
          <div className="border-b border-white/10 bg-black/40 p-4 sm:px-6">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />
              <div
                className="absolute top-1/2 left-6 -translate-y-1/2 h-0.5 bg-gold transition-all duration-500 -z-0"
                style={{
                  width: `${(Math.min(currentStepIdx, activeSteps.length - 1) / Math.max(activeSteps.length - 1, 1)) * 100}%`,
                }}
              />

              {activeSteps.map((s, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;

                return (
                  <div key={s.id} className="flex flex-col items-center gap-1.5 relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isActive
                          ? 'bg-gold text-black ring-4 ring-gold/20 shadow-card scale-110'
                          : isCompleted
                          ? 'bg-gold/20 text-gold border border-gold/40'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : s.num}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] tracking-tight font-bold ${
                        isActive
                          ? 'text-gold font-black'
                          : isCompleted
                          ? 'text-white/80'
                          : 'text-white/40'
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
              className={`p-4 mx-6 mt-6 rounded-2xl text-xs flex items-start gap-2.5 border ${
                notice.type === 'error'
                  ? 'bg-white/5 border-gold/40 text-white'
                  : notice.type === 'success'
                  ? 'bg-gold text-black border-gold'
                  : 'bg-white/5 border-white/10 text-white'
              }`}
            >
              {notice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              ) : notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed font-semibold">{notice.message}</div>
            </div>
          )}

          {/* Step 1: Phone */}
          {step === 'PHONE' && (
            <div className="p-6 sm:p-8">
              <PhoneStep
                phoneLocal={phoneLocal}
                detectedCarrier={detectedCarrier}
                phoneError={phoneError}
                isSubmitting={isSubmitting}
                authMode={authMode}
                isExistingUser={isExistingUser}
                userCheckPreview={userCheckPreview}
                lang={lang}
                dict={dict}
                phoneInputId={phoneInputId}
                onPhoneChange={handlePhoneInputChange}
                onSendOtp={handleSendOtp}
                onSwitchMode={handleSwitchMode}
              />
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 'OTP' && (
            <div className="p-6 sm:p-8">
              <OtpStep
                phoneLocal={phoneLocal}
                otpDigits={otpDigits}
                otpError={otpError}
                isSubmitting={isSubmitting}
                resendTimer={resendTimer}
                canResend={canResend}
                lang={lang}
                dict={dict}
                otpInputRefs={otpInputRefs}
                onOtpDigitChange={handleOtpDigitChange}
                onOtpKeyDown={handleOtpKeyDown}
                onOtpPaste={handleOtpPaste}
                onVerifyOtp={handleVerifyOtp}
                onResendOtp={handleResendOtp}
                onChangePhone={() => {
                  setStep('PHONE');
                  setOtpDigits(['', '', '', '', '', '']);
                  setOtpError(null);
                }}
              />
            </div>
          )}

          {/* Step 3: Role Selection */}
          {step === 'ROLE_SELECT' && (
            <div className="p-6 sm:p-8">
              <RoleStep
                selectedRole={userRole}
                isRoleMigration={isRoleMigration}
                isSubmitting={isSubmitting}
                lang={lang}
                dict={dict}
                onSelectRole={(r) => setUserRole(r)}
                onConfirmRole={handleConfirmRole}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/30 bg-black py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/70 font-medium">
          <p>© 2026 Sarvabhoomi Capital & Investment Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gold font-bold">
            <span>0% Broker Commission</span>
            <span>•</span>
            <span>Direct P2P Rentals</span>
            <span>•</span>
            <span>All 77 Districts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
