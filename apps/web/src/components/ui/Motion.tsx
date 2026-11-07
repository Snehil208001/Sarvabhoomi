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
    <div className="w-full bg-black text-gold border-y border-gold/30 overflow-hidden py-2 select-none">
      <div className="animate-marquee flex items-center whitespace-nowrap text-xs font-bold tracking-wider">
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
 * - Counts up to target when scrolled into view
 * - Graceful fallback to target directly for reduced-motion or SSR
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
  const [displayValue, setDisplayValue] = useState(0);
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          observer.disconnect();

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
      { threshold: 0.15 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [target, durationMs, hasStarted]);

  return (
    <span ref={ref} className="font-mono">
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const currentRef = ref.current;
    if (!currentRef) {
      setIsVisible(true);
      return;
    }

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

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: '400ms',
        transitionDelay: `${delayMs}ms`,
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

