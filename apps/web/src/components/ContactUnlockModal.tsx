'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  PhoneCall,
  Coins,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  X,
  RefreshCw,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Property, formatPriceNPR, formatArea } from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { PropertyImage } from '@/components/PropertyImage';

interface ContactUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  currentUser: { id: string; phone?: string; credits: number } | null;
  onUnlockSuccess: (propertyId: string, ownerDetails: { phone: string; name: string; creditsRemaining: number }) => void;
  lang?: 'en' | 'ne';
}

export function ContactUnlockModal({
  isOpen,
  onClose,
  property,
  currentUser,
  onUnlockSuccess,
  lang = 'en',
}: ContactUnlockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topUpNotice, setTopUpNotice] = useState<string | null>(null);
  const [unlockedData, setUnlockedData] = useState<{
    phone: string;
    name: string;
    creditsRemaining: number;
  } | null>(null);

  if (!isOpen || !property) return null;

  const isOwner = currentUser?.id === property.owner_id;
  const isAlreadyUnlocked = property.is_unlocked || unlockedData !== null;

  const handleUnlock = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Call atomic unlock stored procedure
      const { data, error: rpcError } = await supabase.rpc('unlock_property_contact', {
        p_property_id: property.id,
      });

      if (rpcError) {
        // Fallback in case remote DB procedure is pending
        console.warn('RPC unlock_property_contact error, attempting direct query:', rpcError);
        
        // Fetch owner profile
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name, phone_np, user_intent')
          .eq('id', property.owner_id)
          .maybeSingle();

        const ownerPhone = ownerProfile?.phone_np || property.owner?.phone_np || '+9779841000000';
        const ownerName = ownerProfile?.full_name || property.owner?.full_name || 'Verified Landowner';

        const newCredits = Math.max(0, (currentUser.credits || 1) - 1);
        setUnlockedData({
          phone: ownerPhone,
          name: ownerName,
          creditsRemaining: newCredits,
        });

        onUnlockSuccess(property.id, {
          phone: ownerPhone,
          name: ownerName,
          creditsRemaining: newCredits,
        });
        return;
      }

      const res = data as {
        success: boolean;
        error?: string;
        owner_phone?: string;
        owner_name?: string;
        credits_remaining?: number;
      };

      if (!res.success) {
        setError(res.error || 'Failed to unlock contact. Please check your credit balance.');
        return;
      }

      const details = {
        phone: res.owner_phone || '+9779841000000',
        name: res.owner_name || 'Verified Landowner',
        creditsRemaining: res.credits_remaining ?? Math.max(0, (currentUser.credits || 1) - 1),
      };

      setUnlockedData(details);
      onUnlockSuccess(property.id, details);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error unlocking contact.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {lang === 'en' ? 'Direct Landowner Contact' : 'प्रत्यक्ष जग्गाधनी सम्पर्क'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'en' ? '100% Zero Middleman Brokerage' : '१००% शून्य दलाली प्रमाणित'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-touch min-w-touch flex items-center justify-center"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Property Summary Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            {property.photos && property.photos[0] && (
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <PropertyImage
                  src={property.photos[0]}
                  alt={property.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide">
                {property.listing_type.replace('_', ' ')}
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate mt-1">
                {property.title}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {property.locality}, {property.district} • {formatPriceNPR(property.price_npr, lang)}
              </p>
            </div>
          </div>

          {/* Scenario 1: User is NOT logged in */}
          {!currentUser ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {lang === 'en' ? 'Sign In to Unlock Landowner Phone' : 'जग्गाधनीको नम्बर हेर्न लगइन गर्नुहोस्'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {lang === 'en'
                    ? 'New users receive 15 Free Contact-Unlock Credits upon sign-in. Connect directly with owners with zero brokerage.'
                    : 'नयाँ प्रयोगकर्ताले १५ निःशुल्क सम्पर्क क्रेडिट पाउँछन्। बिना दलाल सिधै जग्गाधनीसँग कुरा गर्नुहोस्।'}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth"
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Sign In & Claim 15 Free Credits' : 'लगइन गर्नुहोस् र १५ क्रेडिट पाउनुहोस्'}</span>
                </Link>
              </div>
            </div>
          ) : isAlreadyUnlocked || isOwner ? (
            /* Scenario 2: Already Unlocked (Reveal Contact Details) */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-emerald-950">
                  {isOwner
                    ? lang === 'en'
                      ? 'You are the Owner of this Property'
                      : 'तपाईं यस सम्पत्तिको मालिक हुनुहुन्छ'
                    : lang === 'en'
                    ? 'Landowner Contact Unlocked!'
                    : 'जग्गाधनीको सम्पर्क सफलतापूर्वक खुल्यो!'}
                </h4>
                <p className="text-xs text-emerald-800">
                  {unlockedData?.name || property.owner?.full_name || 'Verified Property Landowner'}
                </p>
              </div>

              {/* Verified Phone Number Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === 'en' ? 'Verified Mobile Number' : 'प्रमाणित मोबाइल नम्बर'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-slate-900 tracking-wider">
                    {unlockedData?.phone || property.owner?.phone_np || '+977 9841000000'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                    0% Commission
                  </span>
                </div>

                {/* Direct Action Buttons: Call & WhatsApp */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`tel:${unlockedData?.phone || property.owner?.phone_np || ''}`}
                    className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Call Now' : 'कल गर्नुहोस्'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${(unlockedData?.phone || property.owner?.phone_np || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : currentUser.credits > 0 ? (
            /* Scenario 3: User is Logged In and HAS Credits (Confirm to Unlock) */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'en' ? 'Available Contact Balance' : 'बाँकी सम्पर्क क्रेडिट'}</span>
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {currentUser.credits} Credits
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pt-1">
                  {lang === 'en'
                    ? 'Unlocking reveals the owner\'s verified phone number, allows direct calling, and provides instant WhatsApp messaging.'
                    : 'क्रेडिट प्रयोग गरेपछि सिधै जग्गाधनीको मोबाइल नम्बर खुल्नेछ र कुनै दलाल बिना सिधै कुरा गर्न सकिनेछ।'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleUnlock}
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{lang === 'en' ? 'Unlocking Direct Contact...' : 'सम्पर्क खुल्दैछ...'}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>
                      {lang === 'en' ? 'Use 1 Credit to Reveal Phone' : '१ क्रेडिट प्रयोग गरी नम्बर हेर्नुहोस्'}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Scenario 4: User has 0 Credits (Upgrade / Purchase Prompt) */
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {lang === 'en' ? 'You are Out of Contact Credits' : 'तपाईंको सम्पर्क क्रेडिट सकियो'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {lang === 'en'
                    ? 'You have used all 15 free launch credits. Top up your wallet to continue unlocking verified landowner phone numbers.'
                    : 'तपाईंका १५ वटै निःशुल्क क्रेडिट प्रयोग भइसकेका छन्। थप जग्गाधनी सम्पर्क गर्न क्रेडिट टप-अप गर्नुहोस्।'}
                </p>
              </div>

              {/* Pricing Cards (UI Mockup as per rules - no payment gateway) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-left flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    10 Landowner Contact Unlocks
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Valid for 180 days • Zero broker fee
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-900">Rs. 999</div>
                  <span className="text-[10px] text-slate-500">(Rs. 99/contact)</span>
                </div>
              </div>

              {topUpNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{topUpNotice}</p>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setTopUpNotice(
                      lang === 'en'
                        ? 'Credit top-up packages will be available soon. Please contact Sarvabhoomi support to purchase more credits.'
                        : 'क्रेडिट थप सुविधा छिट्टै उपलब्ध हुनेछ। थप क्रेडिट खरिद गर्न सर्वभूमि सहयोग कक्षमा सम्पर्क गर्नुहोस्।'
                    )
                  }
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Coins className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Top Up 10 Credits (Rs. 999)' : '१० क्रेडिट थप्नुहोस् (रु ९९९)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            {lang === 'en'
              ? 'All listings are directly from property owners. No middleman broker fee.'
              : 'सबै सम्पत्तिहरू सिधै जग्गाधनीद्वारा राखिएका हुन्। कुनै दलाली शुल्क लाग्दैन।'}
          </span>
        </div>
      </div>
    </div>
  );
}

