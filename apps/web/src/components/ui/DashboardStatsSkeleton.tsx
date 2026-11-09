'use client';

import React from 'react';

export function DashboardStatsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
      aria-hidden="true"
    >
      {[1, 2, 3, 4].map((idx) => (
        <div
          key={idx}
          className="bg-white/[0.04] p-5 rounded-2xl border border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="w-8 h-8 rounded-lg bg-gold/20" />
          </div>
          <div className="h-8 w-16 rounded-lg bg-white/20" />
          <div className="h-2.5 w-24 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

