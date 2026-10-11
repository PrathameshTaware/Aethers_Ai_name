import { Hero } from '@/components/landing/Hero';
import { Timetable } from '@/components/landing/Timetable';
import { ForecastStrip } from '@/components/landing/ForecastStrip';
import { ClosingCta, HowItWorks, ProofCards, Ticker } from '@/components/landing/Sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Ticker />
      <Timetable />
      <ForecastStrip />
      <ProofCards />
      <HowItWorks />
      <ClosingCta />
    </>
  );
}
