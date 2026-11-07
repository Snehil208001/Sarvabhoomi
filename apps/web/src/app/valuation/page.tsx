'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import {
  AreaUnit,
  ALL_NEPAL_DISTRICTS,
  calculatePropertyValuation,
  formatPriceNPR,
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-gold selection:text-black flex flex-col justify-between">
      <Navbar
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ne' : 'en'))}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-gold bg-gold/20 px-3.5 py-1 rounded-full border border-gold/30 inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gold" />
            <span>{lang === 'en' ? 'Nepal Property Valuation Benchmark' : 'नेपाल घरजग्गा मूल्याङ्कन इन्जिन'}</span>
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {lang === 'en' ? 'Land & Property Valuation Calculator' : 'जग्गाको सरकारी तथा बजार मूल्याङ्कन'}
          </h1>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-medium">
            {lang === 'en'
              ? 'Calculate indicative government minimum valuation (मालपोत दर) vs realistic market prices across Nepal, with instant 0% brokerage savings calculation.'
              : 'आफ्नो जग्गाको सरकारी न्यूनतम मूल्याङ्कन, बजार दर र दलालविहीन कारोबारमा बचत हुने कमिसन रकम तुरुन्त निकाल्नुहोस्।'}
          </p>
        </div>

        {/* Valuation Card */}
        <div className="bg-white/[0.06] rounded-3xl border border-gold/30 p-6 sm:p-8 shadow-card space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* District Selection */}
            <div>
              <label className="block text-xs font-black text-white mb-1.5 uppercase tracking-wider">
                {lang === 'en' ? 'District' : 'जिल्ला'}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              >
                {ALL_NEPAL_DISTRICTS.map((d) => (
                  <option key={d.nameEn} value={d.nameEn} className="bg-black text-white">
                    {lang === 'en' ? d.nameEn : `${d.nameEn} (${d.nameNe})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Value */}
            <div>
              <label className="block text-xs font-black text-white mb-1.5 uppercase tracking-wider">
                {lang === 'en' ? 'Area Quantity' : 'क्षेत्रफल परिमाण'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={areaValue || ''}
                onChange={(e) => setAreaValue(parseFloat(e.target.value) || 0)}
                placeholder="e.g. 4.25"
                className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm font-black text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>

            {/* Area Unit */}
            <div>
              <label className="block text-xs font-black text-white mb-1.5 uppercase tracking-wider">
                {lang === 'en' ? 'Measurement Unit' : 'नापको एकाइ'}
              </label>
              <select
                value={areaUnit}
                onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
              >
                <option value="AANA" className="bg-black text-white">Aana (आना)</option>
                <option value="ROPANI" className="bg-black text-white">Ropani (रोपनी)</option>
                <option value="KATTHA" className="bg-black text-white">Kattha (कट्ठा)</option>
                <option value="BIGHA" className="bg-black text-white">Bigha (बिघा)</option>
                <option value="SQFT" className="bg-black text-white">Square Feet (वर्ग फिट)</option>
              </select>
            </div>
          </div>

          {/* Indicative Disclaimer Notice Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-gold/40 flex items-start gap-3 shadow-subtle">
            <span className="px-2 py-0.5 rounded-lg bg-gold text-black text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5">
              Notice
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white leading-relaxed">
                {lang === 'en'
                  ? 'Indicative rates only, not an official appraisal — confirm with a local licensed agent or cadastral survey office.'
                  : 'यी दरहरू सांकेतिक मात्र हुन्, आधिकारिक मूल्याङ्कन होइनन् — कृपया स्थानीय इजाजतप्राप्त एजेन्ट वा मालपोत कार्यालयसँग पुष्टि गर्नुहोस्।'}
              </p>
              <p className="text-[11px] text-white/70">
                {lang === 'en'
                  ? 'Real estate transaction prices vary based on actual road access, elevation, zoning, and immediate market liquidity.'
                  : 'वास्तविक कारोबार मूल्य सडकको पहुँच, मोहडा, जग्गाको वर्गीकरण र तत्कालीन बजार तरलता अनुसार फरक हुन सक्छ।'}
              </p>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {/* Market Valuation */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                {lang === 'en' ? 'Estimated Market Value' : 'अनुमानित बजार मूल्य'}
              </span>
              <div className="text-2xl font-black text-gold tracking-tight">
                {formatPriceNPR(valuation.marketEstimatedTotal, lang)}
              </div>
              <p className="text-[11px] text-white/60 font-medium">
                Range: {formatPriceNPR(valuation.marketRangeLow, lang)} – {formatPriceNPR(valuation.marketRangeHigh, lang)}
              </p>
            </div>

            {/* Government Minimum Valuation */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                {lang === 'en' ? 'Govt. Minimum (मालपोत दर)' : 'सरकारी न्यूनतम मूल्याङ्कन'}
              </span>
              <div className="text-2xl font-black text-white tracking-tight">
                {formatPriceNPR(valuation.governmentMinTotal, lang)}
              </div>
              <p className="text-[11px] text-white/60 font-medium">
                Est. Reg. Tax (~4.5%): {formatPriceNPR(valuation.registrationTaxEstimate, lang)}
              </p>
            </div>

            {/* Brokerage Saved */}
            <div className="p-5 rounded-2xl bg-white/[0.06] border border-gold/30 text-gold space-y-1 shadow-card">
              <span className="text-[11px] font-black text-gold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>{lang === 'en' ? '0% Brokerage Savings' : 'शून्य दलाली बचत'}</span>
              </span>
              <div className="text-2xl font-black text-gold tracking-tight">
                {formatPriceNPR(valuation.brokerageSavedAt3Pct, lang)}
              </div>
              <p className="text-[11px] text-white/70 font-medium">
                Saved compared to 3% broker commission
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
            <Link
              href={`/search?district=${district}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 active:scale-97 text-white text-xs font-bold transition-all shadow-card"
            >
              <span>Explore listings in {district}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold" />
            </Link>

            <Link
              href="/post-property"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-gold hover:bg-gold/90 active:scale-97 text-black text-xs font-black transition-all shadow-card"
            >
              <PlusCircle className="w-3.5 h-3.5" />
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
