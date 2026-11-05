'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Building2 } from 'lucide-react';

interface PropertyImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src?: string | null;
  alt: string;
  fallbackIconClassName?: string;
}

const DEFAULT_FALLBACK_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23f1f5f9"><rect width="400" height="300" fill="%23f1f5f9"/><path d="M160 170l30-40 40 50 25-30 45 60H100z" fill="%23cbd5e1"/><circle cx="150" cy="90" r="20" fill="%2394a3b8"/><text x="50%" y="85%" font-family="sans-serif" font-size="12" font-weight="bold" fill="%2364748b" text-anchor="middle">Sarvabhoomi Cadastral Asset</text></svg>';

export function PropertyImage({
  src,
  alt,
  className = '',
  fallbackIconClassName = 'w-10 h-10 text-slate-300',
  ...rest
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);

  // If no source or invalid format, render graceful fallback
  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 select-none ${className}`}
      >
        <Building2 className={`mb-1.5 ${fallbackIconClassName}`} />
        <span className="text-[11px] font-medium tracking-tight text-slate-400">
          Photo Unavailable
        </span>
      </div>
    );
  }

  // Handle data: or blob: URLs (e.g. local upload previews)
  const isLocalPreview = src.startsWith('blob:') || src.startsWith('data:');

  if (isLocalPreview) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      blurDataURL={DEFAULT_FALLBACK_SVG}
      placeholder="blur"
      {...rest}
    />
  );
}
