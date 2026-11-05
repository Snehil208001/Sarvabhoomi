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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {lang === 'en' ? 'Nepal Cadastral Land Converter' : 'नेपाल जग्गा नाप क्यालकुलेटर'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'en'
                ? 'Convert seamlessly between Hilly (Ropani-Aana) & Terai (Bigha-Kattha) units'
                : 'पहाडी (रोपनी-आना) र तराई (बिघा-कट्ठा) नाप प्रणाली रूपान्तरण'}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
          GIS Standard
        </span>
      </div>

      {/* Input controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {lang === 'en' ? 'Enter Area Quantity' : 'क्षेत्रफल प्रविष्ट गर्नुहोस्'}
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={value || ''}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            placeholder="e.g. 4.25"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {lang === 'en' ? 'Select Measurement Unit' : 'नापको एकाइ छान्नुहोस्'}
          </label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as AreaUnit)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
          >
            <option value="AANA">Aana (आना) — 342.25 sq ft</option>
            <option value="ROPANI">Ropani (रोपनी) — 16 Aana / 5,476 sq ft</option>
            <option value="KATTHA">Kattha (कट्ठा) — 3,645 sq ft</option>
            <option value="BIGHA">Bigha (बिघा) — 20 Kattha / 72,900 sq ft</option>
            <option value="SQFT">Square Feet (वर्ग फिट)</option>
          </select>
        </div>
      </div>

      {/* Conversion Output Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
            Ropani
          </span>
          <span className="text-base font-extrabold text-slate-900 mt-0.5 block font-mono">
            {ropani.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">रोपनी</span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-center">
          <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">
            Aana
          </span>
          <span className="text-base font-extrabold text-emerald-950 mt-0.5 block font-mono">
            {aana.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-700">आना</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
            Kattha
          </span>
          <span className="text-base font-extrabold text-slate-900 mt-0.5 block font-mono">
            {kattha.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">कट्ठा</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
            Bigha
          </span>
          <span className="text-base font-extrabold text-slate-900 mt-0.5 block font-mono">
            {bigha.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400">बिघा</span>
        </div>
      </div>

      {/* Metric & Imperial Reference */}
      <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
          <span>Total Square Footage:</span>
        </div>
        <div className="font-mono font-bold text-emerald-400">
          {sqft.toLocaleString()} sq. ft. ({sqMeters.toLocaleString()} m²)
        </div>
      </div>
    </div>
  );
}
