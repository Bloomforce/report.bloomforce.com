import type { Metadata } from 'next';
import { DM_Serif_Display, Inter, DM_Mono } from 'next/font/google';
import './globals.css';

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const dmMono = DM_Mono({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '2025 EHR Workforce Trends Report | Bloomforce',
  description:
    'Interactive salary benchmarks, workforce sentiment, and industry trends from 300+ healthcare IT professionals. Explore the data that shapes EHR hiring.',
  openGraph: {
    title: '2025 EHR Workforce Trends Report | Bloomforce',
    description:
      'Interactive salary benchmarks and workforce insights from 300+ healthcare IT professionals.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${inter.variable} ${dmMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
