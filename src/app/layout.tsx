import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zsóca Német Segéd',
  description: 'Interaktív, beszédfókuszú német nyelvtanulást segítő alkalmazás',
  manifest: '/manifest.json',
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
      </body>
    </html>
  );
}
