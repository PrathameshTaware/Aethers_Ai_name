'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, CheckCircle2, ShieldAlert, Cpu, Sparkles, SunMedium } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useStageSimulation } from '@/hooks/useStageSimulation';
import { GRAPStageNumber } from '@/types/dashboard';

export function StageSlider() {
  const { currentStage, setStage, setSchedule } = useDashboardStore();
  const { simulateStage, simulation, isLoading } = useStageSimulation();

  const stages = [
    { value: 1 as GRAPStageNumber, label: 'Stage I', range: '201–300 AQI', sub: 'Advisory Window', color: 'text-[#fbbf24]' },
    { value: 2 as GRAPStageNumber, label: 'Stage II', range: '301–400 AQI', sub: 'Diurnal Swaps', color: 'text-[#fb923c]' },
    { value: 3 as GRAPStageNumber, label: 'Stage III', range: '401–450 AQI', sub: 'Strict Suspension', color: 'text-[#f87171]' },
    { value: 4 as GRAPStageNumber, label: 'Stage IV', range: '>450 AQI', sub: 'Severe+ Emergency', color: 'text-[#ef4444]' },
  ];

  useEffect(() => {
    simulateStage(currentStage);
  }, [currentStage]);

  useEffect(() => {
    if (simulation) {
      setSchedule(simulation.planBSchedule);
    }
  }, [simulation]);

  const handleStageChange = (newStage: GRAPStageNumber) => {
    setStage(newStage);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-[#061a14] text-[#fbbf24] border border-[#1e5646]">
              <SunMedium className="w-4 h-4 text-[#fbbf24]" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Stage Rehearsal Simulator ⚡</span>
            </h2>
          </div>
          <p className="text-slate-200 text-xs font-medium">
            Adjust the declared GRAP stage to observe real-time schedule adjustments and exposure reduction
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#061a14] border border-[#1e5646] text-xs text-[#34d399] self-start sm:self-center shadow-sm">
          <Cpu className="w-3.5 h-3.5 text-[#34d399]" />
          <span className="font-bold">Deterministic Rules Engine</span>
        </div>
      </div>

      {/* Stage Selection Cards with Solar Gold & Tangerine Glows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const isSelected = currentStage === stage.value;
          return (
            <button
              type="button"
              key={stage.value}
              onClick={() => handleStageChange(stage.value)}
              className={`p-4 rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1e5646] to-[#09261d] border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-[1.02]'
                  : 'bg-[#09261d]/80 border-[#1e5646] hover:border-[#fb923c]/60 hover:bg-[#11382d]'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`font-black text-sm ${stage.color}`}>{stage.label}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" />}
              </div>
              <div className="text-[11px] text-white font-mono font-bold">{stage.range}</div>
              <div className="text-[10px] text-slate-300 font-medium mt-0.5">{stage.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Crisp Tangerine / Solar Gold Slider */}
      <div className="px-1 py-2">
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={currentStage}
          onChange={(e) => handleStageChange(Number(e.target.value) as GRAPStageNumber)}
          className="w-full h-2.5 bg-[#061a14] rounded-full appearance-none accent-[#f59e0b] cursor-pointer border border-[#1e5646]"
        />
        <div className="flex justify-between text-[11px] text-slate-300 font-mono font-bold mt-2">
          <span>Stage I (Advisory)</span>
          <span>Stage II (Reschedule)</span>
          <span>Stage III (Suspension)</span>
          <span>Stage IV (Severe+)</span>
        </div>
      </div>

      {/* Simulation Result Cards in Deep Forest Gray Surfaces */}
      {isLoading ? (
        <div className="flex items-center justify-center py-4 bg-[#061a14] rounded-2xl border border-[#1e5646] text-xs text-slate-300 font-mono">
          <Sparkles className="w-4 h-4 mr-2 animate-spin text-[#fbbf24]" />
          <span>Evaluating CAQM GRAP directives & timetable constraints...</span>
        </div>
      ) : simulation ? (
        <div className="p-5 rounded-2xl bg-[#09261d] border border-[#1e5646] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#061a14] text-[#fb923c] border border-[#1e5646]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-300 font-medium">Affected Outdoor Classes</div>
              <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                {simulation.affectedClassesCount} Classes Re-planned
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#061a14] text-[#34d399] border border-[#1e5646]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-300 font-medium">Curriculum Preservation</div>
              <div className="text-sm font-extrabold text-[#34d399] font-mono mt-0.5">
                {simulation.peMinutesPreserved}% Preserved (0 min lost)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#061a14] text-[#fbbf24] border border-[#1e5646]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-300 font-medium">Calculated Exposure Avoided</div>
              <div className="text-sm font-extrabold text-[#fbbf24] font-mono mt-0.5">
                {simulation.exposureReductionPct}% Mitigation
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
