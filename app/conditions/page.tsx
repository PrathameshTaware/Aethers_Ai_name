import Link from 'next/link';
import { Activity, ShieldAlert, CheckCircle, Info, HeartPulse, ArrowLeft, Sliders, FileText, Leaf } from 'lucide-react';
import { STAGE_CONFIGS } from '@/lib/mockData';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

export default function ConditionsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1e5646] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-200 hover:text-white px-3.5 py-1.5 rounded-full bg-[#11382d] border border-[#1e5646] transition-colors font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to AirIndx</span>
            </Link>
            <MadeWithAITag variant="badge" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
            GRAP Air Quality Conditions & Regulatory Directives 📜
          </h1>
          <p className="text-sm text-slate-300 font-medium mt-2">
            Graded Response Action Plan Directives for Delhi—NCR School Day Operations (Stages I to IV)
          </p>
        </div>

        <Link
          href="/dashboard/stage-rehearsal"
          className="btn-solar-pill text-xs px-5 py-2.5 shrink-0"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-950 font-bold" />
          <span>Stage Simulator ⚡</span>
        </Link>
      </div>

      <div className="space-y-6">
        {Object.values(STAGE_CONFIGS).map((stage) => (
          <div key={stage.stage} className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-xl space-y-4 hover:border-[#10b981] transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-black text-xl sm:text-2xl text-white">{stage.name}</span>
                <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-full bg-[#061a14] text-[#fbbf24] border border-[#f59e0b]/40">
                  {stage.aqiRange}
                </span>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#061a14] text-[#34d399] border border-[#10b981]/40">
                CAQM Order {stage.orderCode}
              </span>
            </div>

            <p className="text-sm text-slate-100 leading-relaxed font-medium">
              {stage.reason}
            </p>

            <div className="pt-4 border-t border-[#1e5646] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                Outdoor Activities Status: <strong className={stage.outdoorAllowed ? 'text-[#34d399]' : 'text-rose-400'}>
                  {stage.outdoorAllowed ? 'ALLOWED (Diurnal Window Active)' : 'STRICTLY SUSPENDED — PLAN B ACTIVE'}
                </strong>
              </span>

              <span className="text-slate-200 font-sans font-medium">
                Deterministic Engine Priority: <strong className="font-mono text-[#34d399]">Tier-1 Verbatim</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
