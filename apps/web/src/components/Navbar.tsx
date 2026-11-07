'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    <>
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-gold/30 shadow-subtle w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          {/* Left: Brand Identity */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink min-w-0 group min-h-touch">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden shrink-0 ring-1 ring-gold/40 shadow-subtle group-hover:scale-105 group-hover:ring-gold/70 transition-all duration-200">
              <Image
                src="/logo/logo-mark.png"
                alt="Sarvabhoomi Official Seal"
                width={44}
                height={44}
                priority
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg truncate">
                  Sarvabhoomi
                </span>
                <span className="hidden xs:inline-block px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md bg-gold/10 text-gold border border-gold/30 whitespace-nowrap">
                  0% Brokerage
                </span>
              </div>
              <p className="text-[11px] text-white/70 hidden sm:block whitespace-nowrap font-medium">
                {lang === 'en' ? 'Direct P2P Rental Network' : 'शून्य-दलाली घरजग्गा बजार'}
              </p>
            </div>
          </Link>

          {/* Center: Concise Navigation Links (Desktop only) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-sm font-semibold text-white/70 shrink-0">
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
            {/* Desktop Post Rental CTA: Gold Button (Hidden on mobile ≤768px / lg:inline-flex) */}
            {user?.userRole !== 'RENTER' ? (
              <Link
                href={user ? '/post-property' : '/auth?mode=signup'}
                className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs sm:text-sm font-black transition-all shadow-subtle hover:-translate-y-0.5 active:scale-97 whitespace-nowrap min-h-touch"
              >
                <PlusCircle className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{lang === 'en' ? 'Post Free Property' : 'घर/कोठा भाडामा राख्नुहोस्'}</span>
              </Link>
            ) : (
              <Link
                href="/search"
                className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs sm:text-sm font-black transition-all shadow-subtle hover:-translate-y-0.5 active:scale-97 whitespace-nowrap min-h-touch"
              >
                <Search className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}</span>
              </Link>
            )}

            {/* Desktop Authentication Action (Hidden on mobile ≤768px / lg:flex) */}
            {user ? (
              <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-gold/30 text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition-all whitespace-nowrap min-h-touch"
                  title="Go to Dashboard Console"
                >
                  <User className="w-4 h-4 text-gold" />
                  <span className="hidden xl:inline font-semibold truncate max-w-[110px]">{user.fullName}</span>
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
                className="hidden lg:flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-97 border border-white/10 text-white text-xs sm:text-sm font-bold transition-all shadow-subtle whitespace-nowrap min-h-touch"
                title={lang === 'en' ? 'Log in or Create an Account' : 'लगइन वा नयाँ खाता'}
              >
                <User className="w-4 h-4 text-gold" />
                <span>{lang === 'en' ? 'Sign In' : 'साइन इन'}</span>
              </Link>
            )}

            {/* Bilingual Switcher: Outlined Gold Pill (Kept on mobile & desktop, ≥44px touch target) */}
            {onToggleLang && (
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gold/30 bg-white/5 hover:bg-white/10 text-gold text-xs font-bold transition-all min-h-[44px] min-w-[44px]"
                title={lang === 'en' ? 'नेपालीमा स्विच गर्नुहोस्' : 'Switch to English'}
              >
                <Globe2 className="w-4 h-4 text-gold shrink-0" />
                <span>{lang === 'en' ? 'नेपाली' : 'EN'}</span>
              </button>
            )}

            {/* Mobile hamburger menu button: ≥44×44px, fully visible, nothing cut off */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-white hover:text-gold hover:bg-white/10 rounded-xl border border-white/10 transition-colors shrink-0"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gold" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation with Outside Click Dimmer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop Dimmer */}
            <div
              className="lg:hidden fixed inset-0 top-[72px] sm:top-[80px] z-40 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Slide Down Mobile Menu */}
            <div className="lg:hidden relative z-50 border-t border-gold/30 bg-black/98 px-4 py-4 space-y-2 shadow-card w-full">
              <Link
                href="/search"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-white/90 hover:text-gold hover:bg-white/5 transition-colors"
              >
                {lang === 'en' ? 'Search Rentals' : 'कोठा र घर भाडामा खोज्नुहोस्'}
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-white/90 hover:text-gold hover:bg-white/5 transition-colors"
              >
                {lang === 'en' ? 'Why 0% Brokerage' : 'शून्य दलाली'}
              </Link>
              <Link
                href="/#faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-white/90 hover:text-gold hover:bg-white/5 transition-colors"
              >
                {lang === 'en' ? 'FAQs' : 'प्रश्नोत्तर'}
              </Link>

              {/* Post Free Property / Find Rentals CTA in mobile menu */}
              {user?.userRole !== 'RENTER' ? (
                <Link
                  href={user ? '/post-property' : '/auth?mode=signup'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 text-sm font-black text-black bg-gold hover:bg-gold/90 rounded-xl transition-all shadow-subtle mt-2"
                >
                  <PlusCircle className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Post Free Property' : 'घर/कोठा भाडामा राख्नुहोस्'}</span>
                </Link>
              ) : (
                <Link
                  href="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 text-sm font-black text-black bg-gold hover:bg-gold/90 rounded-xl transition-all shadow-subtle mt-2"
                >
                  <Search className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}</span>
                </Link>
              )}

              {/* Mobile Auth / Dashboard Links */}
              {user ? (
                <div className="pt-2 border-t border-white/10 space-y-2 mt-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between min-h-[44px] px-3.5 rounded-xl text-sm font-bold text-gold hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gold" />
                      <span>{user.fullName || (lang === 'en' ? 'Dashboard Console' : 'ड्यासबोर्ड')}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gold text-black text-[10px] font-black">
                      {user.credits} C
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-2 w-full min-h-[44px] px-3.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-white/60" />
                    <span>{lang === 'en' ? 'Log Out' : 'लगआउट'}</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/10 mt-2">
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                  >
                    <User className="w-4 h-4 text-gold" />
                    <span>{lang === 'en' ? 'Sign In / Register' : 'साइन इन / नयाँ खाता'}</span>
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {/* Mobile Floating Action Button (FAB) at bottom-right (≤768px / lg:hidden, 56px Gold circle) */}
      {user?.userRole !== 'RENTER' ? (
        <Link
          href={user ? '/post-property' : '/auth?mode=signup'}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gold text-black shadow-card flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none ring-2 ring-black/60 group"
          aria-label={lang === 'en' ? 'Post Free Property' : 'घर/कोठा भाडामा राख्नुहोस्'}
          title={lang === 'en' ? 'Post Free Property' : 'घर/कोठा भाडामा राख्नुहोस्'}
        >
          <PlusCircle className="w-7 h-7 text-black stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
        </Link>
      ) : (
        <Link
          href="/search"
          className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gold text-black shadow-card flex items-center justify-center hover:scale-105 active:scale-95 transition-all focus:outline-none ring-2 ring-black/60 group"
          aria-label={lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}
          title={lang === 'en' ? 'Find Rentals' : 'भाडामा खोज्नुहोस्'}
        >
          <Search className="w-7 h-7 text-black stroke-[2.5]" />
        </Link>
      )}
    </>
  );
}
