'use client';

import React from 'react';
import { Sparkles, Cpu, Leaf } from 'lucide-react';

interface MadeWithAITagProps {
  className?: string;
  variant?: 'badge' | 'banner' | 'pill';
}

export function MadeWithAITag({ className = '', variant = 'pill' }: MadeWithAITagProps) {
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold 
        bg-[#061a14] border border-[#1e5646] text-[#34d399] 
        shadow-sm shadow-emerald-950/40 backdrop-blur-md ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#fbbf24] animate-pulse" />
        <span>Made with AI</span>
        <span className="w-1 h-1 rounded-full bg-[#34d399]" />
        <span className="text-[10px] text-[#fbbf24] font-mono font-semibold">Bedrock & Open-Meteo</span>
      </div>
    );
  }

  return (
    <div
      className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold
      bg-gradient-to-r from-[#061a14] via-[#11382d] to-[#09261d]
      border border-[#10b981]/50 text-white shadow-md shadow-emerald-950/40
      hover:border-[#fbbf24] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-300 backdrop-blur-md ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]" />
      </span>
      <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
      <span className="tracking-wide">Made with AI</span>
      <span className="text-[#1e5646]">—</span>
      <span className="text-[11px] font-mono text-[#34d399] font-semibold">Ecological Neural Engine</span>
    </div>
  );
}
