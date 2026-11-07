'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error in application:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white selection:bg-gold selection:text-black">
      <div className="max-w-md w-full bg-white/[0.06] rounded-3xl border border-gold/30 p-8 text-center shadow-card space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-white/10 text-gold flex items-center justify-center mx-auto border border-gold/30">
          <AlertTriangle className="w-7 h-7 text-gold" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-white/70 leading-relaxed font-medium">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-white/50">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black text-xs font-black transition-all shadow-card"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all shadow-2xs"
          >
            <Home className="w-3.5 h-3.5 text-gold" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

