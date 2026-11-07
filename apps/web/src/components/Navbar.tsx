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
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NavbarProps {
  lang?: 'en' | 'ne';
  onToggleLang?: () => void;
  currentUser?: {
    id: string;
    fullName?: string;
    credits?: number;
    userRole?: 'RENTER' | 'OWNER' | null;
  } | null;
}

export function Navbar({ lang = 'en', onToggleLang, currentUser }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    fullName: string;
    credits: number;
    userRole: 'RENTER' | 'OWNER' | null;
  } | null>(currentUser ? {
    id: currentUser.id,
    fullName: currentUser.fullName || 'Verified Member',
    credits: currentUser.credits ?? 15,
    userRole: currentUser.userRole || null,
  } : null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (currentUser !== undefined) {
      if (currentUser) {
        setUser({
          id: currentUser.id,
          fullName: currentUser.fullName || 'Verified Member',
          credits: currentUser.credits ?? 15,
          userRole: currentUser.userRole || null,
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
            .select('full_name, user_role')
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
            userRole: profile?.user_role || null,
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
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-gold/30 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group min-h-touch">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gold flex items-center justify-center font-black text-black text-xl sm:text-2xl shadow-subtle select-none group-hover:scale-105 transition-transform duration-200">
            स
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base sm:text-lg whitespace-nowrap">
                Sarvabhoomi
              </span>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-gold/10 text-gold border border-gold/30 whitespace-nowrap">
                0% Brokerage
              </span>
            </div>
            <p className="text-[11px] text-white/70 hidden sm:block whitespace-nowrap font-medium">
              {lang === 'en' ? 'Direct P2P Rental Network' : 'शून्य-दलाली घरजग्गा बजार'}
            </p>
          </div>
        </Link>

        {/* Center: Concise Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-7 text-sm font-semibold text-white/70 shrink-0">
          <Link href="/search" className="hover:text-gold transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'Search Rentals' : 'कोठा र घर भाडामा खोज्नुहोस्'}
          </Link>
          <Link href="/#how-it-works" className="hover:text-gold transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
          </Link>
          <Link href="/#faqs" className="hover:text-gold transition-colors whitespace-nowrap min-h-touch flex items-center">
            {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
          </Link>
        </nav>

        {/* Right: Actions, Auth & Language Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Post Free Rental CTA: Gold Button with Black Text (Contrast: 8.3:1) */}
          {user?.userRole !== 'RENTER' ? (
            <Link
              href={user ? '/post-property' : '/auth?mode=signup'}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs sm:text-sm font-black transition-all shadow-subtle hover:-translate-y-0.5 active:scale-97 whitespace-nowrap min-h-touch"
            >
              <PlusCircle className="w-4 h-4 text-black stroke-[2.5]" />
              <span>{lang === 'en' ? 'Post Free Property' : 'घर/कोठा भाडामा राख्नुहोस्'}</span>
            </Link>
          ) : (
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs sm:text-sm font-black transition-all shadow-subtle hover:-translate-y-0.5 active:scale-97 whitespace-nowrap min-h-touch"
            >
              <Search className="w-4 h-4 text-black stroke-[2.5]" />
              <span>{lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}</span>
            </Link>
          )}

          {/* Authentication Action: Outlined Gold Verified Member pill or Sign In CTA */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-gold/30 text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-touch"
                title="Go to Dashboard Console"
              >
                <User className="w-4 h-4 text-gold" />
                <span className="hidden md:inline font-semibold truncate max-w-[110px]">{user.fullName}</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gold text-black text-[10px] font-black">
                  {user.credits} C
                </span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-xs font-semibold min-h-touch min-w-touch flex items-center justify-center"
                title={lang === 'en' ? 'Log Out' : 'लगआउट'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-97 border border-white/10 text-white text-xs sm:text-sm font-bold transition-all shadow-subtle whitespace-nowrap min-h-touch"
              title={lang === 'en' ? 'Log in or Create an Account' : 'लगइन वा नयाँ खाता'}
            >
              <User className="w-4 h-4 text-gold" />
              <span>{lang === 'en' ? 'Sign In' : 'साइन इन'}</span>
            </Link>
          )}

          {/* Bilingual Switcher: Outlined Gold Pill */}
          {onToggleLang && (
            <button
              type="button"
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gold/30 bg-white/5 hover:bg-white/10 text-gold text-xs font-bold transition-all min-h-touch"
              title={lang === 'en' ? 'नेपालीमा स्विच गर्नुहोस्' : 'Switch to English'}
            >
              <Globe2 className="w-4 h-4 text-gold" />
              <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
            </button>
          )}

          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-white hover:bg-white/10 rounded-xl border border-white/10 min-h-touch min-w-touch flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-gold" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gold/30 bg-black px-4 py-4 space-y-3">
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-white/90 hover:text-gold"
          >
            {lang === 'en' ? 'Search Rentals' : 'कोठा र घर भाडामा खोज्नुहोस्'}
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-white/90 hover:text-gold"
          >
            {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
          </Link>
          <Link
            href="/#faqs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-semibold text-white/90 hover:text-gold"
          >
            {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
          </Link>
          {user?.userRole !== 'RENTER' && (
            <Link
              href={user ? '/post-property' : '/auth?mode=signup'}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-black bg-gold px-3 rounded-lg"
            >
              {lang === 'en' ? 'Post Free Property' : 'घर/कोठा भाडामा राख्नुहोस्'}
            </Link>
          )}
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-gold"
            >
              {lang === 'en' ? 'My Dashboard Console' : 'ड्यासबोर्ड कन्सोल'}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
