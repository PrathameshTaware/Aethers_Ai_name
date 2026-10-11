'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Percent, Activity, Key, TrendingDown, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { getStageColor } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';

interface KPICardsProps {
  peMinutesPreserved?: number;
  exposureAvoided?: number;
  currentStage?: number;
  auditHead?: string;
}

export function KPICards({
  peMinutesPreserved = 100,
  exposureAvoided = 84.5,
  currentStage = 3,
  auditHead = '3b9a7852c08e...'
}: KPICardsProps) {
  const { data: aqiData } = useWebSocket();
  const liveStage = aqiData?.stage || currentStage;
  const liveReduction = aqiData?.exposureReduction || exposureAvoided;

  const cards = [
    {
      title: 'Curriculum PE Preserved',
      value: `${peMinutesPreserved}%`,
      subtitle: 'Physical education curriculum 100% maintained',
      icon: Percent,
      color: 'bg-[#061a14] text-[#34d399] border-[#1e5646]',
      badge: 'Active Eco Schedule',
      badgeBg: 'bg-[#061a14] text-[#34d399] border-[#1e5646]'
    },
    {
      title: 'Exposure Mitigation',
      value: `${liveReduction}%`,
      subtitle: 'PM2.5 reduction via clean room swaps',
      icon: TrendingDown,
      color: 'bg-[#061a14] text-[#34d399] border-[#1e5646]',
      badge: 'Calculated Reduction',
      badgeBg: 'bg-[#061a14] text-[#34d399] border-[#1e5646]'
    },
    {
      title: 'Active GRAP Stage',
      value: `Stage ${liveStage}`,
      subtitle: liveStage >= 3 ? 'Outdoor sports suspended' : 'Diurnal Advisory Mode',
      icon: Activity,
      color: 'bg-[#061a14] text-[#fbbf24] border-[#1e5646]',
      badge: `Order r-01${liveStage + 4}`,
      badgeBg: 'bg-[#061a14] text-[#fbbf24] border-[#1e5646]'
    },
    {
      title: 'Audit Block Head',
      value: auditHead,
      subtitle: 'WebCrypto SHA-256 ledger hash',
      icon: Key,
      color: 'bg-[#061a14] text-slate-300 border-[#1e5646]',
      badge: 'SHA-256 Validated',
      badgeBg: 'bg-[#061a14] text-[#34d399] border-[#1e5646]'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="p-5 rounded-2xl bg-[#11382d]/90 border border-[#1e5646] shadow-xl relative backdrop-blur-md group hover:border-[#10b981]/60 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl border ${card.color} flex items-center justify-center shadow-sm`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${card.badgeBg}`}>
                {card.badge}
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-white font-mono tracking-tight mb-1 drop-shadow-sm">
                {card.value}
              </div>
              <div className="text-xs font-bold text-slate-200">{card.title}</div>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
