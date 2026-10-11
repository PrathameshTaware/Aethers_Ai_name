import type { Metadata } from 'next';
import { TodayView } from '@/components/today/TodayView';

export const metadata: Metadata = { title: "Today's brief" };

export default function TodayPage() {
  return <TodayView />;
}
