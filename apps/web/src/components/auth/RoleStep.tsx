'use client';

import React from 'react';
import { Home, Tag, Check, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { UserRole, AuthDictionary } from '@sarvabhoomi/shared';

interface RoleStepProps {
  selectedRole: UserRole;
  isRoleMigration: boolean;
  isSubmitting: boolean;
  lang: 'en' | 'ne';
  dict: AuthDictionary;
  onSelectRole: (role: UserRole) => void;
  onConfirmRole: () => void;
}

export function RoleStep({
  selectedRole,
  isRoleMigration,
  isSubmitting,
  lang,
  dict,
  onSelectRole,
  onConfirmRole,
}: RoleStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {isRoleMigration
              ? lang === 'en'
                ? 'One-Time Role Update'
                : 'एकपटक भूमिका छनोट'
              : lang === 'en'
              ? 'Final Step • Under 1 Minute'
              : 'अन्तिम चरण • १ मिनेट भित्र'}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {dict.roleStep.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          {dict.roleStep.subtitle}
        </p>
      </div>

      {/* Irreversible Role Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-bold">
            {lang === 'en' ? 'Important: ' : 'महत्त्वपूर्ण: '}
          </strong>
          {dict.roleStep.oneRoleNotice}
        </p>
      </div>

      {/* Exactly 2 Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. RENTER CARD */}
        <button
          type="button"
          onClick={() => onSelectRole('RENTER')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between group ${
            selectedRole === 'RENTER'
              ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          {selectedRole === 'RENTER' && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4" />
            </div>
          )}

          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Home className="w-6 h-6 text-emerald-700" />
            </div>

            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded mb-1">
                {dict.roleStep.renter.badge}
              </span>
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {dict.roleStep.renter.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ({dict.roleStep.renter.nepaliTitle})
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {dict.roleStep.renter.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-100/60 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{dict.roleStep.renter.perk}</span>
          </div>
        </button>

        {/* 2. OWNER CARD */}
        <button
          type="button"
          onClick={() => onSelectRole('OWNER')}
          className={`relative p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between group ${
            selectedRole === 'OWNER'
              ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          {selectedRole === 'OWNER' && (
            <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4" />
            </div>
          )}

          <div className="space-y-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Tag className="w-6 h-6 text-slate-700" />
            </div>

            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-slate-800 bg-slate-200 px-2 py-0.5 rounded mb-1">
                {dict.roleStep.owner.badge}
              </span>
              <h3 className="text-base font-black text-slate-900 leading-snug">
                {dict.roleStep.owner.title}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ({dict.roleStep.owner.nepaliTitle})
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {dict.roleStep.owner.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{dict.roleStep.owner.perk}</span>
          </div>
        </button>
      </div>

      {/* Confirmation Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onConfirmRole}
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm min-h-touch"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>
                {lang === 'en' ? 'Setting up your account...' : 'खाता सेटअप गरिँदैछ...'}
              </span>
            </>
          ) : (
            <>
              <span>
                {selectedRole === 'RENTER'
                  ? dict.roleStep.renter.cta
                  : dict.roleStep.owner.cta}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
