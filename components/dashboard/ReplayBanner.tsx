'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Cpu, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useDashboardStore } from '@/store/dashboardStore';
import { STAGE_CONFIGS } from '@/lib/mockData';

export function ReplayBanner() {
  const { currentStage } = useDashboardStore();
  const stageInfo = STAGE_CONFIGS[currentStage];

  return (
    <div className="w-full bg-[#061a14] border-b border-[#1e5646] px-4 py-3 text-xs shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.3)]">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-white text-sm">
                GRAP {stageInfo.name} Declared in Delhi—NCR
              </span>
              <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-[#11382d] text-[#fbbf24] border border-[#1e5646] shadow-sm">
                Order {stageInfo.orderCode}
              </span>
            </div>
            <p className="text-slate-200 text-xs mt-0.5 font-medium">
              {stageInfo.reason}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[#34d399] bg-[#11382d] border border-[#1e5646] px-3 py-1 rounded-full text-[11px] font-bold">
            <Cpu className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Deterministic Replay Engine</span>
          </div>

          <Link
            href="/conditions"
            className="btn-solar-pill text-[11px] py-1 px-3.5"
          >
            <FileText className="w-3 h-3" />
            <span>Read Conditions</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
