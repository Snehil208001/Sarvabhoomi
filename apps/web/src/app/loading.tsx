import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans selection:bg-gold selection:text-black">
      <div className="w-14 h-14 rounded-2xl bg-gold flex items-center justify-center font-black text-black text-2xl shadow-card select-none animate-pulse">
        स
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-gold animate-pulse">
        Sarvabhoomi Capital &amp; Investment
      </p>
    </div>
  );
}

