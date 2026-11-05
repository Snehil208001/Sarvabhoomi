'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Calculator,
  ShieldCheck,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Coins,
} from 'lucide-react';
import {
  AreaUnit,
  ALL_NEPAL_DISTRICTS,
  calculatePropertyValuation,
  formatPriceNPR,
  formatArea,
} from '@sarvabhoomi/shared';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LandCalculator } from '@/components/LandCalculator';

export default function ValuationPage() {
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const [district, setDistrict] = useState('Kathmandu');
  const [areaValue, setAreaValue] = useState<number>(4);
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('AANA');

  const valuation = calculatePropertyValuation(district, areaValue, areaUnit);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white flex flex-col justify-between">
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Nepal Property Valuation Benchmark' : 'नेपाल घरजग्गा मूल्याङ्कन इन्जिन'}</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {lang === 'en' ? 'Land & Property Valuation Calculator' : 'जग्गाको सरकारी तथा बजार मूल्याङ्कन'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {lang === 'en'
              ? 'Calculate indicative government minimum valuation (मालपोत दर) vs realistic market prices across Nepal, with instant 0% brokerage savings calculation.'
              : 'आफ्नो जग्गाको सरकारी न्यूनतम मूल्याङ्कन, बजार दर र दलालविहीन कारोबारमा बचत हुने कमिसन रकम तुरुन्त निकाल्नुहोस्।'}
          </p>
        </div>

        {/* Valuation Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* District Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {lang === 'en' ? 'District' : 'जिल्ला'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                {ALL_NEPAL_DISTRICTS.map((d) => (
                  <option key={d.nameEn} value={d.nameEn}>
                    {lang === 'en' ? d.nameEn : `${d.nameEn} (${d.nameNe})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Value */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {lang === 'en' ? 'Area Quantity' : 'क्षेत्रफल परिमाण'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={areaValue || ''}
                onChange={(e) => setAreaValue(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 4.25"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            {/* Area Unit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                {lang === 'en' ? 'Measurement Unit' : 'नापको एकाइ'}
              </label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="AANA">Aana (आना)</option>
                <option value="ROPANI">Ropani (रोपनी)</option>
                <option value="KATTHA">Kattha (कट्ठा)</option>
                <option value="BIGHA">Bigha (बिघा)</option>
                <option value="SQFT">Square Feet (वर्ग फिट)</option>
              </select>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {/* Market Valuation */}
            <div className="p-5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                {lang === 'en' ? 'Estimated Market Value' : 'अनुमानित बजार मूल्य'}
              </span>
              <div className="text-2xl font-extrabold text-emerald-950 tracking-tight">
                {formatPriceNPR(valuation.marketEstimatedTotal, lang)}
              </div>
              <p className="text-[11px] text-emerald-800">
                Range: {formatPriceNPR(valuation.marketRangeLow, lang)} – {formatPriceNPR(valuation.marketRangeHigh, lang)}
              </p>
            </div>

            {/* Government Minimum Valuation */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {lang === 'en' ? 'Govt. Minimum (मालपोत दर)' : 'सरकारी न्यूनतम मूल्याङ्कन'}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {formatPriceNPR(valuation.governmentMinTotal, lang)}
              </div>
              <p className="text-[11px] text-slate-500">
                Est. Reg. Tax (~4.5%): {formatPriceNPR(valuation.registrationTaxEstimate, lang)}
              </p>
            </div>

            {/* Brokerage Saved */}
            <div className="p-5 rounded-xl bg-slate-900 text-white space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'en' ? '0% Brokerage Savings' : 'शून्य दलाली बचत'}</span>
              </span>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {formatPriceNPR(valuation.brokerageSavedAt3Pct, lang)}
              </div>
              <p className="text-[11px] text-slate-300">
                Saved compared to 3% broker commission
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <Link
              href={`/search?district=${district}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Explore listings in {district}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/post-property"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Post Your Property for Free</span>
            </Link>
          </div>
        </div>

        {/* Embedded Land Measurement Unit Converter */}
        <LandCalculator lang={lang} />
      </main>

      <Footer lang={lang} />
    </div>
  );
}
