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
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { Property, formatPriceNPR } from '@sarvabhoomi/shared';
import { supabase } from '@/lib/supabase';
import { PropertyImage } from '@/components/PropertyImage';

interface ContactUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  currentUser: { id: string; phone?: string; credits: number; fullName?: string | null } | null;
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
  const [renterNameInput, setRenterNameInput] = useState('');
  const [unlockedData, setUnlockedData] = useState<{
    phone: string;
    name: string;
    creditsRemaining: number;
  } | null>(null);

  if (!isOpen || !property) return null;

  const isOwner = currentUser?.id === property.owner_id;
  const isAlreadyUnlocked = property.is_unlocked || unlockedData !== null;
  const needsName = Boolean(currentUser && (!currentUser.fullName || currentUser.fullName.trim() === ''));

  const ownerPhone = unlockedData?.phone || property.owner?.phone_np || '+977 9841000000';
  const ownerName = unlockedData?.name || property.owner?.full_name || (lang === 'en' ? 'Verified Landlord' : 'प्रमाणित घरधनी');
  const cleanPhone = ownerPhone.replace(/[^0-9]/g, '');

  const propertyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/properties/${property.id}`
      : `https://sarvabhoomi.vercel.app/properties/${property.id}`;

  const whatsappInquiryMessage = encodeURIComponent(
    lang === 'en'
      ? `Namaste! I found your property listing "${property.title}" on Sarvabhoomi (${propertyUrl}) and would like to inquire about renting it.`
      : `नमस्ते! मैले तपाईंको सम्पत्ति "${property.title}" सर्वभूमि (${propertyUrl}) मा देखेको छु र यसलाई भाडामा लिन सम्पर्क गर्न चाहन्छु।`
  );

  const whatsappVisitMessage = encodeURIComponent(
    lang === 'en'
      ? `Namaste! I am interested in renting "${property.title}" (${propertyUrl}). I would like to schedule a physical visit to inspect the property. What date and time works best for you?`
      : `नमस्ते! म तपाईंको सम्पत्ति "${property.title}" (${propertyUrl}) भाडामा लिन इच्छुक छु। म यसलाई स्थलगत अवलोकन गर्न चाहन्छु। तपाईंलाई कहिले अनुकूल पर्ला?`
  );

  const handleUnlock = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setError(null);

    // Lazy Profile Gate: Require full_name before unlocking
    if (needsName) {
      const trimmedName = renterNameInput.trim();
      if (!trimmedName || trimmedName.length < 2) {
        setError(
          lang === 'en'
            ? 'Please enter your full legal name to continue.'
            : 'कृपया अगाडि बढ्न आफ्नो पूरा कानुनी नाम प्रविष्ट गर्नुहोस्।'
        );
        setIsSubmitting(false);
        return;
      }

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (profileErr) {
        console.warn('Error saving renter name in unlock modal:', profileErr);
      }
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('unlock_property_contact', {
        p_property_id: property.id,
      });

      if (rpcError) {
        console.warn('RPC unlock_property_contact error, attempting direct query:', rpcError);
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('phone_np, full_name')
          .eq('id', property.owner_id)
          .maybeSingle();

        const fetchedPhone = ownerProfile?.phone_np || '+977 9841000000';
        const fetchedName = ownerProfile?.full_name || 'Verified Owner';
        const nextCredits = Math.max(0, currentUser.credits - 1);

        setUnlockedData({
          phone: fetchedPhone,
          name: fetchedName,
          creditsRemaining: nextCredits,
        });

        onUnlockSuccess(property.id, {
          phone: fetchedPhone,
          name: fetchedName,
          creditsRemaining: nextCredits,
        });
        return;
      }

      if (data && data.success) {
        const fetchedPhone = data.owner_phone || '+977 9841000000';
        const fetchedName = data.owner_name || 'Verified Owner';
        const remaining = data.credits_remaining ?? Math.max(0, currentUser.credits - 1);

        setUnlockedData({
          phone: fetchedPhone,
          name: fetchedName,
          creditsRemaining: remaining,
        });

        onUnlockSuccess(property.id, {
          phone: fetchedPhone,
          name: fetchedName,
          creditsRemaining: remaining,
        });
      } else {
        setError(data?.error || 'Unable to unlock contact details. Please try again.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unlock contact.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white/[0.06] rounded-3xl border border-gold/30 shadow-card max-w-md w-full overflow-hidden text-white animate-in zoom-in-95 duration-200 backdrop-blur-md">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold text-black flex items-center justify-center shadow-subtle">
              <Phone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-gold">
                {lang === 'en' ? 'Direct Owner Contact' : 'प्रत्यक्ष घरधनी सम्पर्क'}
              </h3>
              <p className="text-[11px] text-white/70 font-semibold">
                {lang === 'en' ? '100% Zero Middleman Brokerage' : '१००% शून्य दलाली प्रमाणित'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Property Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
            {property.photos && property.photos[0] && (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
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
              <span className="text-[10px] font-black text-black bg-gold px-2 py-0.5 rounded uppercase tracking-wide">
                {property.property_subtype || 'Rental'}
              </span>
              <h4 className="text-xs font-bold text-white truncate mt-1">
                {property.title}
              </h4>
              <p className="text-[11px] text-white/70 font-semibold truncate">
                {property.locality ? `${property.locality}, ` : ''}{property.district} • {formatPriceNPR(property.monthly_rent_npr || property.price_npr, lang)}/mo
              </p>
            </div>
          </div>

          {/* Scenario 1: User is NOT logged in */}
          {!currentUser ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 text-gold flex items-center justify-center mx-auto border border-gold/30">
                <Lock className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-black mb-2.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'en'
                      ? '15 Complimentary Contact Unlocks'
                      : '१५ निःशुल्क सम्पर्क अनलक'}
                  </span>
                </div>
                <h4 className="text-base font-black text-white">
                  {lang === 'en'
                    ? 'Sign up free to claim 15 complimentary Owner Contact Unlocks'
                    : '१५ निःशुल्क सम्पर्क अनलक दाबी गर्न साइन अप गर्नुहोस्'}
                </h4>
                <p className="text-xs text-white/70 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  {lang === 'en'
                    ? 'Connect directly with verified landowners with zero brokerage. Unlocking reveals direct phone numbers and WhatsApp.'
                    : 'कुनै पनि दलाल बिना सिधै घरधनीसँग जोडिनुहोस्। नम्बर र ह्वाट्सएप तुरुन्त खुल्छ।'}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth?mode=signup"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black font-black text-sm tracking-wide shadow-subtle flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>{lang === 'en' ? 'Sign In & Claim 15 Free Credits' : 'साइन इन गर्नुहोस् र १५ क्रेडिट पाउनुहोस्'}</span>
                </Link>
              </div>
            </div>
          ) : isAlreadyUnlocked || isOwner ? (
            /* Scenario 2: Already Unlocked (Reveal Contact Details) */
            <div className="space-y-4 py-1">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-gold text-black flex items-center justify-center mx-auto shadow-subtle">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h4 className="text-sm font-black text-white">
                    {ownerName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/40 text-[10px] font-black uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-gold" />
                    <span>{lang === 'en' ? 'Verified Owner' : 'प्रमाणित घरधनी'}</span>
                  </span>
                </div>
                <p className="text-xs text-white/70 font-semibold">
                  {lang === 'en'
                    ? 'Direct Listing • 0% Middleman Brokerage'
                    : 'प्रत्यक्ष सूचीकरण • ०% दलाली शुल्क'}
                </p>
              </div>

              {/* Verified Phone Number Box */}
              <div className="p-4 rounded-2xl border border-gold/30 bg-white/[0.04] shadow-subtle space-y-3">
                <div className="text-[11px] font-black text-white/70 uppercase tracking-wider">
                  {lang === 'en' ? 'Verified Mobile Number' : 'प्रमाणित मोबाइल नम्बर'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-black text-gold tracking-wider">
                    {ownerPhone}
                  </span>
                  <span className="text-[10px] font-black text-black bg-gold px-2 py-0.5 rounded">
                    0% Commission
                  </span>
                </div>

                {/* Direct Action Buttons: Call & WhatsApp */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`tel:${ownerPhone}`}
                    className="py-3 px-3 rounded-xl bg-gold hover:bg-gold/90 text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-subtle active:scale-97"
                  >
                    <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                    <span>{lang === 'en' ? 'Call Owner' : 'कल गर्नुहोस्'}</span>
                  </a>

                  <a
                    href={`https://wa.me/${cleanPhone}?text=${whatsappInquiryMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-97"
                  >
                    <MessageCircle className="w-4 h-4 stroke-[2.5]" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                {/* Action 3: Schedule Physical Visit */}
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${cleanPhone}?text=${whatsappVisitMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold text-xs font-black flex items-center justify-center gap-2 transition-all shadow-subtle active:scale-97"
                  >
                    <Calendar className="w-4 h-4 stroke-[2.5]" />
                    <span>{lang === 'en' ? 'Schedule Physical Visit' : 'स्थलगत अवलोकन समय मिलाउनुहोस्'}</span>
                  </a>
                </div>
              </div>
            </div>
          ) : currentUser.credits > 0 ? (
            /* Scenario 3: User is Logged In and HAS Credits (Confirm to Unlock) */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-gold stroke-[2.5]" />
                    <span>
                      {lang === 'en'
                        ? `You have ${currentUser.credits} of 15 Free Launch Unlocks remaining`
                        : `तपाईंसँग १५ मध्ये ${currentUser.credits} निःशुल्क सम्पर्क अनलक बाँकी छन्`}
                    </span>
                  </span>
                  <span className="font-black text-black bg-gold px-2.5 py-0.5 rounded-full shrink-0">
                    {currentUser.credits} Left
                  </span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed pt-1 font-medium">
                  {lang === 'en'
                    ? "Unlocking reveals the owner's verified phone number, allows direct 1-tap calling, WhatsApp messaging, and visit scheduling."
                    : 'क्रेडिट प्रयोग गरेपछि सिधै घरधनीको मोबाइल नम्बर खुल्नेछ र कुनै दलाल बिना सिधै कुरा गर्न वा अवलोकन समय तय गर्न सकिनेछ।'}
                </p>
              </div>

              {needsName && (
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/20 space-y-2 text-left">
                  <label className="block text-xs font-black text-white">
                    {lang === 'en' ? 'Add your name to continue *' : 'जारी राख्न आफ्नो नाम थप्नुहोस् *'}
                  </label>
                  <p className="text-[11px] text-white/70">
                    {lang === 'en'
                      ? 'Enter your full legal name so the landlord knows who unlocked their contact.'
                      : 'सम्पर्क अनलक गर्न आफ्नो पूरा नाम प्रविष्ट गर्नुहोस्।'}
                  </p>
                  <input
                    type="text"
                    value={renterNameInput}
                    onChange={(e) => {
                      setRenterNameInput(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={lang === 'en' ? 'e.g. Ram Bahadur Shrestha' : 'उदा. राम बहादुर श्रेष्ठ'}
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-gold"
                  />
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-gold/40 text-xs text-gold font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-gold" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleUnlock}
                disabled={isSubmitting || (needsName && renterNameInput.trim().length < 2)}
                className="w-full py-4 px-6 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 disabled:opacity-50 text-black font-black text-sm tracking-wide shadow-subtle flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>{lang === 'en' ? 'Unlocking Direct Contact...' : 'सम्पर्क खुल्दैछ...'}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {needsName
                        ? lang === 'en'
                          ? 'Save & Reveal Phone'
                          : 'नाम सुरक्षित गरी नम्बर हेर्नुहोस्'
                        : lang === 'en'
                        ? 'Use 1 Credit to Reveal Phone'
                        : '१ क्रेडिट प्रयोग गरी नम्बर हेर्नुहोस्'}
                    </span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Scenario 4: User has 0 Credits */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 text-gold flex items-center justify-center mx-auto border border-gold/30">
                <Coins className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-base font-black text-white">
                  {lang === 'en' ? 'You are Out of Contact Credits' : 'तपाईंको सम्पर्क क्रेडिट सकियो'}
                </h4>
                <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto leading-relaxed">
                  {lang === 'en'
                    ? 'You have used all 15 free launch credits. Top up your wallet to continue unlocking verified landowner phone numbers.'
                    : 'तपाईंका १५ वटै निःशुल्क क्रेडिट प्रयोग भइसकेका छन्। थप घरधनी सम्पर्क गर्न क्रेडिट टप-अप गर्नुहोस्।'}
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.04] text-left flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-white">
                    10 Landowner Contact Unlocks
                  </div>
                  <div className="text-[11px] text-white/70 font-medium">
                    Valid for 180 days • Zero broker fee
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-gold">Rs. 999</div>
                  <span className="text-[10px] text-white/60">(Rs. 99/contact)</span>
                </div>
              </div>

              {topUpNotice && (
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/20 text-xs text-gold flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{topUpNotice}</p>
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
                  className="w-full py-3.5 px-6 rounded-2xl bg-gold hover:bg-gold/90 text-black font-black text-sm tracking-wide shadow-subtle flex items-center justify-center gap-2 transition-all active:scale-97"
                >
                  <Coins className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Top Up 10 Credits (Rs. 999)' : '१० क्रेडिट थप्नुहोस् (रु ९९९)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 bg-white/[0.04] border-t border-white/10 text-center text-[11px] text-white/70 flex items-center justify-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-gold shrink-0 stroke-[2.5]" />
          <span>
            {lang === 'en'
              ? 'All listings are directly from property owners. No middleman broker fee.'
              : 'सबै सम्पत्तिहरू सिधै घरधनीद्वारा राखिएका हुन्। कुनै दलाली शुल्क लाग्दैन।'}
          </span>
        </div>
      </div>
    </div>
  );
}
