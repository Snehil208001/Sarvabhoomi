'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * Animated Marquee of Nepal Districts
 * - 30s slow loop
 * - Pauses on hover
 * - Zero animation when prefers-reduced-motion is active
 */
export function DistrictTicker() {
  const districts = [
    'Kathmandu (काठमाडौँ)',
    'Lalitpur (ललितपुर)',
    'Bhaktapur (भक्तपुर)',
    'Pokhara / Kaski (पोखरा)',
    'Chitwan (चितवन)',
    'Butwal / Rupandehi (बुटवल)',
    'Dharan / Sunsari (धरान)',
    'Biratnagar (विराटनगर)',
    'Hetauda (हेटौंडा)',
    'Nepalgunj (नेपालगन्ज)',
    'Dhangadhi (धनगढी)',
  ];

  return (
    <div className="w-full max-w-full bg-black text-gold border-y border-gold/30 overflow-hidden py-2 select-none">
      <div className="animate-marquee flex items-center whitespace-nowrap text-xs font-bold tracking-wider w-max">
        {[...districts, ...districts].map((d, i) => (
          <span key={i} className="inline-flex items-center mx-4">
            <span className="text-gold/50 mr-4 font-mono">✦</span>
            <span>{d}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * CountUp Number Component
 * - Content is visible by default with target number (prevents showing 0 on slow/unobserved viewports)
 * - Animates upward smoothly when scrolled into view
 * - Graceful fallback to target directly for reduced-motion, SSR, or failed observer
 */
export function CountUp({
  target,
  prefix = '',
  suffix = '',
  durationMs = 900,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}) {
  // Visible by default with the real target number
  const [displayValue, setDisplayValue] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(target);
      return;
    }

    const currentRef = ref.current;
    if (!currentRef) {
      setDisplayValue(target);
      return;
    }

    // Safety timeout: Ensure target value is displayed unconditionally after 1000ms
    const safetyTimeout = setTimeout(() => {
      setDisplayValue(target);
    }, 1000);

    if (target === 0) {
      setDisplayValue(0);
      return () => clearTimeout(safetyTimeout);
    }

    // Animate up from 0 when observed
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();
          clearTimeout(safetyTimeout);

          const startTime = performance.now();
          const step = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.round(easeOut * target);
            setDisplayValue(currentVal);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              setDisplayValue(target);
            }
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimeout);
    };
  }, [target, durationMs, hasStarted]);

  const hasAlphanumericSuffix = suffix && /^[A-Za-z\u0900-\u097F]/.test(suffix.trim());
  const formattedSuffix = hasAlphanumericSuffix
    ? `\u00A0${suffix.trim()}`
    : suffix;

  return (
    <span ref={ref} className="font-mono inline-flex items-baseline">
      {prefix ? `${prefix}\u00A0` : ''}
      <span>{displayValue.toLocaleString()}</span>
      {formattedSuffix && <span>{formattedSuffix}</span>}
    </span>
  );
}

/**
 * ScrollReveal Wrapper
 * - Content is visible by default (CSS opacity: 1)
 * - Enhances with subtle translateY / fade-in on scroll entry
 */
export function ScrollReveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Visible by default for SSR and no-JS fallback
  const [isVisible, setIsVisible] = useState(true);
  const [isObserved, setIsObserved] = useState(false);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      setIsVisible(true);
      return;
    }

    const currentRef = ref.current;
    if (!currentRef) {
      setIsVisible(true);
      return;
    }

    // Arm the scroll reveal animation now that observer is confirmed running
    setIsVisible(false);
    setIsObserved(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(currentRef);

    // Safety timeout: reveal everything after at most 1,000ms regardless of observer
    const safetyTimer = setTimeout(() => {
      setIsVisible(true);
      observer.disconnect();
    }, Math.max(1000, delayMs + 600));

    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: isObserved ? '400ms' : '0ms',
        transitionDelay: isObserved ? `${delayMs}ms` : '0ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      className={`transition-all transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
}

