import Link from 'next/link';
import { Scale, CheckCircle2, AlertTriangle, FileText, ArrowLeft, Leaf } from 'lucide-react';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl space-y-10">
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
            Terms of Service & Operational Governance ⚖️
          </h1>
          <p className="text-sm text-slate-300 font-medium mt-2">
            Governance Framework for Ecological Air Safety Planning (Effective Oct 2026)
          </p>
        </div>

        <Link
          href="/login"
          className="btn-solar-pill text-xs px-5 py-2.5 shrink-0"
        >
          <span>Principal Portal 👋</span>
        </Link>
      </div>

      <div className="space-y-6 text-sm text-slate-100 leading-relaxed font-medium">
        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#34d399]" />
            1. Acceptance of CAQM Regulatory Terms
          </h2>
          <p className="text-slate-200">
            By accessing or operating AirIndx / Saans, schools and administrative personnel agree to adhere to the Commission for Air Quality Management (CAQM) Graded Response Action Plan (GRAP) guidelines and relevant Directorate of Education (DoE) Delhi circulars.
          </p>
        </section>

        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
            2. Deterministic Human-in-the-Loop Authority
          </h2>
          <p className="text-slate-200">
            The deterministic engine computes mathematically optimal schedule swaps and indoor allocations. However, final operational decisions and parent advisory dispatches are exclusively executed by human school leadership (Principal or Vice-Principal).
          </p>
        </section>

        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#fbbf24]" />
            3. WebCrypto SHA-256 Ledger Verifiability
          </h2>
          <p className="text-slate-200">
            Any alteration to the underlying audit chain triggers instantaneous hash mismatches on the public verification portal. The cryptographic ledger constitutes legally verifiable proof of institutional compliance.
          </p>
        </section>

        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#34d399]" />
            4. Limitation of Operational Liability
          </h2>
          <p className="text-slate-200">
            AirIndx synthesizes official CAAQMS monitoring observations and Open-Meteo CAMS forecast feeds. Schools remain responsible for local on-campus building ventilation and campus-specific air purifier maintenance.
          </p>
        </section>
      </div>
    </div>
  );
}
