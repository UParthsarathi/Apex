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
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} min-h-screen`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">{children}</body>
    </html>
  );
}
