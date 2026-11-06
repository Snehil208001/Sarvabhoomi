'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { AuthDictionary } from '@sarvabhoomi/shared';

interface OtpStepProps {
  phoneLocal: string;
  otpDigits: string[];
  otpError: string | null;
  isSubmitting: boolean;
  resendTimer: number;
  canResend: boolean;
  lang: 'en' | 'ne';
  dict: AuthDictionary;
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpDigitChange: (index: number, val: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
  onResendOtp: () => void;
  onChangePhone: () => void;
}

export function OtpStep({
  phoneLocal,
  otpDigits,
  otpError,
  isSubmitting,
  resendTimer,
  canResend,
  lang,
  dict,
  otpInputRefs,
  onOtpDigitChange,
  onOtpKeyDown,
  onOtpPaste,
  onVerifyOtp,
  onResendOtp,
  onChangePhone,
}: OtpStepProps) {
  const isOtpComplete = otpDigits.every((d) => d.length === 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {dict.otp.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
          {dict.otp.subtitle(phoneLocal)}
        </p>
        <button
          type="button"
          onClick={onChangePhone}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{dict.otp.changePhone}</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onVerifyOtp} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 text-center mb-3">
            {dict.otp.otpLabel}
          </label>
          <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={onOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => onOtpDigitChange(idx, e.target.value)}
                onKeyDown={(e) => onOtpKeyDown(idx, e)}
                className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border bg-slate-50 text-slate-900 transition-all focus:outline-none focus:bg-white focus:ring-2 ${
                  digit
                    ? 'border-emerald-600 bg-emerald-50/40 text-emerald-900'
                    : 'border-slate-300'
                } ${
                  otpError
                    ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-100'
                    : 'focus:border-emerald-600 focus:ring-emerald-100'
                }`}
              />
            ))}
          </div>

          {otpError && (
            <p className="mt-2.5 text-xs text-rose-600 text-center flex items-center justify-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{otpError}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isOtpComplete}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm min-h-touch"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{dict.otp.verifying}</span>
            </>
          ) : (
            <>
              <span>{dict.otp.verifyButton}</span>
              <CheckCircle2 className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend Code Area */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">
            {dict.otp.resendPrompt}
          </p>
          {canResend ? (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={isSubmitting}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{dict.otp.resendButton}</span>
            </button>
          ) : (
            <span className="text-xs font-mono font-medium text-slate-400">
              {dict.otp.resendInSeconds(resendTimer)}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
