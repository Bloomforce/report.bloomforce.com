import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, DM_Mono } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
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
  title: 'The Living EHR Talent Benchmark | Bloomforce Insights',
  description:
    'Real pay from verified EHR professionals, blended with the live job market. Salary benchmarks by role, level, and region — updated continuously, not annually.',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'The Living EHR Talent Benchmark | Bloomforce Insights',
    description:
      'Know where you stand — salary, demand, and workforce sentiment for Epic & EHR talent, updated continuously.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${dmMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
