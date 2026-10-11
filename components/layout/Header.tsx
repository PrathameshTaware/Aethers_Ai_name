'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Wind, 
  LayoutDashboard, 
  Sliders, 
  CheckCircle2, 
  Building2, 
  LogIn, 
  Menu, 
  X, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getStageColor } from '@/lib/utils';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

function HeaderNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Stage Rehearsal', href: '/dashboard/stage-rehearsal', icon: Sliders },
    { label: 'Proof Verification', href: '/verification', icon: ShieldCheck },
    { label: 'District City Board', href: '/city-board', icon: Building2 },
    { label: 'Conditions', href: '/conditions', icon: FileText },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-1 bg-[#11382d]/90 p-1.5 rounded-full border border-[#1e5646] backdrop-blur-md">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
              isActive
                ? 'btn-emerald-pill shadow-emerald-500/40 text-white'
                : 'text-slate-200 hover:text-white hover:bg-[#1e5646]/70'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  const pathname = usePathname();
  const { data: aqiData, isConnected } = useWebSocket();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/login') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1e5646] bg-[#061a14]/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo & Brand: AirIndx — Saans */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-slate-950 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                  AirIndx
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#11382d] text-[#34d399] border border-[#1e5646]">
                  साँस v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium hidden sm:block">
                Ecological GRAP Air Safety Day Planner — Delhi NCR
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <Suspense fallback={<div className="hidden lg:block w-80 h-8 bg-[#11382d] rounded-full animate-pulse" />}>
          <HeaderNav />
        </Suspense>

        {/* Right Status Indicator & Action Pill Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live AQI Badge in Deep Forest Surface */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11382d] border border-[#1e5646] text-xs shadow-md">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#34d399] shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-300 font-medium">AQI:</span>
            <span className="font-extrabold text-white">{aqiData?.aqi || 415}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${getStageColor(aqiData?.stage || 3)}`}>
              Stage {aqiData?.stage || 3}
            </span>
          </div>

          {/* Login Pill Button in Solar Gold (#F59E0B) */}
          <Link
            href="/login"
            className="btn-solar-pill text-xs py-1.5 px-4 flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-950 font-bold" />
            <span>Login 👋</span>
          </Link>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-slate-300 hover:text-white hover:bg-[#11382d] transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation in Dark Moss */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#1e5646] bg-[#061a14]/95 backdrop-blur-xl px-4 py-4 space-y-3">
          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-100 hover:bg-[#11382d] hover:text-[#34d399] flex items-center gap-3"
            >
              <LayoutDashboard className="w-4 h-4 text-[#34d399]" />
              <span>Dashboard (AirIndx)</span>
            </Link>
            <Link
              href="/dashboard/stage-rehearsal"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-100 hover:bg-[#11382d] hover:text-[#fbbf24] flex items-center gap-3"
            >
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              <span>Stage Rehearsal</span>
            </Link>
            <Link
              href="/verification"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-100 hover:bg-[#11382d] hover:text-[#34d399] flex items-center gap-3"
            >
              <ShieldCheck className="w-4 h-4 text-[#34d399]" />
              <span>Proof Verification</span>
            </Link>
            <Link
              href="/city-board"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-100 hover:bg-[#11382d] hover:text-[#34d399] flex items-center gap-3"
            >
              <Building2 className="w-4 h-4 text-[#34d399]" />
              <span>District City Board</span>
            </Link>
            <Link
              href="/conditions"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-100 hover:bg-[#11382d] hover:text-[#fbbf24] flex items-center gap-3"
            >
              <FileText className="w-4 h-4 text-[#fbbf24]" />
              <span>Read Conditions</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-solar-pill text-xs py-2 mt-2 w-full justify-center"
            >
              <LogIn className="w-4 h-4" />
              <span>Go to Login Page 👋</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
