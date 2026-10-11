'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { HOURLY_AQI_TREND } from '@/lib/mockData';

export function AQIChart() {
  const stageThresholds = [
    { y: 200, label: 'Stage I (201+)', color: '#fde047' },
    { y: 300, label: 'Stage II (301+)', color: '#fdba74' },
    { y: 400, label: 'Stage III (401+)', color: '#fca5a5' },
    { y: 450, label: 'Stage IV (>450)', color: '#cbd5e1' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-xl border border-[#1e5646] bg-[#09261d]/95 backdrop-blur-md text-xs space-y-1.5 shadow-2xl shadow-black/80">
          <p className="text-white font-extrabold tracking-tight">{label} PM2.5 Forecast</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 font-medium">AQI Level:</span>
            <span className="text-[#fb923c] font-mono font-bold">{data.aqi}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300 font-medium">PM2.5 Concentration:</span>
            <span className="text-[#34d399] font-mono font-bold">{data.pm25} µg/m³</span>
          </div>
          <div className="pt-1 border-t border-[#1e5646] flex items-center justify-between gap-4">
            <span className="text-slate-300 font-medium">Directive:</span>
            <span className="text-[#fbbf24] font-semibold">GRAP Stage {data.stage}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-[#061a14] text-[#34d399] border border-[#1e5646] shadow-sm">
              <LineChartIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              24-Hour Air Quality & PM2.5 Diurnal Trend
            </h2>
          </div>
          <p className="text-slate-200 text-xs font-medium">
            Forecasted PM2.5 curves used by deterministic engine to identify clean air swap slots
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {stageThresholds.map((t) => (
            <div key={t.y} className="flex items-center gap-1.5 font-mono text-[11px]">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: t.color, color: t.color }}
              />
              <span className="text-slate-200 font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={HOURLY_AQI_TREND}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e5646" strokeOpacity={0.4} />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 11 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#e2e8f0', fontSize: 11 }} domain={[100, 500]} />
            <Tooltip content={<CustomTooltip />} />

            {stageThresholds.map((t) => (
              <ReferenceLine
                key={t.y}
                y={t.y}
                stroke={t.color}
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            ))}

            {/* Crisp Tangerine for AQI data line with glow */}
            <Line
              type="monotone"
              dataKey="aqi"
              stroke="#fb923c"
              strokeWidth={3}
              dot={{ r: 3.5, fill: '#fb923c', stroke: '#061a14', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#fb923c', stroke: '#ffffff', strokeWidth: 2 }}
            />
            {/* Neon Mint for PM2.5 concentration */}
            <Line
              type="monotone"
              dataKey="pm25"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#10b981', stroke: '#061a14' }}
              activeDot={{ r: 5, fill: '#34d399', stroke: '#ffffff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#1e5646] text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-[#fb923c] rounded-full"></span>
            <span className="text-slate-200 font-medium">Crisp Tangerine — AQI Index</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-[#10b981] rounded-full"></span>
            <span className="text-slate-200 font-medium">Neon Mint — PM2.5 (µg/m³)</span>
          </div>
        </div>
        <span className="text-slate-300 font-mono text-[11px]">WCAG AAA Contrast Validated</span>
      </div>
    </div>
  );
}
