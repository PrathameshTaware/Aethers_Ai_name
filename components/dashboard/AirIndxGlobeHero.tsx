'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Wind, 
  Share2, 
  Plus, 
  Minus, 
  Info, 
  Check, 
  Compass, 
  Layers, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Flame,
  Globe2
} from 'lucide-react';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

interface AirIndxGlobeHeroProps {
  onOpenConditions?: () => void;
  onOpenRehearsal?: () => void;
}

export function AirIndxGlobeHero({ onOpenConditions, onOpenRehearsal }: AirIndxGlobeHeroProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeView, setActiveView] = useState<'globe' | 'map'>('globe');
  const [activePin, setActivePin] = useState<string>('delhi');
  const [sharedToast, setSharedToast] = useState<boolean>(false);
  const [showRiskModal, setShowRiskModal] = useState<boolean>(false);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.45));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.75));

  const handleShare = (platform: string) => {
    setSharedToast(true);
    setTimeout(() => setSharedToast(false), 2500);
    const text = encodeURIComponent('AirIndx & Saans: Real-time AQI & Ecological GRAP Air Safety Day Planner.');
    const url = encodeURIComponent(window.location.origin);
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${text}%20${url}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };

  return (
    <div className="relative w-full rounded-3xl bg-[#061a14] border border-[#1e5646] shadow-2xl overflow-hidden my-4 text-slate-100">
      {/* Background Starfield and Ecological Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* ─────────────────────────────────────────────────────────────
          NAVBAR: AIRINDX WITH ECO EMERALD & SOLAR GOLD IDENTITY
          Air Quality | Air Monitors | Discover  --  ✦ AirIndx  --  About | Technology | [Get Started]
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-[#1e5646]/80 backdrop-blur-md bg-[#061a14]/80">
        {/* Left Nav items */}
        <div className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-200">
          <Link href="/dashboard" className="text-white hover:text-[#34d399] transition-colors flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#34d399]" />
            Air Quality
          </Link>
          <Link href="/dashboard/stage-rehearsal" className="hover:text-[#fbbf24] transition-colors">
            Air Monitors
          </Link>
          <button 
            type="button" 
            onClick={onOpenConditions} 
            className="hover:text-[#34d399] transition-colors cursor-pointer"
          >
            Discover
          </button>
        </div>

        {/* Center Brand: ✦ AirIndx */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-4 h-4 text-slate-950 font-black" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
            AirIndx
          </span>
          <span className="text-[10px] text-[#34d399] font-mono font-bold hidden sm:inline-block ml-1 px-2.5 py-0.5 rounded-full bg-[#11382d] border border-[#1e5646]">
            Eco Saans v2.0
          </span>
        </div>

        {/* Right Nav items & Pill Button */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-200">
            <Link href="/verification" className="hover:text-[#34d399] transition-colors">
              About
            </Link>
            <Link href="/city-board" className="hover:text-[#fbbf24] transition-colors">
              Technology
            </Link>
          </div>

          <Link
            href="/login"
            className="btn-emerald-pill text-xs px-5 py-2"
          >
            <span>Get Started</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN HERO BODY: SCREENSHOT 3 LAYOUT
          Left: Air Quality Index, Date, Main Stats Card, Risk Card, Share
          Right: Photorealistic Satellite 3D Earth Globe with Pins & Tooltip
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 lg:p-10 items-center">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Title */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>Air Quality</span>
              <span className="text-slate-300 font-light">Index</span>
            </h1>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300 pt-1">
              <span className="font-mono text-white font-bold">25/07/2026 10:11</span>
              <span className="text-slate-500">•</span>
              <div className="flex items-center gap-1.5 font-bold text-white">
                <span>Local</span>
                <span className="text-[#34d399]">➔</span>
                <span className="px-2 py-0.5 rounded-full bg-[#11382d] text-xs font-mono text-[#34d399] border border-[#1e5646]">
                  DEL / IDN
                </span>
              </div>
            </div>
          </div>

          {/* Card 1: Main Statistics (Deep Forest Surface #11382D / #1E5646) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="p-5 rounded-2xl bg-[#11382d]/90 border border-[#1e5646] shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-[#34d399]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Main Statistics
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399] animate-ping" />
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">AQI</span>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-0.5 drop-shadow-sm">
                78
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#1e5646] flex items-center justify-between text-xs">
              <span className="text-slate-200 font-medium">
                Dominant Pollutant <strong className="text-[#fbbf24]">PM2.5— Wind</strong>
              </span>
              <span className="text-[11px] font-mono font-bold text-[#34d399] bg-[#061a14] px-2.5 py-0.5 rounded-full border border-[#1e5646] shadow-sm">
                Moderate (Advisory)
              </span>
            </div>
          </motion.div>

          {/* Card 2: Risk of Pollution (Deep Forest Surface #11382D) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-5 rounded-2xl bg-[#11382d]/90 border border-[#1e5646] shadow-xl backdrop-blur-md relative overflow-hidden group hover:border-[#fbbf24]/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Risk of Pollution
              </span>
              {/* Solar Gold Pill Button: Details */}
              <button
                type="button"
                onClick={() => setShowRiskModal(true)}
                className="btn-solar-pill text-[11px] px-3.5 py-1 cursor-pointer"
              >
                <span>Details</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Risk</span>
              <div className="text-4xl sm:text-5xl font-black text-[#fbbf24] tracking-tight mt-0.5 drop-shadow-sm">
                35%
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-[#1e5646] flex items-center gap-2 text-xs text-slate-200 font-medium">
              <Wind className="w-4 h-4 text-[#fb923c] shrink-0" />
              <span>Moderate environmental risk due to boundary mixing</span>
            </div>
          </motion.div>

          {/* Bottom Left: Share & Coordinates */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#34d399]" />
                Share
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShare('facebook')}
                  className="w-7 h-7 rounded-full bg-[#11382d] hover:bg-[#10b981] hover:text-slate-950 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors cursor-pointer border border-[#1e5646]"
                  title="Share on Facebook"
                >
                  f
                </button>
                <button
                  type="button"
                  onClick={() => handleShare('twitter')}
                  className="w-7 h-7 rounded-full bg-[#11382d] hover:bg-[#fbbf24] hover:text-slate-950 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors cursor-pointer border border-[#1e5646]"
                  title="Share on X"
                >
                  𝕏
                </button>
                <button
                  type="button"
                  onClick={() => handleShare('whatsapp')}
                  className="w-7 h-7 rounded-full bg-[#11382d] hover:bg-[#34d399] hover:text-slate-950 flex items-center justify-center text-xs font-bold text-slate-200 transition-colors cursor-pointer border border-[#1e5646]"
                  title="Share on WhatsApp"
                >
                  💬
                </button>
              </div>
            </div>

            {/* Coordinates */}
            <div className="text-[11px] font-mono text-slate-400 space-x-3 font-semibold">
              <span>X: 5.404578</span>
              <span>Y: -73.828.177</span>
            </div>
          </div>
        </div>

        {/* Right Column: Photorealistic Satellite 3D Earth Globe (7 cols) */}
        <div className="lg:col-span-7 relative flex items-center justify-center min-h-[460px] sm:min-h-[520px]">
          {/* Animated 3D Globe Wrapper */}
          <motion.div
            style={{ scale: zoomLevel }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] flex items-center justify-center"
          >
            {/* Atmosphere Horizon Limb Glow (Rayleigh Blue & Emerald Corona) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/25 to-amber-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border border-[#10b981]/30 animate-pulse pointer-events-none" />
            <div className="absolute -inset-8 rounded-full border border-[#f59e0b]/20 pointer-events-none" />

            {/* The Real Planet Earth Sphere with Satellite Continents & Golden Night Lights */}
            <div className="relative w-full h-full rounded-full shadow-[inset_-35px_-35px_80px_rgba(0,0,0,0.95),inset_20px_20px_45px_rgba(52,211,153,0.35),0_0_50px_rgba(16,185,129,0.3)] border-2 border-[#10b981]/40 overflow-hidden flex items-center justify-center bg-black">
              {/* Photorealistic Satellite Earth Texture with Continents & Night City Lights */}
              <img
                src="/earth_globe.jpg"
                alt="Planet Earth - Satellite & Night Lights View"
                className={`absolute inset-0 w-full h-full object-cover rounded-full select-none transition-all duration-700 ${
                  activeView === 'globe' ? 'brightness-105 contrast-115' : 'brightness-90 contrast-125'
                }`}
                draggable={false}
              />

              {/* Day/Night Atmospheric Terminator & Spherical Curvature Shadow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/55 via-transparent to-emerald-400/15 pointer-events-none" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_50px_rgba(6,26,20,0.7)] pointer-events-none" />

              {/* Subtle Atmospheric Cloud Swirls Overlay */}
              <div 
                className="absolute inset-0 rounded-full opacity-25 mix-blend-screen pointer-events-none animate-[spin_180s_linear_infinite]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 45% 40%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                }}
              />

              {/* IQ AIR MAP Mode: Atmospheric Particulate PM2.5 Heatmap Overlay */}
              {activeView === 'map' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.75 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-full mix-blend-color-dodge pointer-events-none bg-[radial-gradient(ellipse_at_62%_45%,rgba(239,68,68,0.85)_0%,rgba(249,115,22,0.7)_25%,rgba(234,179,8,0.5)_45%,rgba(16,185,129,0.3)_65%,transparent_80%)]"
                >
                  <div className="absolute top-[40%] left-[55%] w-24 h-16 bg-red-600/70 rounded-full blur-md animate-pulse" />
                  <div className="absolute top-[30%] right-[18%] w-20 h-16 bg-orange-500/60 rounded-full blur-md animate-pulse" />
                </motion.div>
              )}

              {/* Subtle Latitude & Longitude Geodetic Coordinates Rings */}
              <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                <circle cx="200" cy="200" r="198" fill="none" stroke="#34d399" strokeWidth="1" />
                <ellipse cx="200" cy="200" rx="198" ry="110" fill="none" stroke="#34d399" strokeWidth="0.7" strokeDasharray="4 4" />
                <ellipse cx="200" cy="200" rx="198" ry="55" fill="none" stroke="#34d399" strokeWidth="0.7" strokeDasharray="4 4" />
                <line x1="200" y1="2" x2="200" y2="398" stroke="#34d399" strokeWidth="0.7" strokeDasharray="4 4" />
                <line x1="2" y1="200" x2="398" y2="200" stroke="#34d399" strokeWidth="0.7" strokeDasharray="4 4" />
              </svg>

              {/* ─────────────────────────────────────────────────────────────
                  AQI PINS ON REAL GEOGRAPHIC CONTINENTS
                  Europe (90), Central Asia (155), East Asia (174 red),
                  Middle East (132), SE Asia (112), Delhi/India (78 solar gold), South (90)
                  ───────────────────────────────────────────────────────────── */}
              {/* Pin 1: Europe (90) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-90-europe')}
                className="absolute top-[26%] left-[28%] px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#061a14]/90 text-white border border-[#1e5646] shadow-lg hover:scale-110 transition-transform cursor-pointer z-20 backdrop-blur-sm"
                title="Europe — AQI 90"
              >
                90
              </button>

              {/* Pin 2: Central Asia / Silk Road (155) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-155-asia')}
                className="absolute top-[27%] left-[49%] px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#061a14]/90 text-white border border-[#1e5646] shadow-lg hover:scale-110 transition-transform cursor-pointer z-20 backdrop-blur-sm"
                title="Central Asia — AQI 155"
              >
                155
              </button>

              {/* Pin 3: East Asia / Beijing (174 - Toxic Red Alert) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-174-east')}
                className="absolute top-[34%] right-[19%] px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xl shadow-rose-600/60 hover:scale-110 transition-transform cursor-pointer animate-pulse z-20"
                title="East Asia Toxic Smog — AQI 174"
              >
                174
              </button>

              {/* Pin 4: Southeast Asia / Indochina (112) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-112-seasia')}
                className="absolute top-[52%] right-[22%] px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#061a14]/90 text-white border border-[#1e5646] shadow-lg hover:scale-110 transition-transform cursor-pointer z-20 backdrop-blur-sm"
                title="Southeast Asia — AQI 112"
              >
                112
              </button>

              {/* Pin 5: Middle East / Gulf (132) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-132-me')}
                className="absolute top-[44%] left-[41%] px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#061a14]/90 text-white border border-[#1e5646] shadow-lg hover:scale-110 transition-transform cursor-pointer z-20 backdrop-blur-sm"
                title="Middle East — AQI 132"
              >
                132
              </button>

              {/* Pin 6: Southern Indian Ocean (90) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-90-ocean')}
                className="absolute bottom-[23%] left-[34%] px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#061a14]/90 text-white border border-[#1e5646] shadow-lg hover:scale-110 transition-transform cursor-pointer z-20 backdrop-blur-sm"
                title="Southern Indian Ocean — AQI 90"
              >
                90
              </button>

              {/* Pin 7: Southern African Horn (78) */}
              <button
                type="button"
                onClick={() => setActivePin('pin-78-south')}
                className="absolute bottom-[34%] left-[24%] px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#061a14]/90 text-white border border-[#1e5646] shadow-lg hover:scale-110 transition-transform cursor-pointer z-20 backdrop-blur-sm"
                title="Southern Africa — AQI 78"
              >
                78
              </button>

              {/* Pin 8: THE ACTIVE HIGHLIGHTED TARGET 78 PIN OVER DELHI / NORTH INDIA IN SOLAR GOLD (#F59E0B) */}
              <div className="absolute top-[42%] left-[60%] z-30 flex items-center justify-center">
                <div className="relative">
                  {/* Outer pulsating Solar Gold target aura (#F59E0B / #FBBF24) */}
                  <div className="absolute -inset-3.5 rounded-full bg-[#f59e0b]/50 animate-ping pointer-events-none" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#d97706] via-[#f59e0b] to-[#fbbf24] text-[#061a14] font-black text-sm flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.85)] border-2 border-white cursor-pointer hover:scale-110 transition-transform">
                    78
                  </div>
                  {/* Glowing pointer connecting target to callout card */}
                  <div className="absolute -top-4 right-[-10px] w-6 h-0.5 bg-gradient-to-r from-[#fbbf24] to-[#10b981] rotate-[-25deg]" />
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                ACTIVE CALLOUT TOOLTIP CARD (DEEP FOREST #11382D / #1E5646)
                High WCAG contrast text with Solar Gold and Toxic Alert badges
                ───────────────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-[-10px] sm:right-[15px] top-[40%] z-40 p-4 rounded-2xl bg-[#11382d]/95 border border-[#10b981]/50 shadow-2xl backdrop-blur-xl max-w-[250px] text-xs space-y-2.5 pointer-events-auto"
            >
              {/* Tooltip Header */}
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
                  Jakarta / Delhi NCR
                </span>
                <span className="text-[10px] text-[#fbbf24] font-bold">Details</span>
              </div>

              {/* Status Badge with Toxic Warning Drop-Shadow */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#061a14] border border-[#1e5646]">
                <div className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white font-mono font-black text-[11px] shadow-[0_0_10px_rgba(234,88,12,0.5)]">
                  137
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Unhealthy for sensitive people
                </div>
              </div>

              {/* Weather Metrics */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-200 pt-1.5 border-t border-[#1e5646] font-bold">
                <span>🌡️ 34°C</span>
                <span>💧 50%</span>
                <span>💨 13.2 km/h</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Globe Switcher: [3D GLOBE] [IQ AIR MAP] in Solar Gold & Emerald */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center p-1 rounded-full bg-[#061a14]/90 border border-[#1e5646] shadow-2xl backdrop-blur-md">
            <button
              type="button"
              onClick={() => setActiveView('globe')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeView === 'globe'
                  ? 'btn-emerald-pill text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              3D GLOBE
            </button>
            <button
              type="button"
              onClick={() => setActiveView('map')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'btn-solar-pill'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              IQ AIR MAP
            </button>
          </div>

          {/* Zoom Controls at Bottom Right */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#061a14]/90 border border-[#1e5646] shadow-lg text-xs font-mono text-slate-200 backdrop-blur-md font-bold">
            <span>Zoom</span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-5 h-5 rounded-full bg-[#11382d] hover:bg-[#1e5646] flex items-center justify-center text-white transition-colors cursor-pointer border border-[#1e5646]"
              title="Zoom Out"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-5 h-5 rounded-full bg-[#11382d] hover:bg-[#1e5646] flex items-center justify-center text-white transition-colors cursor-pointer border border-[#1e5646]"
              title="Zoom In"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      <AnimatePresence>
        {sharedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981] text-slate-950 text-xs font-bold shadow-xl"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Link copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk of Pollution Details Modal (Deep Forest Surface #11382D) */}
      <AnimatePresence>
        {showRiskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#11382d] border border-[#1e5646] shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1e5646]">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#fbbf24]" />
                  Pollution Risk & Atmospheric Dispersion
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRiskModal(false)}
                  className="text-slate-300 hover:text-white text-xs px-2.5 py-1 rounded-full bg-[#061a14] border border-[#1e5646]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-200">
                <div className="p-3.5 rounded-xl bg-[#061a14] border border-[#1e5646] space-y-1">
                  <div className="font-bold text-[#fbbf24]">Current Health Hazard Rating: 35% (Moderate)</div>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    Boundary wind speeds of 13.2 km/h provide moderate atmospheric mixing. Sensitive cohorts require restricted outdoor exposure durations.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#09261d] border border-[#10b981]/40 space-y-1">
                  <div className="font-bold text-[#34d399]">Prescribed School Mitigation:</div>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    Classes with respiratory tags shifted to indoor physical wellness slots in HEPA air-purified rooms.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRiskModal(false)}
                className="w-full btn-emerald-pill text-xs py-2.5 mt-2"
              >
                Close Breakdown
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
