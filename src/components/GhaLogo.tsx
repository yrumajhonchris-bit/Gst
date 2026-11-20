import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

export function GhaLogo({
  size = 'md',
  onClick,
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}) {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const inner = (
    <>
      <svg
        viewBox="0 0 64 64"
        className={`${iconSize} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ghaNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B2545" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="ghaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6B84C" />
            <stop offset="100%" stopColor="#B5811F" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="29" fill="url(#ghaNavy)" stroke="url(#ghaGold)" strokeWidth="2.5" />
        <path
          d="M16 44V26l8-6v24h-8zm12 0V16l8-5v33h-8zm12 0V22l8 5v17h-8z"
          fill="#FFFFFF"
          fillOpacity="0.92"
        />
        <path
          d="M10 44c12 6 32 6 44 0"
          fill="none"
          stroke="url(#ghaGold)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display font-extrabold tracking-tight text-[#0B2545] text-lg whitespace-nowrap">
          GST
        </span>
        {size !== 'sm' && (
          <span className="text-[10px] font-medium text-slate-500 tracking-wide whitespace-nowrap">
            GST Hospitality Alliance
          </span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="GST"
        className="inline-flex items-center gap-2.5 shrink-0 text-left bg-transparent border-0 p-0 cursor-pointer focus:outline-none"
      >
        {inner}
      </button>
    );
  }

  return <div className="inline-flex items-center gap-2.5 shrink-0">{inner}</div>;
}

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-7 h-7 mb-1 text-slate-400" />
        <span className="text-xs font-medium px-2 text-center line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
