import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLogo({ 
  className = "", 
  asLink = true, 
  onClick,
  isDark = false,
  showTagline = true
}) {
  const content = (
    <div className={`flex items-center gap-3 group ${className}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl transition-all shadow-xl rotate-3 group-hover:rotate-0 ${isDark ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'bg-gradient-to-br from-[#C2185B] to-[#8E244D] text-white shadow-[#C2185B]/20'}`}>
        <span className="drop-shadow-md">💒</span>
      </div>
      <div className="flex flex-col">
        <span className={`font-display font-black text-2xl tracking-tighter transition-colors leading-none flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Shaadi<span className="text-[#D4AF37]">Saathi</span>
        </span>
        {showTagline && (
          <span className={`text-[11px] font-bold tracking-widest mt-1.5 transition-opacity italic ${isDark ? 'text-[#D4AF37]' : 'text-primary-600'}`}>
            Shaadi ka sacha saathi
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div onClick={onClick}>
      {content}
    </div>
  );
}
