import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/context/auth-context';
import { FIVSEDProvider } from '@/lib/context/fivsed-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FIVSED — Firmware Integrity Verification and Security Event Detection',
  description: 'Remote SOC monitoring dashboard for STM32 firmware integrity verification, ESP32 telemetry ingestion, and real-time security event detection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
        <AuthProvider>
          <FIVSEDProvider>
            {children}
          </FIVSEDProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
