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
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="%23101010"><rect width="400" height="300" fill="%23101010"/><path d="M160 170l30-40 40 50 25-30 45 60H100z" fill="rgba(194,169,100,0.2)"/><circle cx="150" cy="90" r="20" fill="rgba(194,169,100,0.3)"/><text x="50%" y="85%" font-family="sans-serif" font-size="12" font-weight="bold" fill="rgba(194,169,100,0.6)" text-anchor="middle">Sarvabhoomi Cadastral Asset</text></svg>';

export function PropertyImage({
  src,
  alt,
  className = '',
  fallbackIconClassName = 'w-10 h-10 text-gold/40',
  ...rest
}: PropertyImageProps) {
  const [hasError, setHasError] = useState(false);

  // If no source or invalid format, render graceful fallback
  if (!src || hasError) {
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-white/[0.04] text-white/60 select-none ${className}`}
      >
        <Building2 className={`mb-1.5 ${fallbackIconClassName}`} />
        <span className="text-[11px] font-bold tracking-tight text-white/70">
          Photo Unavailable
        </span>
      </div>
    );
  }

  // Handle data: or blob: URLs (e.g. local upload previews)
  const isLocalPreview = src.startsWith('blob:') || src.startsWith('data:');

  if (isLocalPreview) {
    const isFill = Boolean((rest as Record<string, unknown>).fill);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`${isFill ? 'absolute inset-0 w-full h-full' : ''} ${className}`}
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
