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
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {dict.otp.title}
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto font-medium">
          {dict.otp.subtitle(phoneLocal)}
        </p>
        <button
          type="button"
          onClick={onChangePhone}
          className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1 mt-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{dict.otp.changePhone}</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={onVerifyOtp} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-white text-center mb-3">
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
                className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-black font-mono rounded-2xl border-2 bg-black/60 text-white transition-all focus:outline-none focus:ring-1 focus:ring-gold ${
                  digit
                    ? 'border-gold bg-black/80 text-gold'
                    : 'border-white/20'
                } ${
                  otpError
                    ? 'border-gold/60 focus:border-gold'
                    : 'focus:border-gold'
                }`}
              />
            ))}
          </div>

          {otpError && (
            <p className="mt-2.5 text-xs text-gold text-center flex items-center justify-center gap-1 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{otpError}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !isOtpComplete}
          className="w-full bg-gold hover:bg-gold/90 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-3.5 px-4 rounded-2xl shadow-card transition-all flex items-center justify-center gap-2 text-sm min-h-touch"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
        <div className="text-center pt-2 border-t border-white/10">
          <p className="text-xs text-white/70 mb-1 font-medium">
            {dict.otp.resendPrompt}
          </p>
          {canResend ? (
            <button
              type="button"
              onClick={onResendOtp}
              disabled={isSubmitting}
              className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{dict.otp.resendButton}</span>
            </button>
          ) : (
            <span className="text-xs font-mono font-bold text-white/60">
              {dict.otp.resendInSeconds(resendTimer)}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

