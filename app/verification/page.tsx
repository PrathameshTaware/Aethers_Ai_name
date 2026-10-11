'use client';

import { HashChainVerifier } from '@/components/verification/HashChainVerifier';
import { ReceiptDisplay } from '@/components/verification/ReceiptDisplay';

export default function VerificationPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#11382d] text-[#34d399] border border-[#1e5646] font-mono">
            WEBCRYPTO SHA-256
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#11382d] text-[#fbbf24] border border-[#1e5646] font-mono">
            TAMPER-PROOF LEDGER
          </span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Cryptographic Public Verification Ledger
        </h1>
        <p className="text-xs text-slate-200 font-medium max-w-2xl">
          WebCrypto SHA-256 hash chain verification portal for public audits, zero-knowledge compliance, and CAQM compliance receipts.
        </p>
      </div>

      <ReceiptDisplay receiptId="receipt-delhi-sch-481" />
      <HashChainVerifier receiptId="receipt-delhi-sch-481" />
    </div>
  );
}
