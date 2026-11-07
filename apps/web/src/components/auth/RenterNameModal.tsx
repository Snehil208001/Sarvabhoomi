'use client';

import React, { useState } from 'react';
import { User, ArrowRight, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { FULL_NAME_MIN_LENGTH, getAuthDict } from '@sarvabhoomi/shared';

interface RenterNameModalProps {
  isOpen: boolean;
  userId: string;
  lang?: 'en' | 'ne';
  onClose: () => void;
  onSuccess: (savedName: string) => void;
}

export function RenterNameModal({
  isOpen,
  userId,
  lang = 'en',
  onClose,
  onSuccess,
}: RenterNameModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dict = getAuthDict(lang);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < FULL_NAME_MIN_LENGTH) {
      setError(dict.lazyGate.fullNameError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateErr) {
        setError(updateErr.message || 'Failed to save name. Please try again.');
        return;
      }

      onSuccess(trimmed);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error updating profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white/[0.06] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-cardHover border border-gold/30 space-y-5 text-white animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
              <User className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-black text-white">
              {dict.lazyGate.renterTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-white/70 leading-relaxed font-medium">
          {dict.lazyGate.renterSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-white mb-1.5 uppercase tracking-wider">
              {dict.lazyGate.fullNameLabel} *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder={dict.lazyGate.fullNamePlaceholder}
              autoFocus
              className="w-full bg-black/60 border border-white/20 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            {error && (
              <div className="mt-2 p-2.5 rounded-xl bg-white/5 border border-gold/40 text-xs text-gold font-bold flex items-center gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-gold" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || name.trim().length < FULL_NAME_MIN_LENGTH}
            className="w-full bg-gold hover:bg-gold/90 active:scale-97 disabled:opacity-50 text-black font-black py-3.5 px-4 rounded-2xl shadow-subtle transition-all flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{dict.lazyGate.saveAndContinue}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
