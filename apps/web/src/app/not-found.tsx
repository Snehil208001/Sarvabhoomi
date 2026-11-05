import React from 'react';
import Link from 'next/link';
import { Compass, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="text-3xl font-extrabold text-emerald-800 font-mono">404</span>
          <h2 className="text-xl font-bold text-slate-900">
            Page or Parcel Not Found
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The property listing or destination you are searching for does not exist or may have been sold.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Marketplace</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
