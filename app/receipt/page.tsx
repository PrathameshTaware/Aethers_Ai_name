import type { Metadata } from 'next';
import { ReceiptFinder } from '@/components/receipt/ReceiptFinder';

export const metadata: Metadata = { title: 'Verify a receipt' };

export default function ReceiptIndexPage() {
  return <ReceiptFinder />;
}
