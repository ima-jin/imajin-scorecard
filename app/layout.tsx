import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { ImajinAuth } from '@/components/ImajinAuth';

const IMAJIN_URL = process.env.NEXT_PUBLIC_IMAJIN_AUTH_URL || 'https://imajin.ai';

export const metadata: Metadata = {
  title: 'ScoreCard | Imajin',
  description: 'Lead generation & qualification powered by Imajin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gray-950/90 backdrop-blur border-b border-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="font-semibold text-white hover:text-amber-400 transition-colors">
              📊 ScoreCard
            </Link>
            <span className="text-gray-600">on</span>
            <a href={IMAJIN_URL} className="text-amber-500/80 font-medium hover:text-amber-400 transition-colors">Imajin</a>
          </div>
          <ImajinAuth />
        </header>
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
