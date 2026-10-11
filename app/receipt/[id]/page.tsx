import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ReceiptView } from '@/components/receipt/ReceiptView';

export const metadata: Metadata = { title: 'Receipt' };

async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReceiptView id={decodeURIComponent(id)} />;
}

export default function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="wrap py-32 text-center font-mono text-[13px] uppercase tracking-widest">Fetching the chain…</div>}>
      <Receipt params={props.params} />
    </Suspense>
  );
}
