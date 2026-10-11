'use client';

import { MapPin, ShieldCheck } from 'lucide-react';
import { DELHI_ZONES } from '@/lib/mockData';
import { getAQIColor, getStageColor } from '@/lib/utils';

export function ExposureMap() {
  return (
    <div className="p-6 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-[#061a14] text-[#34d399] border border-[#1e5646] shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Delhi—NCR District Compliance Map
            </h2>
          </div>
          <p className="text-slate-200 text-xs font-medium">
            Compliance monitoring across 288 educational institutions in 6 Delhi—NCR zones
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-[#34d399] bg-[#061a14] border border-[#1e5646] px-3.5 py-1.5 rounded-full shadow-sm font-bold">
          <ShieldCheck className="w-4 h-4 text-[#34d399]" />
          <span>99.2% District GRAP Compliance</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DELHI_ZONES.map((zone) => (
          <div
            key={zone.id}
            className="p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] space-y-3 hover:border-[#10b981]/60 transition-all duration-300 shadow-lg group"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-sm">{zone.name}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getStageColor(zone.stage)}`}>
                Stage {zone.stage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-[#061a14] border border-[#1e5646]">
                <span className="text-slate-300 text-[11px] font-medium">Current AQI</span>
                <div className={`text-base font-black font-mono mt-0.5 ${getAQIColor(zone.aqi)}`}>
                  {zone.aqi}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#061a14] border border-[#1e5646]">
                <span className="text-slate-300 text-[11px] font-medium">Schools Active</span>
                <div className="text-base font-black font-mono text-white mt-0.5">
                  {zone.schoolsCount} <span className="text-xs text-slate-300 font-normal">schools</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#1e5646]">
              <span className="text-slate-300 font-medium">Compliance Rate:</span>
              <span className="font-bold font-mono text-[#34d399]">{zone.compliancePct}% Compliant</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
