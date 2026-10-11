'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, RefreshCw, Lock, Key } from 'lucide-react';
import { useDashboardStore } from '@/store/dashboardStore';
import { useHashVerification } from '@/hooks/useHashVerification';

export function HashChainVerifier({ receiptId = 'receipt-001' }: { receiptId?: string }) {
  const { auditChain, tamperAuditBlock } = useDashboardStore();
  const { verifyChain, verification, isVerifying } = useHashVerification();

  useEffect(() => {
    verifyChain(receiptId, auditChain);
  }, [receiptId, auditChain]);

  const handleTamperSim = (index: number) => {
    tamperAuditBlock(index);
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#11382d]/90 border border-[#1e5646] shadow-2xl space-y-6 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-[#061a14] text-[#34d399] border border-[#1e5646]">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Cryptographic Hash Chain Verifier 🔒
            </h2>
          </div>
          <p className="text-slate-200 text-xs font-medium">
            WebCrypto SHA-256 tamper-evident proof ledger for GRAP schedule compliance
          </p>
        </div>

        <button
          onClick={() => verifyChain(receiptId, auditChain)}
          disabled={isVerifying}
          className="btn-emerald-pill text-xs py-2 px-4 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>{isVerifying ? 'Recomputing SHA-256...' : 'Re-verify Chain 🔒'}</span>
        </button>
      </div>

      {/* Verification Status Banner */}
      {verification && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 shadow-lg ${
          verification.isValid
            ? 'bg-[#061a14] border-[#10b981] text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            : 'bg-[#061a14] border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
        }`}>
          {verification.isValid ? (
            <ShieldCheck className="w-6 h-6 text-[#34d399] shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-white">
              {verification.isValid ? 'Ledger Integrity 100% Cryptographically Verified' : 'Cryptographic Integrity Warning: Ledger Tampered'}
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {verification.isValid
                ? 'Every block hashes the previous block plus its canonical JSON payload. Zero modifications detected.'
                : 'Hash mismatch detected on chain block. Browser-level WebCrypto recalculation rejected the ledger.'}
            </p>
          </div>
        </div>
      )}

      {/* Audit Blocks List */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
          Canonical Audit Rows ({auditChain.length} Blocks)
        </h4>
        <div className="space-y-2">
          {auditChain.map((block, idx) => (
            <div
              key={block.hash + idx}
              className="p-3.5 rounded-xl bg-[#09261d] border border-[#1e5646] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5 font-mono">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-[#fbbf24]">Block #{idx + 1}</span>
                  <span className="text-slate-400 font-sans font-medium">—</span>
                  <span className="text-[#34d399] font-sans">{block.action}</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md font-mono">
                  Hash: {block.hash}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTamperSim(idx)}
                className="btn-pill-dark text-[10px] py-1 px-3 border border-[#1e5646] hover:border-rose-400 hover:text-rose-300 transition-colors cursor-pointer shrink-0"
              >
                Simulate Tamper
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
