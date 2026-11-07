'use client';

import React from 'react';
import { Phone, ArrowRight, ShieldCheck, Sparkles, UserCheck, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { AuthDictionary } from '@sarvabhoomi/shared';

interface PhoneStepProps {
  phoneLocal: string;
  detectedCarrier: string | null;
  phoneError: string | null;
  isSubmitting: boolean;
  authMode: 'login' | 'signup';
  isExistingUser: boolean;
  userCheckPreview: {
    exists: boolean;
    isOnboarded: boolean;
    userIntent: string | null;
  } | null;
  lang: 'en' | 'ne';
  dict: AuthDictionary;
  phoneInputId: string;
  onPhoneChange: (val: string) => void;
  onSendOtp: (e: React.FormEvent) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

export function PhoneStep({
  phoneLocal,
  detectedCarrier,
  phoneError,
  isSubmitting,
  authMode,
  isExistingUser,
  userCheckPreview,
  lang,
  dict,
  phoneInputId,
  onPhoneChange,
  onSendOtp,
  onSwitchMode,
}: PhoneStepProps) {
  const isLoginFlow = authMode === 'login' || isExistingUser;

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => onSwitchMode('signup')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            !isLoginFlow
              ? 'bg-gold text-black shadow-card font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'New Account' : 'नयाँ दर्ता'}</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            isLoginFlow
              ? 'bg-gold text-black shadow-card font-black'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'Log In' : 'लगइन'}</span>
        </button>
      </div>

      {/* Header Copy */}
      <div className="space-y-1 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {isLoginFlow
            ? lang === 'en'
              ? 'Log in with Mobile OTP'
              : 'मोबाइल नम्बरबाट लगइन गर्नुहोस्'
            : dict.phoneAuth.title}
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto font-medium">
          {isLoginFlow
            ? lang === 'en'
              ? 'Enter your registered Nepal mobile number for instant verification.'
              : 'प्रमाणीकरण कोड प्राप्त गर्न आफ्नो दर्ता भएको नेपाली नम्बर प्रविष्ट गर्नुहोस्।'
            : dict.phoneAuth.signupSubtitle}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={onSendOtp} className="space-y-4">
        <div>
          <label htmlFor={phoneInputId} className="block text-xs font-bold text-white mb-1.5">
            {dict.phoneAuth.phoneLabel}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gold text-xs font-mono font-bold">
              +977
            </div>
            <input
              id={phoneInputId}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phoneLocal}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="98XXXXXXXX"
              maxLength={10}
              autoFocus
              className={`w-full bg-black/60 border rounded-2xl pl-16 pr-10 py-3.5 text-sm font-mono font-bold text-white tracking-wider transition-all placeholder:text-white/40 focus:outline-none min-h-touch ${
                phoneError
                  ? 'border-gold/60 focus:border-gold focus:ring-1 focus:ring-gold'
                  : 'border-white/20 focus:border-gold focus:ring-1 focus:ring-gold'
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gold">
              <Phone className="w-4 h-4 text-gold" />
            </div>
          </div>

          {/* Validation Error or Carrier Detection */}
          {phoneError ? (
            <p className="mt-1.5 text-xs text-gold flex items-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{phoneError}</span>
            </p>
          ) : detectedCarrier ? (
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-gold font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                {detectedCarrier}
              </span>
              {userCheckPreview?.exists && (
                <span className="text-white/70 font-semibold flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-gold" />
                  {lang === 'en' ? 'Existing Account' : 'अवस्थित खाता'}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-white/50 font-medium">
              {dict.phoneAuth.phoneHint}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || phoneLocal.length < 10 || Boolean(phoneError)}
          className="w-full bg-gold hover:bg-gold/90 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3.5 px-4 rounded-2xl shadow-card transition-all flex items-center justify-center gap-2 text-sm min-h-touch"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>{dict.phoneAuth.sendingOtp}</span>
            </>
          ) : (
            <>
              <span>{dict.phoneAuth.sendOtpButton}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Terms Notice */}
        <p className="text-[11px] text-white/50 text-center leading-relaxed font-medium">
          {dict.phoneAuth.termsNotice}
        </p>
      </form>
    </div>
  );
}

