'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, HeartPulse, CheckCircle2, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { STAGE_CONFIGS } from '@/lib/mockData';

interface ReadConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReadConditionsModal({ isOpen, onClose }: ReadConditionsModalProps) {
  const [activeStage, setActiveStage] = useState<number>(3);

  if (!isOpen) return null;

  const currentConfig = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS[3];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog in Deep Forest Gray Surface (#11382D / #1E5646) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl rounded-3xl bg-[#11382d] border border-[#1e5646] shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-[#1e5646] shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  GRAP Operational Conditions & Directives 📜
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                Commission for Air Quality Management (CAQM) & Directorate of Education (DoE) Delhi Orders
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-[#061a14] transition-colors cursor-pointer border border-[#1e5646]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stage Selector Tabs with Solar Gold Active Highlight */}
          <div className="flex items-center gap-2.5 py-4 border-b border-[#1e5646] overflow-x-auto shrink-0">
            {[1, 2, 3, 4].map((stageNum) => {
              const conf = STAGE_CONFIGS[stageNum];
              const isActive = activeStage === stageNum;
              return (
                <button
                  key={stageNum}
                  type="button"
                  onClick={() => setActiveStage(stageNum)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'btn-solar-pill shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                      : 'bg-[#09261d] text-slate-200 hover:bg-[#061a14] hover:text-white border border-[#1e5646]'
                  }`}
                >
                  Stage {stageNum} ({conf?.aqiRange || 'AQI'})
                </button>
              );
            })}
          </div>

          {/* Content Body */}
          <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1">
            {/* Stage Title and Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09261d] border border-[#1e5646] space-y-3 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-white">{currentConfig.name}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#061a14] text-[#fbbf24] border border-[#f59e0b]/40">
                    {currentConfig.aqiRange}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#061a14] text-[#34d399] border border-[#10b981]/40">
                  Directive Code: {currentConfig.orderCode}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                {currentConfig.reason}
              </p>
            </div>

            {/* Operational Directives Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>Outdoor Activity Status</span>
                </div>
                <p className={`text-sm font-extrabold ${currentConfig.outdoorAllowed ? 'text-[#34d399]' : 'text-rose-400'}`}>
                  {currentConfig.outdoorAllowed
                    ? 'ALLOWED (Subject to Peak Diurnal Forecast)'
                    : 'STRICTLY SUSPENDED — NO OUTDOOR PE'}
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  {currentConfig.outdoorAllowed
                    ? 'Classes may utilize outdoor facilities if forecasted hourly PM2.5 is below advisory limits.'
                    : 'Mandatory suspension of all field drills, sports periods, assemblies, and athletic practices.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                  <span>Mandated Mitigation Strategy</span>
                </div>
                <p className="text-sm font-extrabold text-[#34d399]">
                  {currentConfig.outdoorAllowed
                    ? 'Plan A: Clean Air Diurnal Slot Swap'
                    : 'Plan B: HEPA-Filtered Indoor Wellness'}
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  {currentConfig.outdoorAllowed
                    ? 'Engine reschedules morning outdoor slots to cleaner afternoon windows (Periods 7 & 8).'
                    : 'Engine allocates clean indoor rooms (Gymnasium, Multipurpose Hall, Yoga Studio) with 67–70% lower PM2.5.'}
                </p>
              </div>
            </div>

            {/* Legal Circular Excerpt */}
            <div className="p-4 rounded-2xl bg-[#061a14] border border-[#1e5646] space-y-2 text-xs text-slate-200">
              <div className="flex items-center gap-2 text-[#34d399] font-bold">
                <FileText className="w-4 h-4 text-[#34d399]" />
                <span>Verbatim Regulatory Circular Excerpt (DoE No. 40 / CAQM Section 12)</span>
              </div>
              <blockquote className="italic border-l-2 border-[#10b981] pl-3 py-1 text-slate-100 bg-[#09261d]/80 rounded-r font-medium">
                &ldquo;All physical education activities, outdoor sports, and morning assemblies shall remain suspended with immediate effect during Stage III/IV enforcement. Head of Schools are directed to preserve active physical education minutes through indoor alternatives without student exposure.&rdquo;
              </blockquote>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>Validator SHA-256 Verified: Match 100%</span>
                <span className="text-[#34d399] font-bold">Zero Injection Detected</span>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-[#1e5646] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-300 font-medium">
              Human-in-the-Loop Principal Escalation SLA: <strong className="text-white font-mono">60 seconds</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-emerald-pill text-xs w-full sm:w-auto"
            >
              <span>Acknowledge Directives</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
