'use client';

import React from 'react';
import Link from 'next/link';

interface FooterProps {
  lang?: 'en' | 'ne';
}

export function Footer({ lang = 'en' }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-lg select-none">
              स
            </div>
            <span className="font-bold text-slate-900 text-sm">
              Sarvabhoomi Capital &amp; Investment
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-600 font-medium">
            <Link href="/auth?mode=login" className="hover:text-emerald-700 min-h-touch flex items-center">
              {lang === 'en' ? 'Log In' : 'लगइन'}
            </Link>
            <Link href="/auth?mode=signup" className="hover:text-emerald-700 min-h-touch flex items-center">
              {lang === 'en' ? 'Sign Up' : 'साइन अप'}
            </Link>
            <Link href="/dashboard" className="hover:text-emerald-700 min-h-touch flex items-center">
              {lang === 'en' ? 'Marketplace Console' : 'ड्यासबोर्ड कन्सोल'}
            </Link>
            <Link href="/#how-it-works" className="hover:text-emerald-700 min-h-touch flex items-center">
              {lang === 'en' ? 'Why Zero Brokerage' : 'शून्य दलाली'}
            </Link>
            <Link href="/#faqs" className="hover:text-emerald-700 min-h-touch flex items-center">
              {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <div>
            © 2026 Sarvabhoomi Capital &amp; Investment Pvt. Ltd. Kathmandu, Nepal. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>Kathmandu Cadastral GIS Certified</span>
            <span>•</span>
            <span>100% Zero Brokerage P2P</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

