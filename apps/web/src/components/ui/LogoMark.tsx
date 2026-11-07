import React from 'react';
import Image from 'next/image';

interface LogoMarkProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  glow?: boolean;
  priority?: boolean;
  alt?: string;
}

const sizeConfig = {
  xs: { px: 28, className: 'w-7 h-7' },
  sm: { px: 36, className: 'w-8 h-8 sm:w-9 sm:h-9' },
  md: { px: 44, className: 'w-10 h-10 sm:w-11 sm:h-11' },
  lg: { px: 56, className: 'w-12 h-12 sm:w-14 sm:h-14' },
  xl: { px: 110, className: 'w-[88px] h-[88px] sm:w-[110px] sm:h-[110px]' },
};

export function LogoMark({
  size = 'md',
  className = '',
  glow = false,
  priority = false,
  alt = 'Sarvabhoomi Capital & Investment Official Seal',
}: LogoMarkProps) {
  const isPreset = typeof size === 'string' && size in sizeConfig;
  const px = isPreset ? sizeConfig[size as keyof typeof sizeConfig].px : (size as number);
  const sizeClasses = isPreset ? sizeConfig[size as keyof typeof sizeConfig].className : '';

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 ring-1 ring-gold/30 ${
        glow ? 'drop-shadow-[0_0_20px_rgba(194,169,100,0.35)]' : 'shadow-subtle'
      } ${sizeClasses} ${className}`}
      style={!isPreset ? { width: px, height: px } : undefined}
    >
      <Image
        src="/logo/logo-mark.png"
        alt={alt}
        width={px}
        height={px}
        priority={priority}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
