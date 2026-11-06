'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Heart,
  MapPin,
  Calendar,
  Bed,
  ArrowRight,
  Phone,
  Eye,
  KeyRound,
  Trash2,
  Users,
  Armchair,
  Maximize2,
} from 'lucide-react';
import {
  Property,
  formatMonthlyRentNPR,
  formatDeposit,
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
  const photoUrl =
    property.photos && property.photos.length > 0
      ? property.photos[0]
      : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

  const monthlyRent = property.monthly_rent_npr || property.price_npr;
  const subtypeLabel = property.property_subtype || (property.bedrooms ? `${property.bedrooms} BHK Flat` : 'Rental');
  const furnishingLabel = property.furnishing
    ? `${property.furnishing.charAt(0) + property.furnishing.slice(1).toLowerCase()} Furnished`
    : (lang === 'en' ? 'Furnishing N/A' : 'फर्निसिङ उल्लेख छैन');
  const tenantLabel = property.preferred_tenant
    ? property.preferred_tenant === 'FAMILY'
      ? (lang === 'en' ? 'Family Preferred' : 'परिवारलाई प्राथमिकता')
      : property.preferred_tenant === 'BACHELOR'
      ? (lang === 'en' ? 'Bachelors Allowed' : 'विद्यार्थी/ब्याचलर')
      : property.preferred_tenant === 'COMPANY'
      ? (lang === 'en' ? 'Company / Office' : 'कम्पनी / कार्यालय')
      : (lang === 'en' ? 'Any Tenant' : 'जोसुकै')
    : (lang === 'en' ? 'Family / Bachelor' : 'परिवार वा ब्याचलर');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col justify-between">
      <div>
        {/* Card Image Banner */}
        <div className="relative h-52 w-full overflow-hidden bg-slate-100">
          <Link href={`/properties/${property.id}`} className="block relative w-full h-full">
            <PropertyImage
              src={photoUrl}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {property.admin_verified ? (
              <span
                title="Government cadastral verified by Sarvabhoomi"
                className="px-2.5 py-1 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs flex items-center gap-1 backdrop-blur-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Lalpurja Verified</span>
              </span>
            ) : property.owner_declared_lalpurja ? (
              <span
                title="Lalpurja claimed by owner — pending cadastral verification by Sarvabhoomi"
                className="px-2.5 py-1 rounded-md bg-slate-900/80 text-amber-300 border border-amber-400/40 text-[10px] font-semibold tracking-wide shadow-xs flex items-center gap-1 backdrop-blur-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                <span>Claimed (Pending)</span>
              </span>
            ) : null}

            <span className="px-2 py-1 rounded-md bg-white/95 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wide shadow-2xs">
              0% Brokerage
            </span>
          </div>

          {/* Favorite Heart Button */}
          {onToggleFavourite && (
            <button
              type="button"
              onClick={(e) => onToggleFavourite(property.id, e)}
              className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs backdrop-blur-xs ${
                isFavourite
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
              }`}
              title={isFavourite ? 'Remove from shortlist' : 'Save to shortlist'}
            >
              <Heart className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`} />
            </button>
          )}

          {/* Owner Delete Button */}
          {isOwnerView && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(property.id)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-slate-600 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors shadow-xs"
              title="Delete Listing"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Bottom Left: Property Subtype Pill */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
              {subtypeLabel}
            </span>
          </div>

          {/* Bottom Right: Views / Unlocks in Owner View */}
          {isOwnerView && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] flex items-center gap-1 font-mono">
                <Eye className="w-3 h-3" />
                <span>{property.views_count || 0}</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-md text-white text-[10px] flex items-center gap-1 font-mono font-bold">
                <KeyRound className="w-3 h-3" />
                <span>{property.unlocks_count || 0}</span>
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          {/* Prominent Monthly Rent Header (NoBroker layout) */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                {formatMonthlyRentNPR(monthlyRent, lang)}
              </h3>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Deposit: {formatDeposit(property.deposit_npr, lang)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {property.maintenance_npr
                    ? `+ Rs. ${property.maintenance_npr.toLocaleString('en-IN')} Maint.`
                    : property.maintenance_included
                    ? (lang === 'en' ? 'Maint. Included' : 'मर्मत समावेश')
                    : (lang === 'en' ? 'No Maint. Fee' : 'कुनै अतिरिक्त मर्मत शुल्क छैन')}
                </span>
              </div>
            </div>

            <Link
              href={`/properties/${property.id}`}
              className="text-sm font-bold text-slate-900 hover:text-emerald-700 line-clamp-1 transition-colors mt-1 block"
            >
              {property.title}
            </Link>
          </div>

          {/* Locality Landmark */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {property.locality}
              {property.ward ? `, Ward ${property.ward}` : ''}, {property.district}
            </span>
          </div>

          {/* NoBroker-style Rental Specs Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-100 text-xs">
            {/* Built-up Area */}
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900 truncate">
                {property.area_sqft || Math.round(property.area_value)} sq. ft.
              </span>
            </div>

            {/* Furnishing */}
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <Armchair className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{furnishingLabel}</span>
            </div>

            {/* Preferred Tenant */}
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">{tenantLabel}</span>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium text-emerald-800">
                {property.available_from
                  ? `From ${property.available_from}`
                  : (lang === 'en' ? 'Ready to Move' : 'तुरुन्त सर्न सकिने')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
        <Link
          href={`/properties/${property.id}`}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <span>{lang === 'en' ? 'View Details' : 'विवरण'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {onUnlock && (
          <button
            type="button"
            onClick={(e) => onUnlock(property, e)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              isUnlocked
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>
              {isUnlocked
                ? lang === 'en'
                  ? 'Contact Info'
                  : 'सम्पर्क खुल्यो'
                : lang === 'en'
                ? 'Contact Owner'
                : 'घरधनी सम्पर्क'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
