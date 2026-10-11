import type { Metadata, Viewport } from 'next';
import {
  Fraunces, Inter, JetBrains_Mono, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi,
} from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shell/Providers';
import { Header } from '@/components/shell/Header';
import { Footer } from '@/components/shell/Footer';
import { Haze } from '@/components/shell/Haze';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['SOFT', 'WONK', 'opsz'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });
const notoDeva = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-noto-deva' });
const tiro = Tiro_Devanagari_Hindi({ subsets: ['devanagari'], weight: '400', variable: '--font-tiro' });

export const metadata: Metadata = {
  title: { default: 'Saans (साँस): Bad air. Better day.', template: '%s · Saans' },
  description:
    'Saans reads the Delhi-NCR GRAP order, re-plans the school day, and proves it with a receipt anyone can verify in their browser.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#f6f1e7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable} ${notoDeva.variable} ${tiro.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Haze />
          <Header />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
