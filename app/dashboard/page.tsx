'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ReplayBanner } from '@/components/dashboard/ReplayBanner';
import { KPICards } from '@/components/dashboard/KPICards';
import { StageSlider } from '@/components/dashboard/StageSlider';
import { TimetableGrid } from '@/components/dashboard/TimetableGrid';
import { TeacherRosterSection } from '@/components/dashboard/TeacherRosterSection';
import { AQIChart } from '@/components/charts/AQIChart';
import { NotificationCenter } from '@/components/real-time/NotificationCenter';
import { HashChainVerifier } from '@/components/verification/HashChainVerifier';
import { AirQualityMonitor } from '@/components/real-time/AirQualityMonitor';

import { AirIndxGlobeHero } from '@/components/dashboard/AirIndxGlobeHero';
import { AtmosphericIcons, AtmosphericCondition } from '@/components/atmospheric/AtmosphericIcons';
import { ReviewsAndMatrix } from '@/components/dashboard/ReviewsAndMatrix';
import { ReadConditionsModal } from '@/components/dashboard/ReadConditionsModal';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';
import { ShieldCheck, Sliders, FileText, Sparkles, Leaf } from 'lucide-react';

export default function DashboardPage() {
  const [isConditionsModalOpen, setIsConditionsModalOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<AtmosphericCondition | null>(null);

  const handleConditionChange = (condition: AtmosphericCondition) => {
    setSelectedCondition(condition);
  };

  return (
    <div className="min-h-screen space-y-8 pb-16 bg-[#061a14] text-slate-100">
      {/* Replay Status Banner */}
      <ReplayBanner />

      <main className="container mx-auto px-4 md:px-6 space-y-10">
        {/* ─────────────────────────────────────────────────────────────
            AIRINDX 3D GLOBE HERO COMPONENT
            Real Satellite Planet Earth + Golden Night Lights + AQI Pins
            ───────────────────────────────────────────────────────────── */}
        <AirIndxGlobeHero 
          onOpenConditions={() => setIsConditionsModalOpen(true)}
        />

        {/* ─────────────────────────────────────────────────────────────
            SCREENSHOT 2: THE 6 CIRCULAR ATMOSPHERIC ICONS
            Minimalist interactive condition controller with Solar Gold active rings
            ───────────────────────────────────────────────────────────── */}
        <AtmosphericIcons 
          onSelect={handleConditionChange}
        />

        {/* Quick Action Ribbon with Ecological Emerald & Solar Gold Pill Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#11382d]/90 border border-[#1e5646] backdrop-blur-md shadow-xl"
        >
          <div className="flex items-center gap-3">
            <MadeWithAITag />
            <span className="text-xs text-slate-200 font-semibold hidden sm:inline">
              Deterministic Delhi—NCR CAQM Air Directive Engine
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Solar Gold Pill Button: Read Conditions */}
            <button
              type="button"
              onClick={() => setIsConditionsModalOpen(true)}
              className="btn-solar-pill text-xs px-5 py-2 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Read Conditions 📜</span>
            </button>

            {/* Emerald Pill Link: Verification */}
            <a
              href="/verification"
              className="btn-pill-dark text-xs px-4 py-2 hover:border-[#10b981]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#34d399]" />
              <span>SHA-256 Proof Ledger</span>
            </a>
          </div>
        </motion.div>

        {/* KPI Summary Cards */}
        <KPICards />

        {/* Live Air Quality Monitor & 24h Trend Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AQIChart />
          </div>
          <div>
            <AirQualityMonitor />
          </div>
        </div>

        {/* Interactive Stage Rehearsal Simulator */}
        <StageSlider />

        {/* Timetable Optimization Grid with Drag-and-Drop & Plan A/B Swaps */}
        <TimetableGrid />

        {/* Fake Reviews & Performance Metrics Matrix */}
        <ReviewsAndMatrix />

        {/* Bilingual WhatsApp & SMS Parent Notification Center */}
        <NotificationCenter />

        {/* Teacher Roster & Venue Allocation Section */}
        <TeacherRosterSection />

        {/* Cryptographic Hash Chain Verifier */}
        <HashChainVerifier />
      </main>

      {/* Read Conditions Modal Popup */}
      <ReadConditionsModal
        isOpen={isConditionsModalOpen}
        onClose={() => setIsConditionsModalOpen(false)}
      />
    </div>
  );
}
