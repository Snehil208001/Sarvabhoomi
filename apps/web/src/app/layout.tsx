import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sarvabhoomi Capital & Investment | Nepal P2P Property Marketplace',
  description:
    "Nepal's Zero-Brokerage P2P Property Marketplace & Wealth Tracker. Direct peer-to-peer real estate with verified cadastral boundaries and transparent valuation.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
