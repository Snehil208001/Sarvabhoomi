'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe2,
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  lang?: 'en' | 'ne';
  onToggleLang?: () => void;
  currentUser?: {
    id: string;
    fullName?: string;
    credits?: number;
  } | null;
}

export function Navbar({ lang = 'en', onToggleLang, currentUser }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    fullName: string;
    credits: number;
  } | null>(currentUser ? {
    id: currentUser.id,
    fullName: currentUser.fullName || 'Verified Member',
    credits: currentUser.credits ?? 15,
  } : null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser !== undefined) {
      if (currentUser) {
        setUser({
          id: currentUser.id,
          fullName: currentUser.fullName || 'Verified Member',
          credits: currentUser.credits ?? 15,
        });
      } else {
        setUser(null);
      }
      return;
    }

    let isMounted = true;
    async function checkAuth() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser && isMounted) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', authUser.id)
            .maybeSingle();

          const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('credits_remaining')
            .eq('user_id', authUser.id)
            .maybeSingle();

          setUser({
            id: authUser.id,
            fullName: profile?.full_name || 'Verified Member',
            credits: sub?.credits_remaining ?? 15,
          });
        }
      } catch {
        // Continue as guest
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group min-h-touch">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-xl sm:text-2xl shadow-xs ring-4 ring-emerald-50 select-none group-hover:bg-emerald-700 transition-colors">
            स
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg whitespace-nowrap">
                Sarvabhoomi
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                0% Brokerage
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap">
              {lang === 'en' ? 'Direct P2P Real Estate' : 'शून्य-दलाली घरजग्गा बजार'}
            </p>
          </div>
        </Link>

        {/* Center: Concise Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-600 shrink-0">
          <Link href="/search" className="hover:text-emerald-700 transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'Explore Properties' : 'सम्पत्तिहरू खोज्नुहोस्'}
          </Link>
          <Link href="/#how-it-works" className="hover:text-emerald-700 transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
          </Link>
          <Link href="/#valuation-tracker" className="hover:text-emerald-700 transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'Valuation & Kitta' : 'कित्ता नापी नक्सा'}
          </Link>
          <Link href="/#faqs" className="hover:text-emerald-700 transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
          </Link>
        </nav>

        {/* Right: Actions, Auth & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Post Free Property CTA */}
          <Link
            href={user ? '/post-property' : '/auth?mode=signup'}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl border border-emerald-600 bg-emerald-50/90 hover:bg-emerald-600 text-emerald-800 hover:text-white text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95 whitespace-nowrap min-h-touch"
          >
            <PlusCircle className="w-4 h-4 text-emerald-600 group-hover:text-white" />
            <span>{lang === 'en' ? 'Post Free Property' : 'जग्गा राख्नुहोस्'}</span>
          </Link>

          {/* Authentication Action: User Chip or Single Sign In CTA */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs sm:text-sm font-bold transition-all shadow-xs whitespace-nowrap min-h-touch"
                title="Go to Dashboard Console"
              >
                <User className="w-4 h-4 text-emerald-700" />
                <span className="hidden md:inline font-semibold truncate max-w-[110px]">{user.fullName}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {user.credits} C
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold min-h-touch min-w-touch flex items-center justify-center"
                title={lang === 'en' ? 'Log Out' : 'लगआउट'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm active:scale-95 whitespace-nowrap min-h-touch"
              title={lang === 'en' ? 'Log in or Create an Account' : 'लगइन वा नयाँ खाता'}
            >
              <User className="w-4 h-4" />
              <span>{lang === 'en' ? 'Sign In' : 'साइन इन'}</span>
            </Link>
          )}

          {/* Bilingual Switcher */}
          {onToggleLang && (
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs min-h-touch"
              title={lang === 'en' ? 'नेपालीमा स्विच गर्नुहोस्' : 'Switch to English'}
            >
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
            </button>
          )}

          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            {lang === 'en' ? 'Explore Properties' : 'सम्पत्तिहरू खोज्नुहोस्'}
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
          </Link>
          <Link
            href="/#valuation-tracker"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            {lang === 'en' ? 'Valuation & Kitta' : 'कित्ता नापी नक्सा'}
          </Link>
          <Link
            href="/#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
          >
            {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-emerald-700"
            >
              {lang === 'en' ? 'My Dashboard Console' : 'ड्यासबोर्ड कन्सोल'}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

