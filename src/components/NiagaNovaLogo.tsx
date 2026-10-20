import React from 'react';

interface NiagaNovaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export const NiagaNovaLogo: React.FC<NiagaNovaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'auto'
}) => {
  const iconSizeMap = {
    sm: { box: 'w-7 h-7', svg: 28, text: 'text-sm', sub: 'text-[10px]' },
    md: { box: 'w-9 h-9', svg: 36, text: 'text-base', sub: 'text-[11px]' },
    lg: { box: 'w-11 h-11', svg: 44, text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'w-14 h-14', svg: 56, text: 'text-2xl', sub: 'text-sm' },
  };

  const current = iconSizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Sleek Geometric Crest */}
      <div className={`relative ${current.box} shrink-0 group`}>
        {/* Glow backlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-amber-400 rounded-xl blur-[6px] opacity-70 group-hover:opacity-100 transition-opacity" />
        
        {/* Crisp Emblem Container */}
        <div className="relative w-full h-full bg-slate-950 rounded-xl border border-emerald-500/40 p-1 flex items-center justify-center shadow-lg overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:6px_6px]" />

          <svg
            viewBox="0 0 100 100"
            className="w-full h-full relative z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Hexagonal Outer Shield */}
            <polygon
              points="50,6 88,28 88,72 50,94 12,72 12,28"
              stroke="url(#gemGrad)"
              strokeWidth="5"
              strokeLinejoin="round"
              fill="rgba(6, 78, 59, 0.25)"
            />

            {/* Inner Golden Coin Matrix */}
            <circle
              cx="50"
              cy="50"
              r="24"
              fill="url(#goldGrad)"
              opacity="0.2"
            />
            <circle
              cx="50"
              cy="50"
              r="22"
              stroke="url(#goldGrad)"
              strokeWidth="3.5"
              strokeDasharray="4 2"
              fill="none"
            />

            {/* Upward Profit Trajectory Arrow */}
            <path
              d="M32 64 L46 50 L56 58 L72 34"
              stroke="url(#arrowGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Arrowhead */}
            <polygon
              points="74,32 60,34 68,44"
              fill="#ffffff"
            />

            {/* Sparkling Nova Star at Peak */}
            <path
              d="M74 24 L76 30 L82 32 L76 34 L74 40 L72 34 L66 32 L72 30 Z"
              fill="#fef08a"
            />
            <circle cx="74" cy="32" r="2" fill="#ffffff" />

            {/* Currency Rp Crest in center */}
            <text
              x="36"
              y="44"
              fill="#34d399"
              fontSize="16"
              fontWeight="900"
              fontFamily="monospace"
              opacity="0.9"
            >
              N
            </text>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 leading-none">
            <span className={`font-extrabold tracking-tight ${current.text} text-white drop-shadow-sm`}>
              Niaga<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Nova</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs">
              PRO
            </span>
          </div>
          <span className={`${current.sub} text-slate-400 font-mono tracking-tight mt-1`}>
            Kalkulator Dagang & Arus Kas Digital
          </span>
        </div>
      )}
    </div>
  );
};
