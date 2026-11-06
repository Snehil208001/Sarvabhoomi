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
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => onSwitchMode('signup')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            !isLoginFlow
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'en' ? 'New Account' : 'नयाँ दर्ता'}</span>
        </button>
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            isLoginFlow
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'en' ? 'Log In' : 'लगइन'}</span>
        </button>
      </div>

      {/* Header Copy */}
      <div className="space-y-1 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isLoginFlow
            ? lang === 'en'
              ? 'Log in with Mobile OTP'
              : 'मोबाइल नम्बरबाट लगइन गर्नुहोस्'
            : dict.phoneAuth.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
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
          <label htmlFor={phoneInputId} className="block text-xs font-bold text-slate-700 mb-1.5">
            {dict.phoneAuth.phoneLabel}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 text-xs font-mono font-bold">
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
              className={`w-full bg-slate-50 border rounded-xl pl-16 pr-10 py-3 text-sm font-mono font-semibold text-slate-900 tracking-wider transition-all placeholder:text-slate-400 focus:outline-none focus:bg-white min-h-touch ${
                phoneError
                  ? 'border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
              }`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          {/* Validation Error or Carrier Detection */}
          {phoneError ? (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{phoneError}</span>
            </p>
          ) : detectedCarrier ? (
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {detectedCarrier}
              </span>
              {userCheckPreview?.exists && (
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === 'en' ? 'Existing Account' : 'अवस्थित खाता'}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-1.5 text-[11px] text-slate-400">
              {dict.phoneAuth.phoneHint}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || phoneLocal.length < 10 || Boolean(phoneError)}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm min-h-touch"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          {dict.phoneAuth.termsNotice}
        </p>
      </form>
    </div>
  );
}
