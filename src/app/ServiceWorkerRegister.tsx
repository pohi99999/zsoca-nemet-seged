'use client';

import { useEffect } from 'react';

/**
 * Registers the offline-caching service worker so the app shell stays
 * usable on a flaky mobile connection once it has been opened once.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }, []);

  return null;
}
