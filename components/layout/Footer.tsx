'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, FileText, Scale, Sparkles, ExternalLink, Leaf } from 'lucide-react';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/login') {
    return null;
  }

  return (
    <footer className="border-t border-[#1e5646] bg-[#061a14] py-10 text-xs text-slate-300">
      <div className="container mx-auto px-4 md:px-6 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-[#1e5646]/80">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
            <span className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#34d399]" />
              AirIndx — Saans (साँस)
            </span>
            <span className="hidden sm:inline text-[#1e5646]">|</span>
            <span className="text-slate-300 text-xs font-medium">
              Ecological GRAP Air Safety School Day Planner & Cryptographic Ledger
            </span>
          </div>

          {/* Made with AI Tag */}
          <MadeWithAITag />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-400 text-[11px] text-center sm:text-left font-medium">
            © 2026 AirIndx System — Commission for Air Quality Management (CAQM) & Delhi-NCR Education District Framework.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300 text-xs font-bold">
            <Link 
              href="/conditions" 
              className="hover:text-[#34d399] transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Read Conditions 📜</span>
            </Link>
            <Link 
              href="/privacy" 
              className="hover:text-[#34d399] transition-colors flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Privacy Policy 🛡️</span>
            </Link>
            <Link 
              href="/terms" 
              className="hover:text-[#34d399] transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-[#34d399]" />
              <span>Terms & Conditions ⚖️</span>
            </Link>
            <Link 
              href="/login" 
              className="hover:text-[#fbbf24] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Principal Portal 👋</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
