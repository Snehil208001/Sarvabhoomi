'use client';

import React from 'react';
import Link from 'next/link';

interface FooterProps {
  lang?: 'en' | 'ne';
}

export function Footer({ lang = 'en' }: FooterProps) {
  return (
    <footer className="bg-black py-14 text-xs text-white/70 border-t border-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold text-black flex items-center justify-center font-black text-xl select-none shadow-card">
              स
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">
                Sarvabhoomi Capital &amp; Investment
              </span>
              <span className="text-[11px] text-white/70 font-medium block">
                {lang === 'en' ? "Nepal's Verified 0% Brokerage Rental Network" : 'शून्य-दलाली घरजग्गा बजार'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-7 text-white/80 font-semibold text-sm">
            <Link href="/search" className="hover:text-gold transition-colors min-h-touch flex items-center">
              {lang === 'en' ? 'Rentals' : 'भाडा'}
            </Link>
            <Link href="/auth?mode=login" className="hover:text-gold transition-colors min-h-touch flex items-center">
              {lang === 'en' ? 'Log In' : 'लगइन'}
            </Link>
            <Link href="/auth?mode=signup" className="hover:text-gold transition-colors min-h-touch flex items-center">
              {lang === 'en' ? 'Sign Up' : 'साइन अप'}
            </Link>
            <Link href="/dashboard" className="hover:text-gold transition-colors min-h-touch flex items-center">
              {lang === 'en' ? 'Dashboard' : 'ड्यासबोर्ड'}
            </Link>
            <Link href="/#how-it-works" className="hover:text-gold transition-colors min-h-touch flex items-center">
              {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
            </Link>
            <Link href="/#faqs" className="hover:text-gold transition-colors min-h-touch flex items-center">
              {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/60">
          <div>
            © 2026 Sarvabhoomi Capital &amp; Investment Pvt. Ltd. Kathmandu, Nepal. All rights reserved.
          </div>
          <div className="flex items-center gap-3 text-white/70 text-[11px] font-medium">
            <span className="text-gold font-bold">●</span>
            <span>Kathmandu Cadastral GIS Certified</span>
            <span>•</span>
            <span className="text-gold font-bold">100% Zero Brokerage P2P</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
