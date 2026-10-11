'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Move, ArrowRightLeft, CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TimetableEntry } from '@/types/dashboard';
import { useDashboardStore } from '@/store/dashboardStore';

interface TimetableGridProps {
  schedule?: TimetableEntry[];
  onApprove?: (plan: 'A' | 'B') => void;
}

export function TimetableGrid({ schedule, onApprove }: TimetableGridProps) {
  const { schedule: storeSchedule, setSchedule, selectedPlan, setSelectedPlan, approvePlan, isApproved, approvedPlan } = useDashboardStore();
  const currentSchedule = schedule || storeSchedule;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(currentSchedule);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setSchedule(newItems);
  };

  const handleApprovalSubmit = (plan: 'A' | 'B') => {
    approvePlan(plan);
    if (onApprove) onApprove(plan);

    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 }
      });
    } catch {
      // Confetti fallback
    }
  };

  const getStatusBadge = (classification: string) => {
    switch (classification) {
      case 'BANNED':
        return 'bg-[#061a14] text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)] font-bold';
      case 'ADVISORY':
        return 'bg-[#061a14] text-[#fbbf24] border-[#f59e0b]/60 shadow-[0_0_10px_rgba(245,158,11,0.25)] font-bold';
      case 'ALLOWED':
        return 'bg-[#061a14] text-[#34d399] border-[#10b981]/60 shadow-[0_0_10px_rgba(16,185,129,0.25)] font-bold';
      default:
        return 'bg-[#061a14] text-slate-300 border-[#1e5646] font-bold';
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 backdrop-blur-md">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-[#061a14] text-[#34d399] border border-[#1e5646]">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Timetable Schedule Optimization 📅
            </h2>
          </div>
          <p className="text-slate-200 text-xs font-medium">
            GRAP Stage III Directive suspends outdoor activities. Re-order slots or approve Plan A / B strategy.
          </p>
        </div>

        {/* Action Approval Buttons in Solar Gold & Ecological Emerald */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleApprovalSubmit('A')}
            className={`btn-solar-pill text-xs py-2 px-4 cursor-pointer ${
              isApproved && approvedPlan === 'A' ? 'ring-2 ring-white shadow-[0_0_20px_rgba(245,158,11,0.8)]' : ''
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-950 font-bold" />
            <span>Approve Plan A (Swaps) ✨</span>
          </button>

          <button
            onClick={() => handleApprovalSubmit('B')}
            className={`btn-emerald-pill text-xs py-2 px-4 cursor-pointer ${
              isApproved && approvedPlan === 'B' ? 'ring-2 ring-[#fbbf24] shadow-[0_0_25px_rgba(16,185,129,0.8)]' : ''
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approve Plan B (Indoor) 🛡️</span>
          </button>
        </div>
      </div>

      {/* Plan Strategy Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setSelectedPlan('A')}
          className={`p-5 rounded-2xl cursor-pointer border transition-all duration-300 ${
            selectedPlan === 'A'
              ? 'bg-[#09261d] border-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.01]'
              : 'bg-[#09261d]/70 border-[#1e5646] hover:border-[#fb923c]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>Plan A: Clean Air Diurnal Slot Swaps</span>
              {selectedPlan === 'A' && <CheckCircle2 className="w-4 h-4 text-[#fbbf24]" />}
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#061a14] text-[#fbbf24] font-mono font-bold border border-[#f59e0b]/40">
              82% Exposure Cut
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            Re-align outdoor sports slots to afternoon periods (P7/P8) when forecasted PM2.5 levels subside naturally.
          </p>
        </div>

        <div
          onClick={() => setSelectedPlan('B')}
          className={`p-5 rounded-2xl cursor-pointer border transition-all duration-300 ${
            selectedPlan === 'B'
              ? 'bg-[#09261d] border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.01]'
              : 'bg-[#09261d]/70 border-[#1e5646] hover:border-[#34d399]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <span>Plan B: HEPA Indoor Wellness Sessions</span>
              {selectedPlan === 'B' && <CheckCircle2 className="w-4 h-4 text-[#34d399]" />}
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#061a14] text-[#34d399] font-mono font-bold border border-[#10b981]/40">
              100% PE Preserved
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            Convert outdoor physical education to indoor air-filtered activities (Chess, Table Tennis, Yoga, Ergometrics).
          </p>
        </div>
      </div>

      {/* Approval Confirmation Alert */}
      <AnimatePresence>
        {isApproved && (
          <div className="p-4 rounded-2xl bg-[#061a14] border border-[#10b981] flex items-center gap-3 text-white text-xs shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-[#34d399] shrink-0" />
            <div>
              <span className="font-extrabold text-white">Plan {approvedPlan} Approved & Digitally Signed</span>
              <p className="text-[11px] text-[#34d399] mt-0.5 font-medium">
                Principal signature digest registered into SHA-256 audit chain log. Parent advisories dispatched.
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Draggable Timetable Table in Deep Forest Palette */}
      <div className="overflow-x-auto rounded-2xl border border-[#1e5646] bg-[#09261d]/90 shadow-xl">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timetable-droppable">
            {(provided) => (
              <table
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-full text-left text-xs"
              >
                <thead className="bg-[#061a14] text-slate-200 border-b border-[#1e5646] font-bold">
                  <tr>
                    <th className="p-3.5 w-8 text-center"></th>
                    <th className="p-3.5">Class</th>
                    <th className="p-3.5">Period & Time</th>
                    <th className="p-3.5">Original Activity</th>
                    <th className="p-3.5">Forecast PM2.5</th>
                    <th className="p-3.5">Order Classification</th>
                    <th className="p-3.5">Optimized Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e5646]/80">
                  {currentSchedule.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <tr
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`transition-colors ${
                            dragSnapshot.isDragging ? 'bg-[#11382d] border-y border-[#34d399]' : 'hover:bg-[#11382d]/60'
                          }`}
                        >
                          <td className="p-3.5 text-center" {...dragProvided.dragHandleProps}>
                            <Move className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-grab mx-auto" />
                          </td>
                          <td className="p-3.5 font-extrabold text-white text-sm">{item.class}</td>
                          <td className="p-3.5 text-slate-200">
                            <div className="font-bold text-white">{item.period}</div>
                            <div className="text-[11px] text-slate-300 font-mono font-medium">{item.time}</div>
                          </td>
                          <td className="p-3.5 text-slate-200">
                            <div className="font-semibold text-white">{item.originalActivity}</div>
                            <div className="text-[11px] text-slate-300 font-medium">{item.teacher}</div>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                              item.forecastPM25 > 400 
                                ? 'bg-[#061a14] text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
                                : 'bg-[#061a14] text-[#fbbf24] border-[#f59e0b]/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                            }`}>
                              {item.forecastPM25} µg/m³
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadge(item.orderClassification)}`}>
                              {item.orderClassification}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-100">
                            <div className="font-bold text-white">{item.optimizedAction}</div>
                            {item.venue && (
                              <div className="text-[11px] text-[#34d399] font-mono font-semibold mt-0.5">Venue: {item.venue}</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              </table>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
