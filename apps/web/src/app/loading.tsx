import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
      <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center font-bold text-white text-2xl shadow-sm ring-4 ring-emerald-100 select-none animate-pulse">
        स
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-emerald-800 animate-pulse">
        Sarvabhoomi Capital &amp; Investment
      </p>
    </div>
  );
}

