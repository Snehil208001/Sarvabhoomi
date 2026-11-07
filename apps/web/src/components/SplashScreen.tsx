'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

const SESSION_KEY = 'sarvabhoomi-splash-seen';

export function SplashScreen() {
  const [isMounted, setIsMounted] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFastFade, setIsFastFade] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupClasses = useCallback(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('splash-active');
      document.body.style.overflow = '';
    }
  }, []);

  const dismiss = useCallback(
    (fast: boolean = false) => {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch {
        // Fallback for sandboxed or private browsing environments
      }

      if (fast) {
        setIsFastFade(true);
      }
      setIsFadingOut(true);

      const fadeDuration = fast ? 200 : 400;
      fadeTimeoutRef.current = setTimeout(() => {
        setIsMounted(false);
        cleanupClasses();
      }, fadeDuration);
    },
    [cleanupClasses]
  );

  useEffect(() => {
    // 1. Check if already seen in this session
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        cleanupClasses();
        return;
      }
    } catch {
      cleanupClasses();
      return;
    }

    // 2. Check prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch {}
      cleanupClasses();
      return;
    }

    // 3. Mark mounted and active
    setIsMounted(true);
    document.documentElement.classList.add('splash-active');
    document.body.style.overflow = 'hidden';

    // Auto-dismiss timeline: 2.4s total, then 400ms fade-out
    autoDismissTimeoutRef.current = setTimeout(() => {
      dismiss(false);
    }, 2400);

    // 4. Keyboard listener for Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      cleanupClasses();
    };
  }, [dismiss, cleanupClasses]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Sarvabhoomi"
      onClick={() => dismiss(true)}
      className={`splash-overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#101010] cursor-pointer select-none transition-opacity ${
        isFastFade ? 'duration-200' : 'duration-400'
      } ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      style={{
        transitionTimingFunction: 'var(--ease-out)',
      }}
    >
      {/* Skip Button - appears at 0.5s */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          dismiss(true);
        }}
        aria-label="Skip splash screen"
        className="splash-skip-btn absolute top-6 right-6 sm:top-8 sm:right-8 z-10 px-3.5 py-1.5 rounded-full border border-white/20 text-[11px] sm:text-xs font-medium uppercase tracking-widest text-white/60 hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-colors focus:outline-none focus:ring-1 focus:ring-gold"
      >
        Skip
      </button>

      {/* Center Branding Content */}
      <div
        className="relative flex flex-col items-center px-4 max-w-sm text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Ring + Logo */}
        <div className="relative flex items-center justify-center mb-6">
          {/* Thin Gold SVG Ring (0.0s - 1.0s) */}
          <svg
            className="absolute -inset-3 sm:-inset-3.5 w-[112px] h-[112px] sm:w-[138px] sm:h-[138px] pointer-events-none -rotate-90"
            viewBox="0 0 140 140"
            fill="none"
          >
            <circle
              cx="70"
              cy="70"
              r="64"
              stroke="#C2A964"
              strokeWidth="1.5"
              className="splash-ring"
            />
          </svg>

          {/* Logo Mark (0.5s - 1.1s pop-in) */}
          <div className="splash-logo relative w-[88px] h-[88px] sm:w-[110px] sm:h-[110px] rounded-full overflow-hidden ring-1 ring-gold/30 drop-shadow-[0_0_20px_rgba(194,169,100,0.35)]">
            <Image
              src="/logo/logo-mark.png"
              alt="Sarvabhoomi Official Seal"
              width={110}
              height={110}
              priority
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Brand Name (0.9s - 1.4s) */}
        <h1 className="splash-title text-2xl sm:text-3xl font-bold tracking-widest text-white uppercase font-sans">
          SARVABHOOMI
        </h1>

        {/* Subtitle (1.05s - 1.4s) */}
        <p className="splash-subtitle mt-1 text-[11px] sm:text-xs uppercase tracking-[0.3em] font-medium text-gold">
          INVESTMENT &amp; CAPITAL
        </p>

        {/* 120px Gold Divider Line (1.2s - 1.6s) */}
        <div className="splash-line h-[1px] bg-gold my-4" />

        {/* Tagline (1.6s - 2.0s) */}
        <p className="splash-tagline text-xs sm:text-sm font-light text-white/70 tracking-wide">
          Rent a home in Nepal • 0% Brokerage
        </p>

        {/* Progress Bar Container (1.8s - 2.4s) */}
        <div className="mt-6 w-[180px] h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="splash-progress-bar h-full bg-gold rounded-full" />
        </div>
      </div>
    </div>
  );
}
