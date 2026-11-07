import React from 'react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans selection:bg-gold selection:text-black">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden shrink-0 ring-2 ring-gold/40 shadow-card drop-shadow-[0_0_20px_rgba(194,169,100,0.35)] animate-pulse">
        <Image
          src="/logo/logo-mark.png"
          alt="Sarvabhoomi Capital & Investment"
          width={64}
          height={64}
          priority
          className="w-full h-full object-contain"
        />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-widest text-gold animate-pulse">
        Sarvabhoomi Capital &amp; Investment
      </p>
    </div>
  );
}
