import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Leaf } from 'lucide-react';
import { MadeWithAITag } from '@/components/layout/MadeWithAITag';

export default function PrivacyPage() {
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
            Privacy Policy & Data Protection 🛡️
          </h1>
          <p className="text-sm text-slate-300 font-medium mt-2">
            AirIndx & Saans (साँस) — Ecological Delhi-NCR Air Safety Framework (Effective Oct 2026)
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
            <ShieldCheck className="w-5 h-5 text-[#34d399]" />
            1. Zero Child-Level Tracking & Data Minimization
          </h2>
          <p className="text-slate-200">
            AirIndx operates under strict zero-identifiable-data principles compliant with India&apos;s Digital Personal Data Protection (DPDP) Act. School timetables contain class-level rosters only; individual children, student health records, or personal demographics are never ingested, stored, or processed.
          </p>
        </section>

        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#fbbf24]" />
            2. Irreversible SHA-256 Ledger Cryptography
          </h2>
          <p className="text-slate-200">
            Every plan generation and approval action produces an immutable SHA-256 hash row. The audit chain records actor roles (e.g. <code className="text-[#34d399] font-bold">principal</code> or <code className="text-[#34d399] font-bold">vice_principal</code>) and timestamped canonical JSON blocks, ensuring complete tamper-evident auditability without exposing personal information.
          </p>
        </section>

        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#fb923c]" />
            3. Bilingual Parent Advisories & Click-to-Share Links
          </h2>
          <p className="text-slate-200">
            Notices are rendered as WhatsApp click-to-share links. The system never pushes unsolicited messages or stores parent contact directories on unverified external servers. All transmissions are initiated by authorised school leadership.
          </p>
        </section>

        <section className="p-6 sm:p-7 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] space-y-3 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#34d399]" />
            4. Institutional Compliance & Inquiries
          </h2>
          <p className="text-slate-200">
            For compliance verifications or district authority audits, contact the Delhi-NCR Air Safety Directorate at <span className="text-[#34d399] font-mono font-bold">compliance@saans.delhi.gov.in</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
