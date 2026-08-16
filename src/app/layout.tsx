import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Zsóca Német Segéd',
  description: 'Interaktív, beszédfókuszú német nyelvtanulást segítő alkalmazás',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Német Segéd',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hu">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-blue-200">
        <div className="max-w-md mx-auto min-h-screen flex flex-col shadow-lg bg-white">
          {children}
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
