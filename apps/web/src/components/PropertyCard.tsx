'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Heart,
  MapPin,
  Compass,
  Milestone,
  Bed,
  ArrowRight,
  Phone,
  Eye,
  KeyRound,
  Trash2,
} from 'lucide-react';
import {
  Property,
  formatPriceNPR,
  formatArea,
  formatPricePerUnit,
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
      : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80';

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

          {/* Bottom Left: Listing Type Pill */}
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-semibold tracking-wider uppercase">
              {property.listing_type.replace('_', ' ')}
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
          {/* Price Header */}
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {formatPriceNPR(property.price_npr, lang)}
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {formatPricePerUnit(property.price_npr, property.area_value, property.area_unit, lang)}
              </span>
            </div>
            <Link
              href={`/properties/${property.id}`}
              className="text-sm font-bold text-slate-800 hover:text-emerald-700 line-clamp-1 transition-colors mt-0.5 block"
            >
              {property.title}
            </Link>
          </div>

          {/* Location Landmark */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {property.locality}
              {property.ward ? `, Ward ${property.ward}` : ''}, {property.district}
            </span>
          </div>

          {/* Property Specifications Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="font-semibold text-slate-900">
                {formatArea(property.area_value, property.area_unit, lang)}
              </span>
            </div>

            {property.facing && (
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{property.facing} Facing</span>
              </div>
            )}

            {property.road_access && (
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <Milestone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{property.road_access}</span>
              </div>
            )}

            {property.bedrooms && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Bed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{property.bedrooms} Beds</span>
              </div>
            )}
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
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
                : 'जग्गाधनी सम्पर्क'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

