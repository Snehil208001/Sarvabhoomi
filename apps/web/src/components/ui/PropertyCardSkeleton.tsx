'use client';

import React from 'react';

export function PropertyCardSkeleton() {
  return (
    <div
      className="bg-white/[0.04] rounded-2xl border border-white/10 overflow-hidden shadow-card flex flex-col justify-between animate-pulse"
      aria-hidden="true"
    >
      <div>
        {/* 4:3 Image Skeleton with Badge Shimmers */}
        <div className="relative aspect-[4/3] w-full bg-white/[0.06] overflow-hidden">
          {/* Top Left Badges Skeleton */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <div className="h-6 w-28 rounded-md bg-white/10" />
            <div className="h-6 w-24 rounded-md bg-white/10" />
          </div>
          {/* Top Right Favourite Circle Skeleton */}
          <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10" />
          {/* Bottom Left Subtype & Photo Pill Skeleton */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
            <div className="w-20 h-5 rounded bg-white/10" />
            <div className="w-8 h-5 rounded bg-white/10" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          {/* Price & Deposit Header */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <div className="h-7 w-32 rounded-lg bg-gold/20" />
                <div className="h-3 w-8 rounded bg-white/10" />
              </div>
              <div className="h-3 w-24 rounded bg-white/10 shrink-0" />
            </div>

            {/* Savings Micro-Badge Shimmer */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-5 w-36 rounded-md bg-emerald-500/10" />
              <div className="h-3 w-20 rounded bg-white/10" />
            </div>

            {/* Title Line */}
            <div className="h-4 w-5/6 rounded bg-white/10 mt-2.5" />
          </div>

          {/* Key Specs Row: 3 Items */}
          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10">
            <div className="h-4 rounded bg-white/[0.06]" />
            <div className="h-4 rounded bg-white/[0.06]" />
            <div className="h-4 rounded bg-white/[0.06]" />
          </div>
        </div>
      </div>

      {/* Dual Action Footer Actions */}
      <div className="p-4 pt-0 border-t border-white/10 flex items-center justify-between gap-3 mt-2">
        <div className="h-4 w-20 rounded bg-white/10" />
        <div className="h-10 w-36 rounded-xl bg-gold/30" />
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <PropertyCardSkeleton key={idx} />
      ))}
    </div>
  );
}
