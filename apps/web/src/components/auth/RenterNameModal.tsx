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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-800">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              {dict.lazyGate.renterTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {dict.lazyGate.renterSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || name.trim().length < FULL_NAME_MIN_LENGTH}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{dict.lazyGate.saveAndContinue}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
