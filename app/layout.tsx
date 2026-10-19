import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1, // pinch-zoom stays allowed: much of the UI text is 7-10px
};

export const metadata: Metadata = {
  title: 'Apex Protocol',
  description: 'High-fidelity biometric and performance tracking protocol.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Apex Protocol',
  },
};

import { Providers } from './providers';
import { THEME_SCRIPT } from '@/lib/theme';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    // suppressHydrationWarning: THEME_SCRIPT sets data-theme on <html> before React hydrates
    <html lang="en" className={`${inter.variable} min-h-screen`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-surface text-white selection:bg-white/20">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
