'use client';

import { ExposureMap } from '@/components/charts/ExposureMap';
import { AQIChart } from '@/components/charts/AQIChart';
import { AirQualityMonitor } from '@/components/real-time/AirQualityMonitor';

export default function CityBoardPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#11382d] text-[#34d399] border border-[#1e5646] font-mono">
            LIVE CAQM OVERSIGHT
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#11382d] text-[#fbbf24] border border-[#1e5646] font-mono">
            6 DISTRICT ZONES
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Delhi—NCR District City Board & Air Safety Monitor
        </h1>
        <p className="text-xs text-slate-200 font-medium max-w-2xl">
          District-wide real-time air quality telemetry and CAQM GRAP compliance oversight across all education zones.
        </p>
      </div>

      <ExposureMap />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AQIChart />
        </div>
        <div>
          <AirQualityMonitor />
        </div>
      </div>
    </div>
  );
}
