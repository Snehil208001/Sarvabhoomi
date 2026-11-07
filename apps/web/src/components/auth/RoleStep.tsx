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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 border border-gold/30 text-gold text-xs font-bold mb-1">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
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
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {dict.roleStep.title}
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto font-medium">
          {dict.roleStep.subtitle}
        </p>
      </div>

      {/* Irreversible Role Notice */}
      <div className="bg-white/[0.04] border border-gold/30 rounded-2xl p-4 text-xs text-white/80 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <strong className="font-bold text-gold">
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
          className={`relative p-6 rounded-3xl border text-left transition-all flex flex-col justify-between group ${
            selectedRole === 'RENTER'
              ? 'border-gold bg-white/10 shadow-card ring-1 ring-gold/50'
              : 'border-white/10 bg-white/[0.04] hover:border-gold/40 hover:bg-white/[0.06]'
          }`}
        >
          {selectedRole === 'RENTER' && (
            <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-gold text-black flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gold text-black flex items-center justify-center shadow-card">
              <Home className="w-6 h-6" />
            </div>

            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-gold bg-gold/20 border border-gold/30 px-2.5 py-0.5 rounded-full mb-1">
                {dict.roleStep.renter.badge}
              </span>
              <h3 className="text-lg font-black text-white leading-snug">
                {dict.roleStep.renter.title}
              </h3>
              <p className="text-xs text-gold font-semibold">
                ({dict.roleStep.renter.nepaliTitle})
              </p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-medium">
              {dict.roleStep.renter.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-black text-gold">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span>{dict.roleStep.renter.perk}</span>
          </div>
        </button>

        {/* 2. OWNER CARD */}
        <button
          type="button"
          onClick={() => onSelectRole('OWNER')}
          className={`relative p-6 rounded-3xl border text-left transition-all flex flex-col justify-between group ${
            selectedRole === 'OWNER'
              ? 'border-gold bg-white/10 shadow-card ring-1 ring-gold/50'
              : 'border-white/10 bg-white/[0.04] hover:border-gold/40 hover:bg-white/[0.06]'
          }`}
        >
          {selectedRole === 'OWNER' && (
            <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-gold text-black flex items-center justify-center shadow-xs">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-gold border border-gold/30 flex items-center justify-center shadow-card">
              <Tag className="w-6 h-6" />
            </div>

            <div>
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-gold bg-gold/20 border border-gold/30 px-2.5 py-0.5 rounded-full mb-1">
                {dict.roleStep.owner.badge}
              </span>
              <h3 className="text-lg font-black text-white leading-snug">
                {dict.roleStep.owner.title}
              </h3>
              <p className="text-xs text-gold font-semibold">
                ({dict.roleStep.owner.nepaliTitle})
              </p>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-medium">
              {dict.roleStep.owner.description}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1.5 text-xs font-black text-gold">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
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
          className="w-full bg-gold hover:bg-gold/90 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 px-4 rounded-2xl shadow-card transition-all flex items-center justify-center gap-2 text-sm min-h-touch"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

