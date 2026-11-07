'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DashboardShortlistRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=shortlist');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans">
      <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-1 ring-gold/40 shadow-card animate-pulse">
        <Image
          src="/logo/logo-mark.png"
          alt="Sarvabhoomi"
          width={48}
          height={48}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
