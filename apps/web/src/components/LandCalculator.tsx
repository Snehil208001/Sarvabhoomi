'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRightLeft, Sparkles } from 'lucide-react';
import {
  AreaUnit,
  SQFT_PER_UNIT,
  toSqFt,
  fromSqFt,
  formatArea,
} from '@sarvabhoomi/shared';

interface LandCalculatorProps {
  lang?: 'en' | 'ne';
}

export function LandCalculator({ lang = 'en' }: LandCalculatorProps) {
  const [value, setValue] = useState<number>(4);
  const [unit, setUnit] = useState<AreaUnit>('AANA');

  const sqft = toSqFt(value, unit);

  // Derived conversions
  const ropani = fromSqFt(sqft, 'ROPANI');
  const aana = fromSqFt(sqft, 'AANA');
  const bigha = fromSqFt(sqft, 'BIGHA');
  const kattha = fromSqFt(sqft, 'KATTHA');
  const sqMeters = Math.round((sqft * 0.092903) * 100) / 100;

  return (
    <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 shadow-card space-y-5 text-white backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gold text-black flex items-center justify-center shadow-xs font-black">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gold">
              {lang === 'en' ? 'Nepal Cadastral Land Converter' : 'नेपाल जग्गा नाप क्यालकुलेटर'}
            </h3>
            <p className="text-[11px] text-white/70 font-medium">
              {lang === 'en'
                ? 'Convert seamlessly between Hilly (Ropani-Aana) & Terai (Bigha-Kattha) units'
                : 'पहाडी (रोपनी-आना) र तराई (बिघा-कट्ठा) नाप प्रणाली रूपान्तरण'}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 text-[10px] font-black bg-white/10 text-gold rounded-full border border-gold/30 uppercase tracking-wider">
          GIS Standard
        </span>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-white/70 mb-1">
            {lang === 'en' ? 'Enter Area Quantity' : 'क्षेत्रफल प्रविष्ट गर्नुहोस्'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={value || ''}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
            placeholder="e.g. 4.25"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-white/70 mb-1">
            {lang === 'en' ? 'Select Measurement Unit' : 'नापको एकाइ छान्नुहोस्'}
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as AreaUnit)}
            className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
          >
            <option value="AANA" className="bg-black text-white">Aana (आना) — 342.25 sq ft</option>
            <option value="ROPANI" className="bg-black text-white">Ropani (रोपनी) — 16 Aana / 5,476 sq ft</option>
            <option value="KATTHA" className="bg-black text-white">Kattha (कट्ठा) — 3,645 sq ft</option>
            <option value="BIGHA" className="bg-black text-white">Bigha (बिघा) — 20 Kattha / 72,900 sq ft</option>
            <option value="SQFT" className="bg-black text-white">Square Feet (वर्ग फिट)</option>
          </select>
        </div>
      </div>

      {/* Conversion Output Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <span className="text-[10px] text-white/70 font-bold block uppercase tracking-wider">
            Ropani
          </span>
          <span className="text-base font-black text-white mt-0.5 block font-mono">
            {ropani.toLocaleString()}
          </span>
          <span className="text-[10px] text-white/50 font-semibold">रोपनी</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-gold text-black text-center shadow-xs">
          <span className="text-[10px] text-black/80 font-bold block uppercase tracking-wider">
            Aana
          </span>
          <span className="text-base font-black text-black mt-0.5 block font-mono">
            {aana.toLocaleString()}
          </span>
          <span className="text-[10px] text-black/80 font-semibold">आना</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <span className="text-[10px] text-white/70 font-bold block uppercase tracking-wider">
            Kattha
          </span>
          <span className="text-base font-black text-white mt-0.5 block font-mono">
            {kattha.toLocaleString()}
          </span>
          <span className="text-[10px] text-white/50 font-semibold">कट्ठा</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
          <span className="text-[10px] text-white/70 font-bold block uppercase tracking-wider">
            Bigha
          </span>
          <span className="text-base font-black text-white mt-0.5 block font-mono">
            {bigha.toLocaleString()}
          </span>
          <span className="text-[10px] text-white/50 font-semibold">बिघा</span>
        </div>
      </div>

      {/* Metric & Imperial Reference */}
      <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-gold/30 text-white flex items-center justify-between text-xs shadow-card">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-gold" />
          <span className="font-semibold text-white/90">Total Square Footage:</span>
        </div>
        <div className="font-mono font-black text-gold">
          {sqft.toLocaleString()} sq. ft. ({sqMeters.toLocaleString()} m²)
        </div>
      </div>
    </div>
  );
}

