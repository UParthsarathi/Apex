import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'DailyLog',
  description: 'Mobile-first daily tracker',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} min-h-screen`}>
      <body suppressHydrationWarning className="min-h-screen bg-[#0A0A0A] text-white selection:bg-white/20">{children}</body>
    </html>
  );
}
