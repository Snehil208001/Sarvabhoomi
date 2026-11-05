'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardShortlistRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=shortlist');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl animate-pulse">
        स
      </div>
    </div>
  );
}

