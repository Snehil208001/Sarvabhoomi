'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardShortlistRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=shortlist');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-sans">
      <div className="w-12 h-12 rounded-2xl bg-gold text-black font-black flex items-center justify-center text-xl animate-pulse shadow-card">
        स
      </div>
    </div>
  );
}

