'use client';

import { ShieldCheck, QrCode } from 'lucide-react';

export function ReceiptDisplay({ receiptId = 'receipt-delhi-sch-481' }: { receiptId?: string }) {
  const rootHash = '1a82f9c4d81720a455bb2a09124f114c990a12e3456789abc0123456789abcdef';

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 max-w-2xl mx-auto backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[#1e5646] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#061a14] border border-[#1e5646] flex items-center justify-center text-[#34d399] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">Cryptographic Compliance Receipt</h3>
            <p className="text-xs text-slate-300 font-mono font-medium">Receipt ID: {receiptId}</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#061a14] text-[#34d399] border border-[#10b981]/40 font-mono shadow-[0_0_12px_rgba(16,185,129,0.25)]">
          VERIFIED & SEALED
        </span>
      </div>

      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] shadow-md">
          <div>
            <div className="text-slate-300 font-medium">School Establishment</div>
            <div className="font-bold text-white mt-0.5 text-sm">Delhi Public Air—Safety Academy</div>
            <div className="text-slate-300 mt-0.5 font-mono text-[11px]">School ID: SCH_481_DELHI</div>
          </div>
          <div>
            <div className="text-slate-300 font-medium">GRAP Directive Executed</div>
            <div className="font-bold text-[#fbbf24] mt-0.5 text-sm">Stage III Order (r-017)</div>
            <div className="text-slate-300 mt-0.5 font-mono text-[11px]">AQI Range: 401—450 Severe</div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Root SHA-256 State Digest</div>
          <div className="p-3.5 rounded-xl bg-[#061a14] font-mono text-xs text-[#34d399] break-all border border-[#1e5646] shadow-inner font-bold">
            {rootHash}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#09261d] border border-[#1e5646] shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-slate-900 shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm">Public Verification Endpoint</div>
              <div className="text-[#fbbf24] font-mono text-[11px] mt-0.5 font-bold hover:underline cursor-pointer">
                https://saans.delhi.gov.in/verify/{receiptId}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
