'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const handleQuickDemo = () => {
    setEmail('principal.demo@delhi.gov.in');
    setPassword('••••••••••••');
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden bg-[#c5dcd8]">
      {/* ─────────────────────────────────────────────────────────────
          SERENE MOUNTAIN LANDSCAPE BACKGROUND (EXACT MATCH TO SCREENSHOT 1)
          Layered mist, pine trees, flying birds, soft morning sun
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Sky Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#d5e7e6] via-[#d0e5e3] to-[#8fa89e]" />

        {/* Soft Sun behind clouds */}
        <div className="absolute top-[8%] left-[45%] w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-white/70 blur-xl" />

        {/* Clouds Vector */}
        <svg viewBox="0 0 1440 320" className="absolute top-0 w-full h-auto opacity-70">
          <path
            fill="#ffffff"
            d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,170.7C960,181,1056,171,1152,144C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>

        {/* Flying Birds Silhouettes (3 Birds from Screenshot 1) */}
        <div className="absolute top-[28%] right-[15%] sm:right-[22%] z-10 opacity-80">
          <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
            {/* Bird 1 */}
            <path
              d="M10 25 C16 18 24 20 28 26 C32 20 40 18 46 25"
              stroke="#1a2e2b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Bird 2 */}
            <path
              d="M48 15 C52 10 58 11 61 16 C64 11 70 10 74 15"
              stroke="#1a2e2b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Bird 3 */}
            <path
              d="M78 28 C82 22 88 23 91 29 C94 23 100 22 104 28"
              stroke="#1a2e2b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Mountain Range Layer 1 (Distant Light Mist) */}
        <svg viewBox="0 0 1440 600" className="absolute bottom-0 w-full h-[55vh] text-[#a9c3ba] fill-current">
          <path d="M0,320 L180,180 L420,340 L700,160 L1020,380 L1260,200 L1440,290 L1440,600 L0,600 Z" />
        </svg>

        {/* Mountain Range Layer 2 (Mid-ground Sage Ridge) */}
        <svg viewBox="0 0 1440 600" className="absolute bottom-0 w-full h-[45vh] text-[#6d8e82] fill-current opacity-90">
          <path d="M0,420 L240,240 L520,400 L840,210 L1180,390 L1440,260 L1440,600 L0,600 Z" />
        </svg>

        {/* Mountain Range Layer 3 (Foreground Deep Pine Slope) */}
        <svg viewBox="0 0 1440 600" className="absolute bottom-0 w-full h-[32vh] text-[#3b594f] fill-current">
          <path d="M0,480 L360,320 L780,480 L1120,310 L1440,430 L1440,600 L0,600 Z" />
        </svg>

        {/* Evergreen Pine Trees Silhouette on Bottom Right & Left */}
        <svg viewBox="0 0 1440 400" className="absolute bottom-0 w-full h-[28vh] text-[#1a332a] fill-current">
          {/* Right side cluster */}
          <path d="M1100,400 L1120,320 L1140,400 Z M1160,400 L1185,280 L1210,400 Z M1220,400 L1250,220 L1280,400 Z M1290,400 L1320,180 L1350,400 Z M1360,400 L1400,160 L1440,400 Z" />
          {/* Left side cluster */}
          <path d="M-20,400 L10,240 L40,400 Z M30,400 L60,290 L90,400 Z M80,400 L110,330 L140,400 Z" />
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FROSTED GLASS LOGIN CARD (EXACT MATCH TO SCREENSHOT 1)
          Positioned on the Left / Center
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">
        <motion.div
          initial={{ opacity: 0, x: -40, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', damping: 25 }}
          className="w-full max-w-md sm:max-w-lg rounded-[2.5rem] p-8 sm:p-10 md:p-12 
          bg-white/25 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-emerald-950/20 text-slate-900"
        >
          {/* Navigation link back to dashboard */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-950 transition-colors px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/60 border border-white/60"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AirIndx</span>
            </Link>

            <MadeWithAITag variant="badge" />
          </div>

          {/* Heading: Welcome 👋 */}
          <div className="space-y-1.5 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Welcome</span>
              <span className="text-3xl sm:text-4xl">👋</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-700">
              Login to access your AirIndx / Saans account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@abc.com"
                required
                className="w-full px-5 py-3.5 rounded-full bg-white/90 text-slate-900 placeholder:text-slate-400 text-sm font-medium border border-white/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-5 py-3.5 rounded-full bg-white/90 text-slate-900 placeholder:text-slate-400 text-sm font-medium border border-white/80 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-600 border-white/80 bg-white/90 accent-[#1c3933]"
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Password reset instructions sent to registered institutional email.')}
                className="text-slate-800 hover:text-slate-950 hover:underline transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button (Dark Pine/Teal Pill Button matching Screenshot 1 + Purple Gradient Option) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-full bg-[#1b3832] hover:bg-[#122723] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#1b3832]/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <span>Login</span>
              )}
            </button>

            {/* Divider: or Sign in Google */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-slate-700/25" />
              <span className="absolute bg-white/40 px-3 py-0.5 rounded-full text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                or Sign in Google
              </span>
            </div>

            {/* Continue with Google Button */}
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-3.5 rounded-full bg-white text-slate-800 font-semibold text-sm shadow-sm hover:shadow-md border border-slate-200/80 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
            >
              {/* Official Google G 4-Color SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Quick Demo Principal Button (Solar Gold Pill) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full btn-solar-pill text-xs py-2.5 cursor-pointer justify-center"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Instant One-Click Principal Demo Access</span>
              </button>
            </div>
          </form>

          {/* Legal Footnote */}
          <div className="mt-8 text-center text-[11px] text-slate-700/80 font-medium">
            <span>Protected by Delhi Education District Air Safety Framework • </span>
            <Link href="/privacy" className="underline hover:text-slate-900">
              Privacy
            </Link>
            <span> & </span>
            <Link href="/terms" className="underline hover:text-slate-900">
              Terms
            </Link>
          </div>
        </motion.div>

        {/* Right Info Teaser (Shows only on larger screens) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex flex-col max-w-md space-y-6 text-slate-900 bg-white/20 p-8 rounded-3xl backdrop-blur-xl border border-white/40 shadow-xl"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-950 font-bold bg-white/60 px-3 py-1 rounded-full border border-white/60">
              Delhi—NCR CAQM Compliance
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Deterministic School Air Safety & Cryptographic Ledger
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed">
              Automated re-planning that preserves 100% of physical education minutes while safeguarding students from hazardous ambient PM2.5.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-900/10 text-xs font-medium text-slate-900">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-800" />
              <span>Verbatim circular validation with zero prompt injection</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-800" />
              <span>60-second Human-in-the-Loop Principal Escalation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-800" />
              <span>Bilingual parent WhatsApp advisories in Hindi & English</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
