import type { Metadata } from 'next';
import './globals.css';
import EmbedAwareHeader from '@/components/EmbedAwareHeader';

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
        <EmbedAwareHeader />
        <div className="pt-14">
          {children}
        </div>
      </body>
    </html>
  );
}
