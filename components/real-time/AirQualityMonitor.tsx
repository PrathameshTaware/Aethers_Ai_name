'use client';

import { motion } from 'framer-motion';
import { Activity, Radio, Gauge, Wind } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getAQIColor, getStageColor } from '@/lib/utils';

export function AirQualityMonitor() {
  const { data: aqiData, isConnected } = useWebSocket();

  return (
    <div className="p-6 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#061a14] text-[#34d399] border border-[#1e5646] shadow-sm">
            <Radio className="w-4 h-4" />
          </div>
          <h3 className="font-extrabold text-white text-base tracking-tight">Live CAAQMS Air Feed</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs text-slate-200 font-mono font-medium">
            {isConnected ? 'Live WebSocket' : 'Offline'}
          </span>
        </div>
      </div>

      {aqiData && (
        <motion.div
          key={aqiData.timestamp}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-3"
        >
          <div className="p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] flex items-center justify-between shadow-lg">
            <div>
              <div className="text-xs text-slate-300 font-medium">Current Delhi—NCR AQI</div>
              <div className={`text-3xl font-black font-mono mt-0.5 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] ${getAQIColor(aqiData.aqi)}`}>
                {aqiData.aqi}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-300 font-medium">PM2.5 Level</div>
              <div className="text-xl font-black font-mono text-[#34d399] mt-0.5">
                {aqiData.pm25} <span className="text-xs font-medium text-slate-300">µg/m³</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#061a14] border border-[#1e5646]">
              <span className="text-slate-300 font-medium">GRAP Stage:</span>
              <div className="mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getStageColor(aqiData.stage)}`}>
                  Stage {aqiData.stage}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#061a14] border border-[#1e5646]">
              <span className="text-slate-300 font-medium">Exposure Avoided:</span>
              <div className="text-[#34d399] font-black font-mono text-sm mt-0.5">
                {aqiData.exposureReduction}%
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 font-mono text-right font-medium">
            Station: {aqiData.station} • {aqiData.timestamp}
          </div>
        </motion.div>
      )}
    </div>
  );
}
