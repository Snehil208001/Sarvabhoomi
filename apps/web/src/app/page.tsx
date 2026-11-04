'use client';

import React, { useState, useId } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  Phone,
  Layers,
  Database as DbIcon,
  Globe2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Landmark,
  Coins,
  Lock,
} from 'lucide-react';
import {
  phoneAuthSchema,
  onboardingSchema,
  nepalPhoneRegex,
  DISTRICT_REGION_MAP,
  ALL_DISTRICTS,
  getRegionForDistrict,
  LAND_MEASUREMENT_SYSTEM_INFO,
  getAuthDict,
  UserIntent,
  PreferredRegion,
} from '@sarvabhoomi/shared';

export default function Day1DashboardPage() {
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  const dict = getAuthDict(lang);

  // Phone Validation Demo State
  const [phoneNumber, setPhoneNumber] = useState('9841234567');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>('Nepal Telecom (NTC)');

  // Onboarding Interactive State
  const [fullName, setFullName] = useState('Ram Bahadur Shrestha');
  const [userIntent, setUserIntent] = useState<UserIntent>('BUYER');
  const [selectedDistrict, setSelectedDistrict] = useState('Kathmandu');
  const [preferredRegion, setPreferredRegion] = useState<PreferredRegion>('HILLY');
  const [onboardingSuccess, setOnboardingSuccess] = useState(false);
  const [onboardingErrors, setOnboardingErrors] = useState<Record<string, string>>({});

  // Dynamic IDs for form accessibility
  const phoneInputId = useId();
  const nameInputId = useId();
  const districtSelectId = useId();

  // Handle phone changes with instant carrier & regex evaluation
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const cleaned = val.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, '');

    if (!cleaned) {
      setPhoneError(null);
      setDetectedCarrier(null);
      return;
    }

    if (nepalPhoneRegex.test(cleaned)) {
      setPhoneError(null);
      if (cleaned.startsWith('984') || cleaned.startsWith('985') || cleaned.startsWith('986') || cleaned.startsWith('974') || cleaned.startsWith('975')) {
        setDetectedCarrier('Nepal Telecom (NTC)');
      } else if (cleaned.startsWith('980') || cleaned.startsWith('981') || cleaned.startsWith('982') || cleaned.startsWith('970')) {
        setDetectedCarrier('Ncell Axiata');
      } else {
        setDetectedCarrier('Nepali Telecom Operator');
      }
    } else {
      setPhoneError(dict.phoneAuth.invalidPhoneError);
      setDetectedCarrier(null);
    }
  };

  // Auto-detect measurement region when district changes
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    const autoRegion = getRegionForDistrict(district);
    setPreferredRegion(autoRegion);
  };

  // Validate onboarding schema
  const handleValidateOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onboardingSchema.safeParse({
      fullName,
      userIntent,
      preferredRegion,
      preferredDistrict: selectedDistrict,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setOnboardingErrors(fieldErrors);
      setOnboardingSuccess(false);
    } else {
      setOnboardingErrors({});
      setOnboardingSuccess(true);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Top Header & Brand Bar */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-xl shadow-md">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{dict.brand.name}</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-300">
                  Day 1 Ready
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-700">{dict.brand.tagline}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 max-w-2xl">{dict.brand.subTagline}</p>
        </div>

        {/* Navigation & Language Switcher */}
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md hover:shadow-lg"
          >
            <Lock className="w-4 h-4" />
            <span>Launch Auth & Onboarding</span>
          </Link>
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ne' : 'en')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-sm hover:shadow"
          >
            <Globe2 className="w-4 h-4 text-emerald-600" />
            <span>{dict.common.languageToggle}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">
              {lang}
            </span>
          </button>
        </div>
      </header>

      {/* Promotional Stage 1 Launch Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              {dict.promo.claimBadge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {dict.promo.claimTitle}
            </h2>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              {dict.promo.claimDescription}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-emerald-200">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{dict.promo.creditsHighlight}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{dict.promo.zeroBrokerageGuarantee}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 text-center min-w-[240px] space-y-3">
            <div className="text-xs text-emerald-200 uppercase font-bold tracking-wider">
              Launch Allocation
            </div>
            <div className="text-4xl font-black text-amber-300">15 Credits</div>
            <div className="text-xs text-slate-200">Trigger: `trg_on_profile_created`</div>
            <Link
              href="/auth"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-sm transition-all shadow-md hover:shadow-lg"
            >
              <span>{dict.promo.claimCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Grid: Interactive Validation Demo & System Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Interactive Shared Package Validator Demo */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Phone Auth Regex Demo */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{dict.phoneAuth.title}</h3>
                  <p className="text-xs text-slate-500">
                    Validated via <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">nepalPhoneRegex</code>
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                +977 (NTC & Ncell)
              </span>
            </div>

            <div className="space-y-3">
              <label htmlFor={phoneInputId} className="block text-xs font-semibold text-slate-700">
                {dict.phoneAuth.phoneLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-semibold text-sm">
                  +977
                </div>
                <input
                  id={phoneInputId}
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="98XXXXXXXX"
                  className={`w-full pl-16 pr-4 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 font-mono ${
                    phoneError
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-slate-300 focus:ring-emerald-500 bg-white'
                  }`}
                />
              </div>

              {detectedCarrier && !phoneError && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Valid Nepali Number detected: <strong>{detectedCarrier}</strong>
                  </span>
                </div>
              )}

              {phoneError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{phoneError}</span>
                </div>
              )}

              <p className="text-xs text-slate-500">{dict.phoneAuth.phoneHint}</p>
            </div>
          </div>

          {/* Section 2: Onboarding & District Land Unit Dual Mapping */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{dict.onboarding.title}</h3>
                  <p className="text-xs text-slate-500">{dict.onboarding.subtitle}</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">
                Zod Schema Validated
              </span>
            </div>

            <form onSubmit={handleValidateOnboarding} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor={nameInputId} className="block text-xs font-semibold text-slate-700">
                  {dict.onboarding.fullNameLabel}
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={dict.onboarding.fullNamePlaceholder}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {onboardingErrors.fullName && (
                  <p className="text-xs text-red-600">{onboardingErrors.fullName}</p>
                )}
              </div>

              {/* User Intent Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  {dict.onboarding.intentLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['BUYER', 'OWNER', 'INVESTOR_NRN'] as UserIntent[]).map((intent) => {
                    const isSelected = userIntent === intent;
                    const meta = dict.onboarding.intents[intent];
                    return (
                      <button
                        key={intent}
                        type="button"
                        onClick={() => setUserIntent(intent)}
                        className={`text-left p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-slate-900">{meta.title}</div>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {meta.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* District & Dynamic Region Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor={districtSelectId} className="block text-xs font-semibold text-slate-700">
                    {dict.onboarding.districtLabel}
                  </label>
                  <select
                    id={districtSelectId}
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {ALL_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d} ({DISTRICT_REGION_MAP[d] === 'HILLY' ? 'Hilly/Valley' : 'Terai Plain'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700">
                    Measurement System (Auto-Mapped)
                  </span>
                  <div className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800 flex items-center justify-between">
                    <span>
                      {preferredRegion === 'HILLY' ? '🏔️ Hilly (रोपनी - आना)' : '🌾 Terai (बिघा - कट्ठा)'}
                    </span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded shadow-xs">
                      {preferredRegion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Land Unit Banner Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Active Land Unit Hierarchy
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    {LAND_MEASUREMENT_SYSTEM_INFO[preferredRegion].systemName}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {LAND_MEASUREMENT_SYSTEM_INFO[preferredRegion].units.map((unit, idx) => (
                    <span
                      key={unit}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 shadow-2xs"
                    >
                      {unit} ({LAND_MEASUREMENT_SYSTEM_INFO[preferredRegion].unitsNe[idx]})
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  {LAND_MEASUREMENT_SYSTEM_INFO[preferredRegion].description}
                </p>
              </div>

              {onboardingSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Validation Passed! Profile parameters successfully match Zod onboarding specification.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>{dict.onboarding.submitButton}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols): Architecture Specifications & Supabase Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Supabase Schema Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DbIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Supabase Architecture</h3>
                <p className="text-xs text-slate-500">Day 1 Migration: 20261103000001_auth_and_onboarding</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Table 1: app_config */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="font-mono">public.app_config</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">Singleton</span>
                </div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                  <li><code className="text-slate-900">launch_free_credits</code>: Default 15</li>
                  <li><code className="text-slate-900">is_gis_polygon_free</code>: Default TRUE</li>
                  <li>Seeded row ID 1 (Stage 1 Launch Mode)</li>
                </ul>
              </div>

              {/* Table 2: profiles */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="font-mono">public.profiles</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">RLS Active</span>
                </div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                  <li>FK: <code className="text-slate-900">id UUID REFERENCES auth.users</code></li>
                  <li><code className="text-slate-900">phone_np VARCHAR(15) UNIQUE</code></li>
                  <li>Intent enum: BUYER, OWNER, INVESTOR_NRN</li>
                  <li>Region: HILLY / TERAI</li>
                  <li>RLS Policies: SELECT, INSERT, UPDATE for <code className="text-slate-900">auth.uid() = id</code></li>
                </ul>
              </div>

              {/* Table 3: user_subscriptions */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="font-mono">public.user_subscriptions</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">RLS Active</span>
                </div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside text-[11px]">
                  <li>FK: <code className="text-slate-900">user_id REFERENCES public.profiles(id)</code></li>
                  <li><code className="text-slate-900">plan_tier</code>: 'LAUNCH_PROMO'</li>
                  <li><code className="text-slate-900">credits_remaining</code>: 15 credits</li>
                  <li><code className="text-slate-900">expires_at</code>: 90 days grant</li>
                </ul>
              </div>

              {/* Trigger */}
              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-emerald-950">
                  <span className="font-mono text-xs">trg_on_profile_created</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">Trigger</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Calls <code className="font-mono text-emerald-950 font-bold">public.handle_new_user_subscription()</code> (SECURITY DEFINER) on <code className="font-mono">AFTER INSERT ON public.profiles</code> to read credits from <code className="font-mono">app_config</code> and seed the 15-credit promotional subscription.
                </p>
              </div>
            </div>
          </div>

          {/* Monorepo Topology Overview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Monorepo Workspace Topology
            </h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span>apps/web</span>
                <span className="text-slate-500 font-sans text-[11px]">Next.js 14 App Router + Tailwind</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span>packages/shared</span>
                <span className="text-slate-500 font-sans text-[11px]">Zod, Districts & i18n</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span>supabase/migrations</span>
                <span className="text-slate-500 font-sans text-[11px]">PostgreSQL 15+ Schema & RLS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
