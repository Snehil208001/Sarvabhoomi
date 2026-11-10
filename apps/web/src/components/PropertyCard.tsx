'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Heart,
  MapPin,
  ArrowRight,
  Phone,
  Eye,
  KeyRound,
  Trash2,
  Armchair,
  Maximize2,
  Sparkles,
  Camera,
} from 'lucide-react';
import {
  Property,
  formatMonthlyRentNPR,
  formatDeposit,
  formatFurnishing,
} from '@sarvabhoomi/shared';
import { PropertyImage } from '@/components/PropertyImage';

interface PropertyCardProps {
  property: Property;
  isFavourite?: boolean;
  isUnlocked?: boolean;
  onToggleFavourite?: (id: string, e: React.MouseEvent) => void;
  onUnlock?: (property: Property, e: React.MouseEvent) => void;
  lang?: 'en' | 'ne';
  isOwnerView?: boolean;
  onDelete?: (id: string) => void;
}

export function PropertyCard({
  property,
  isFavourite = false,
  isUnlocked = false,
  onToggleFavourite,
  onUnlock,
  lang = 'en',
  isOwnerView = false,
  onDelete,
}: PropertyCardProps) {
  const [poppingHeart, setPoppingHeart] = useState(false);

  const photoUrl =
    property.photos && property.photos.length > 0 ? property.photos[0] : null;

  const monthlyRent = property.monthly_rent_npr || property.price_npr;
  const subtypeLabel =
    property.property_subtype ||
    (property.bedrooms ? `${property.bedrooms} BHK Flat` : 'Rental');
  const furnishingLabel = formatFurnishing(property.furnishing, lang);
  const tenantLabel = property.preferred_tenant
    ? property.preferred_tenant === 'FAMILY'
      ? lang === 'en'
        ? 'Family'
        : 'परिवार'
      : property.preferred_tenant === 'BACHELOR'
      ? lang === 'en'
        ? 'Bachelors'
        : 'विद्यार्थी/ब्याचलर'
      : property.preferred_tenant === 'COMPANY'
      ? lang === 'en'
        ? 'Company'
        : 'कार्यालय'
      : lang === 'en'
      ? 'Any Tenant'
      : 'जोसुकै'
    : lang === 'en'
    ? 'Family/Bachelor'
    : 'परिवार/ब्याचलर';

  const brokerageSavedFormatted = Number(monthlyRent).toLocaleString('en-IN');
  const brokerageSavedText =
    lang === 'en'
      ? `Save NPR ${brokerageSavedFormatted} brokerage`
      : `रु ${brokerageSavedFormatted} दलाली बचत`;

  const handleHeartClick = (e: React.MouseEvent) => {
    setPoppingHeart(true);
    setTimeout(() => setPoppingHeart(false), 300);
    if (onToggleFavourite) {
      onToggleFavourite(property.id, e);
    }
  };

  return (
    <div className="bg-white/[0.06] rounded-2xl border border-gold/30 hover:border-gold/60 overflow-hidden shadow-card hover:shadow-cardHover hover:-translate-y-1 transition-all duration-400 group flex flex-col justify-between backdrop-blur-xs">
      <div>
        {/* Card Image Banner (4:3 aspect ratio) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          <Link
            href={`/properties/${property.id}`}
            className="block relative w-full h-full"
            aria-label={`View details for ${property.title}`}
          >
            <PropertyImage
              src={photoUrl}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-400 ease-out"
            />
          </Link>

          {/* Top-Left Trust Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {property.admin_verified ? (
              <span
                title="Cadastral Lalpurja verified by Sarvabhoomi"
                className="px-2.5 py-1 rounded-md bg-gold text-black text-[10px] font-black tracking-wide uppercase shadow-subtle flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span>{lang === 'en' ? 'Gold Verified • Lalpurja' : 'प्रमाणित लालपुर्जा'}</span>
              </span>
            ) : property.owner_declared_lalpurja ? (
              <span
                title="Lalpurja claimed by owner — pending cadastral verification by Sarvabhoomi"
                className="px-2.5 py-1 rounded-md bg-white/10 text-gold border border-gold/30 text-[10px] font-bold tracking-wide shadow-subtle flex items-center gap-1 backdrop-blur-md"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-gold" />
                <span>{lang === 'en' ? 'Lalpurja Claimed' : 'लालपुर्जा दावी'}</span>
              </span>
            ) : null}

            <span className="px-2 py-1 rounded-md bg-black/75 text-gold border border-gold/40 text-[10px] font-black uppercase tracking-wide shadow-subtle backdrop-blur-md">
              {lang === 'en' ? 'Direct Owner • 0% Fee' : '०% दलाली • सिधै घरधनी'}
            </span>
          </div>

          {/* Top-Right Interactive Shortlist/Heart Button */}
          {onToggleFavourite && (
            <button
              type="button"
              onClick={handleHeartClick}
              className={`absolute top-3 right-3 w-10 h-10 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all shadow-subtle z-10 ${
                isFavourite
                  ? 'bg-gold text-black scale-105'
                  : 'bg-black/80 text-white border border-white/20 hover:bg-gold hover:text-black'
              } ${poppingHeart ? 'animate-pop' : ''}`}
              title={isFavourite ? 'Remove from shortlist' : 'Save to shortlist'}
              aria-label={isFavourite ? 'Remove from shortlist' : 'Save to shortlist'}
            >
              <Heart className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Owner Delete Button */}
          {isOwnerView && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(property.id)}
              className="absolute top-3 right-3 w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-black/80 text-white hover:bg-gold hover:text-black flex items-center justify-center transition-colors shadow-subtle z-10 border border-white/20"
              title="Delete Listing"
              aria-label="Delete Listing"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Bottom-Left: Subtype & Photo Count Pill */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded bg-black/85 text-gold border border-gold/30 text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
              {subtypeLabel}
            </span>
            {property.photos && property.photos.length > 1 && (
              <span className="px-2 py-0.5 rounded bg-black/85 text-white/85 border border-white/20 text-[10px] font-medium tracking-wider backdrop-blur-xs flex items-center gap-1">
                <Camera className="w-3 h-3 text-gold" />
                <span>{property.photos.length}</span>
              </span>
            )}
          </div>

          {/* Bottom-Right: Views / Unlocks in Owner View */}
          {isOwnerView && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
              <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white/80 text-[10px] flex items-center gap-1 font-mono border border-white/10">
                <Eye className="w-3 h-3 text-gold" />
                <span>{property.views_count || 0}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gold text-black backdrop-blur-md text-[10px] flex items-center gap-1 font-mono font-black">
                <KeyRound className="w-3 h-3" />
                <span>{property.unlocks_count || 0}</span>
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          {/* Prominent Monthly Rent Header in Gold + Savings Callout */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-gold tracking-tight whitespace-nowrap">
                  {formatMonthlyRentNPR(monthlyRent, lang)}
                </h3>
                <span className="text-xs text-white/60 font-semibold">/ mo</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-white/70 block whitespace-nowrap">
                  Deposit: {formatDeposit(property.deposit_npr, lang)}
                </span>
              </div>
            </div>

            {/* Savings Micro-Badge */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wide">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{brokerageSavedText}</span>
              </span>
              {property.maintenance_included ? (
                <span className="text-[10px] text-white/60 font-medium">
                  • {lang === 'en' ? 'Maint. Included' : 'मर्मत समावेश'}
                </span>
              ) : property.maintenance_npr ? (
                <span className="text-[10px] text-white/60 font-medium">
                  • + Rs. {property.maintenance_npr.toLocaleString('en-IN')} Maint.
                </span>
              ) : null}
            </div>

            <Link
              href={`/properties/${property.id}`}
              className="text-sm font-bold text-white hover:text-gold line-clamp-1 transition-colors mt-2.5 block"
            >
              {property.title}
            </Link>
          </div>

          {/* Key Specs Row: 3-Item Metadata (Locality, BHK/Area, Furnishing) */}
          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10 text-xs">
            {/* 1. Locality & Ward / District */}
            <div
              className="flex items-center gap-1.5 text-white/70 min-w-0"
              title={`${property.locality || ''}${property.ward ? `, Ward ${property.ward}` : ''}, ${property.district}`}
            >
              <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="truncate text-white font-medium">
                {property.locality || property.district}
              </span>
            </div>

            {/* 2. Room / Flat Configuration & Area */}
            <div className="flex items-center gap-1.5 text-white/70 min-w-0">
              <Maximize2 className="w-3.5 h-3.5 text-gold/80 shrink-0" />
              <span className="truncate text-white font-medium">
                {property.bedrooms
                  ? `${property.bedrooms} BHK`
                  : `${property.area_sqft || Math.round(property.area_value)}\u00A0sq.ft`}
              </span>
            </div>

            {/* 3. Furnishing & Tenant Status */}
            <div
              className="flex items-center gap-1.5 text-white/70 min-w-0"
              title={`${furnishingLabel} • ${tenantLabel}`}
            >
              <Armchair className="w-3.5 h-3.5 text-gold/80 shrink-0" />
              <span className="truncate text-white/90 font-medium">
                {furnishingLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Action Footer */}
      <div className="p-4 pt-0 border-t border-white/10 flex items-center justify-between gap-3 mt-2">
        <Link
          href={`/properties/${property.id}`}
          className="text-xs font-bold text-white/70 hover:text-gold transition-colors flex items-center gap-1 group/link py-2"
        >
          <span className="group-hover/link:underline decoration-gold decoration-2 underline-offset-4">
            {lang === 'en' ? 'View Details' : 'विवरण'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {onUnlock ? (
          <button
            type="button"
            onClick={(e) => onUnlock(property, e)}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 active:scale-97 ${
              isUnlocked
                ? 'bg-white/10 border border-gold/30 text-gold hover:bg-white/20'
                : 'bg-gold hover:bg-gold/90 text-black font-black hover:-translate-y-0.5'
            }`}
          >
            <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              {isUnlocked
                ? lang === 'en'
                  ? 'Contact Info'
                  : 'सम्पर्क खुल्यो'
                : lang === 'en'
                ? 'Unlock Owner Contact'
                : 'घरधनी सम्पर्क'}
            </span>
          </button>
        ) : (
          <Link
            href={`/properties/${property.id}`}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-subtle flex items-center gap-1.5 bg-gold hover:bg-gold/90 text-black hover:-translate-y-0.5"
          >
            <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{lang === 'en' ? 'Unlock Owner Contact' : 'घरधनी सम्पर्क'}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
