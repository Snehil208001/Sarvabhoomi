import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SplashScreen } from '@/components/SplashScreen';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#101010',
};

export const metadata: Metadata = {
  title: 'Sarvabhoomi Capital & Investment | Nepal P2P Property Marketplace',
  description:
    "Nepal's Zero-Brokerage P2P Property Marketplace & Wealth Tracker. Direct peer-to-peer real estate with verified cadastral boundaries and transparent valuation.",
  icons: {
    icon: '/logo/logo-mark.png',
    apple: '/logo/logo-mark.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(!sessionStorage.getItem('sarvabhoomi-splash-seen')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('splash-active');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-black text-white antialiased selection:bg-gold selection:text-black font-sans">
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
