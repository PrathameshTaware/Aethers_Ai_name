'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface AtmosphericCondition {
  id: string;
  name: string;
  label: string;
  stage: string;
  pm25: number;
  aqi: number;
  description: string;
  recommendation: string;
}

export const ATMOSPHERIC_CONDITIONS: AtmosphericCondition[] = [
  {
    id: 'partly-cloudy',
    name: 'Partly Cloudy',
    label: 'Stage I — Advisory Window',
    stage: 'Stage I',
    pm25: 68,
    aqi: 142,
    description: 'Moderate boundary cloud cover with afternoon wind mixing. Clean air swap window opens at 14:00.',
    recommendation: 'Move outdoor PE to afternoon periods (P7/P8).',
  },
  {
    id: 'rain',
    name: 'Precipitation / Rain',
    label: 'Natural Washout',
    stage: 'Normal',
    pm25: 28,
    aqi: 48,
    description: 'Natural particulate scavenging via precipitation. Ambient PM2.5 suppressed across NCR districts.',
    recommendation: 'All outdoor sports fully permitted.',
  },
  {
    id: 'particulate-cloud',
    name: 'Dense Smog & Particulate',
    label: 'Stage IV — Toxic Hazard',
    stage: 'Stage IV',
    pm25: 460,
    aqi: 495,
    description: 'Severe winter inversion layer. Particulate matter exceeds 450 µg/m³. Red-alert toxic air emergency.',
    recommendation: 'Zero outdoor activity. Mandatory HEPA indoor active sessions.',
  },
  {
    id: 'crescent-moon',
    name: 'Clear Night Rehearsal',
    label: 'Off-Peak Diurnal Contingency',
    stage: 'Stage II',
    pm25: 110,
    aqi: 215,
    description: 'Diurnal nocturnal cooling with surface temperature inversion. Overnight rehearsal engine active.',
    recommendation: 'Pre-schedule tomorrow morning indoor room allocations.',
  },
  {
    id: 'pollutant-molecule',
    name: 'Aerosol / PM2.5 Spike',
    label: 'Stage III — CAQM Emergency',
    stage: 'Stage III',
    pm25: 312,
    aqi: 388,
    description: 'CAQM Directive r-017 invoked. Fine particulate spike across Delhi-NCR school districts.',
    recommendation: 'Strict outdoor sports suspension. Re-plan to Yoga, Table Tennis, Ergometrics.',
  },
  {
    id: 'solar-dispersion',
    name: 'Peak Solar Irradiance',
    label: 'Solar Convection Dispersion',
    stage: 'Stage I',
    pm25: 54,
    aqi: 118,
    description: 'Strong boundary layer thermal lift. Surface pollutants dispersed by vertical solar convection.',
    recommendation: 'Preserve full curriculum timetable without modifications.',
  },
];

interface AtmosphericIconsProps {
  activeId?: string;
  onSelect?: (condition: AtmosphericCondition) => void;
}

export function AtmosphericIcons({ activeId = 'pollutant-molecule', onSelect }: AtmosphericIconsProps) {
  const [selected, setSelected] = useState<string>(activeId);

  const handleSelect = (condition: AtmosphericCondition) => {
    setSelected(condition.id);
    if (onSelect) {
      onSelect(condition);
    }
  };

  const currentCondition = ATMOSPHERIC_CONDITIONS.find((c) => c.id === selected) || ATMOSPHERIC_CONDITIONS[4];

  return (
    <div className="w-full my-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider text-[#34D399]">
              Atmospheric Condition Controller 🌤️
            </span>
            <span className="text-[10px] bg-[#061A14] text-[#FBBF24] border border-[#1E5646] px-2.5 py-0.5 rounded-full font-mono font-bold shadow-sm">
              Screenshot 2 Icons
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Simulate real-time diurnal particulate dispersion and deterministic school schedule response
          </p>
        </div>

        {/* Selected Condition Chip - Solar Gold Active Glow (#F59E0B / #FBBF24) */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#061A14] border border-[#F59E0B] text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#FBBF24] animate-ping" />
          <span className="text-slate-200 font-medium">Active Condition:</span>
          <span className="text-[#FBBF24] font-extrabold">{currentCondition.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#11382D] text-[#34D399] font-mono font-bold border border-[#1E5646]">
            AQI {currentCondition.aqi}
          </span>
        </div>
      </div>

      {/* The 6 Minimalist Circular Icons in Deep Forest Card Container (#11382D / #1E5646) */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 md:gap-5 p-4 sm:p-5 rounded-2xl bg-[#11382D]/85 border border-[#1E5646] backdrop-blur-md shadow-xl shadow-black/40">
        {/* Icon 1: Sun behind Cloud */}
        <button
          type="button"
          onClick={() => handleSelect(ATMOSPHERIC_CONDITIONS[0])}
          className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === ATMOSPHERIC_CONDITIONS[0].id
              ? 'scale-105 ring-2 ring-[#F59E0B] shadow-[0_0_22px_rgba(245,158,11,0.55)] bg-[#061A14]'
              : 'hover:scale-105 hover:bg-[#1E5646]/60 border border-transparent hover:border-[#FB923C]/40'
          }`}
          title="Partly Cloudy — Stage I"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl transition-transform">
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 text-slate-950 stroke-current fill-none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="25" cy="25" r="7" strokeWidth="3" />
              <path d="M22 38h22c4.4 0 8-3.6 8-8s-3.6-8-8-8c-0.8 0-1.6 0.1-2.4 0.4C40.4 18 36.5 15 31.8 15c-5.8 0-10.6 4.3-11.4 10C16 25.5 13 28.5 13 32.5c0 4.1 3.4 7.5 7.5 7.5h1.5z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-100 group-hover:text-[#FBBF24] transition-colors text-center line-clamp-1">
            Partly Cloudy
          </span>
        </button>

        {/* Icon 2: Cloud with Rain */}
        <button
          type="button"
          onClick={() => handleSelect(ATMOSPHERIC_CONDITIONS[1])}
          className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === ATMOSPHERIC_CONDITIONS[1].id
              ? 'scale-105 ring-2 ring-[#F59E0B] shadow-[0_0_22px_rgba(245,158,11,0.55)] bg-[#061A14]'
              : 'hover:scale-105 hover:bg-[#1E5646]/60 border border-transparent hover:border-[#FB923C]/40'
          }`}
          title="Precipitation / Washout"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl transition-transform">
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 text-slate-950 stroke-current fill-none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 34h24c3.9 0 7-3.1 7-7s-3.1-7-7-7c-0.7 0-1.4 0.1-2 0.3C40.6 16.7 37 14 32.5 14c-5.3 0-9.7 3.8-10.4 9C18 23.4 15 26.2 15 30c0 4 3.4 7.2 7.4 7.2z" />
              <line x1="24" y1="41" x2="21" y2="47" strokeWidth="3" />
              <line x1="32" y1="41" x2="29" y2="47" strokeWidth="3" />
              <line x1="40" y1="41" x2="37" y2="47" strokeWidth="3" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-100 group-hover:text-[#FBBF24] transition-colors text-center line-clamp-1">
            Precipitation
          </span>
        </button>

        {/* Icon 3: Cloud with Particulate / Smog */}
        <button
          type="button"
          onClick={() => handleSelect(ATMOSPHERIC_CONDITIONS[2])}
          className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === ATMOSPHERIC_CONDITIONS[2].id
              ? 'scale-105 ring-2 ring-[#F59E0B] shadow-[0_0_22px_rgba(245,158,11,0.55)] bg-[#061A14]'
              : 'hover:scale-105 hover:bg-[#1E5646]/60 border border-transparent hover:border-[#FB923C]/40'
          }`}
          title="Particulate Smog — Stage IV Toxic"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl transition-transform">
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 text-slate-950 stroke-current fill-none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 33h24c3.9 0 7-3.1 7-7s-3.1-7-7-7c-0.7 0-1.4 0.1-2 0.3C40.6 15.7 37 13 32.5 13c-5.3 0-9.7 3.8-10.4 9C18 22.4 15 25.2 15 29c0 4 3.4 7.2 7.4 7.2z" />
              <circle cx="26" cy="42" r="1.8" fill="currentColor" stroke="none" />
              <circle cx="34" cy="44" r="1.8" fill="currentColor" stroke="none" />
              <circle cx="41" cy="42" r="1.8" fill="currentColor" stroke="none" />
              <circle cx="34" cy="49" r="1.8" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-100 group-hover:text-[#FBBF24] transition-colors text-center line-clamp-1">
            PM2.5 Smog
          </span>
        </button>

        {/* Icon 4: Crescent Moon */}
        <button
          type="button"
          onClick={() => handleSelect(ATMOSPHERIC_CONDITIONS[3])}
          className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === ATMOSPHERIC_CONDITIONS[3].id
              ? 'scale-105 ring-2 ring-[#F59E0B] shadow-[0_0_22px_rgba(245,158,11,0.55)] bg-[#061A14]'
              : 'hover:scale-105 hover:bg-[#1E5646]/60 border border-transparent hover:border-[#FB923C]/40'
          }`}
          title="Night Rehearsal — Diurnal Dip"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl transition-transform">
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 text-slate-950 stroke-current fill-none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M41 44C29.4 44 20 34.6 20 23c0-3.5 0.9-6.8 2.4-9.8-7.8 3.5-13.4 11.4-13.4 20.6C9 47 18 56 29.2 56c9.2 0 17.1-5.6 20.6-13.4-3 1.5-6.3 2.4-9.8 2.4z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-100 group-hover:text-[#FBBF24] transition-colors text-center line-clamp-1">
            Night Rehearsal
          </span>
        </button>

        {/* Icon 5: Aerosol / PM2.5 Microscopic Core */}
        <button
          type="button"
          onClick={() => handleSelect(ATMOSPHERIC_CONDITIONS[4])}
          className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === ATMOSPHERIC_CONDITIONS[4].id
              ? 'scale-105 ring-2 ring-[#F59E0B] shadow-[0_0_22px_rgba(245,158,11,0.55)] bg-[#061A14]'
              : 'hover:scale-105 hover:bg-[#1E5646]/60 border border-transparent hover:border-[#FB923C]/40'
          }`}
          title="Aerosol / PM Core — Stage III"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl transition-transform">
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 text-slate-950 stroke-current fill-none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="32" cy="32" r="6" strokeWidth="3" />
              <line x1="32" y1="26" x2="32" y2="15" strokeWidth="3" />
              <line x1="28" y1="15" x2="36" y2="15" strokeWidth="3" />
              <line x1="32" y1="38" x2="32" y2="49" strokeWidth="3" />
              <line x1="28" y1="49" x2="36" y2="49" strokeWidth="3" />
              <line x1="37.2" y1="29" x2="46.7" y2="23.5" strokeWidth="3" />
              <line x1="44.7" y1="20" x2="48.7" y2="27" strokeWidth="3" />
              <line x1="37.2" y1="35" x2="46.7" y2="40.5" strokeWidth="3" />
              <line x1="48.7" y1="37" x2="44.7" y2="44" strokeWidth="3" />
              <line x1="26.8" y1="29" x2="17.3" y2="23.5" strokeWidth="3" />
              <line x1="15.3" y1="27" x2="19.3" y2="20" strokeWidth="3" />
              <line x1="26.8" y1="35" x2="17.3" y2="40.5" strokeWidth="3" />
              <line x1="19.3" y1="44" x2="15.3" y2="37" strokeWidth="3" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-100 group-hover:text-[#FBBF24] transition-colors text-center line-clamp-1">
            Aerosol Core
          </span>
        </button>

        {/* Icon 6: Solar Dispersion */}
        <button
          type="button"
          onClick={() => handleSelect(ATMOSPHERIC_CONDITIONS[5])}
          className={`group flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            selected === ATMOSPHERIC_CONDITIONS[5].id
              ? 'scale-105 ring-2 ring-[#F59E0B] shadow-[0_0_22px_rgba(245,158,11,0.55)] bg-[#061A14]'
              : 'hover:scale-105 hover:bg-[#1E5646]/60 border border-transparent hover:border-[#FB923C]/40'
          }`}
          title="Solar Convection Dispersion"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20 group-hover:shadow-xl transition-transform">
            <svg
              viewBox="0 0 64 64"
              className="w-10 h-10 text-slate-950 stroke-current fill-none"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="32" cy="32" r="9" strokeWidth="3" />
              <circle cx="32" cy="14" r="2" fill="currentColor" stroke="none" />
              <circle cx="45" cy="19" r="2" fill="currentColor" stroke="none" />
              <circle cx="50" cy="32" r="2" fill="currentColor" stroke="none" />
              <circle cx="45" cy="45" r="2" fill="currentColor" stroke="none" />
              <circle cx="32" cy="50" r="2" fill="currentColor" stroke="none" />
              <circle cx="19" cy="45" r="2" fill="currentColor" stroke="none" />
              <circle cx="14" cy="32" r="2" fill="currentColor" stroke="none" />
              <circle cx="19" cy="19" r="2" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-slate-100 group-hover:text-[#FBBF24] transition-colors text-center line-clamp-1">
            Solar Dispersion
          </span>
        </button>
      </div>

      {/* Atmospheric Context Explanation Card (Deep Forest Gray Surface #11382D) */}
      <motion.div
        key={currentCondition.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-3.5 p-4 rounded-xl bg-[#09261D]/90 border border-[#1E5646] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-sm">{currentCondition.name}</span>
            <span className="text-slate-500">—</span>
            <span className="text-[#FBBF24] font-bold">{currentCondition.label}</span>
          </div>
          <p className="text-slate-200 leading-relaxed font-medium">{currentCondition.description}</p>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Action Directive</span>
          <p className="text-[#34D399] font-extrabold mt-0.5">{currentCondition.recommendation}</p>
        </div>
      </motion.div>
    </div>
  );
}
