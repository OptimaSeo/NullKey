/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PwaState {
  installable: boolean;
  updateReady: boolean;
  offline: boolean;
  deferredPrompt: Event | null;
}

export default function PwaRegister() {
  const [state, setState] = useState<PwaState>({
    installable: false,
    updateReady: false,
    offline: false,
    deferredPrompt: null,
  });
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  // --- Install prompt ---
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setState((s) => ({ ...s, installable: true, deferredPrompt: e }));
    };
    const installed = () => setState((s) => ({ ...s, installable: false, deferredPrompt: null }));
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  // --- Offline/online detection ---
  useEffect(() => {
    const goOnline = () => setState((s) => ({ ...s, offline: false }));
    const goOffline = () => setState((s) => ({ ...s, offline: true }));
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    setState((s) => ({ ...s, offline: !navigator.onLine }));
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // --- SW registration ---
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        swRegRef.current = reg;

        // Check for waiting SW (update already installed)
        if (reg.waiting) {
          setState((s) => ({ ...s, updateReady: true }));
        }

        // Detect new SW update being found
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              setState((s) => ({ ...s, updateReady: true }));
            }
          });
        });
      } catch {
        // SW registration failed — non-critical
      }
    };

    register();
  }, []);

  // --- Visibility change: reconnect WS & check SW ---
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;

      // Re-check SW update periodically
      if (swRegRef.current) {
        swRegRef.current.update().catch(() => {});
      }

      // If the page came from bfcache, the WebSocket client handles reconnect
      // via its own reconnect timer; we just dispatch a custom event so
      // the socket service can re-check liveness.
      window.dispatchEvent(new CustomEvent('nullkey:resume'));
    };

    // Pageshow fires on initial load AND when restored from bfcache
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        onVisibility();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!state.deferredPrompt) return;
    (state.deferredPrompt as any).prompt();
    const result = await (state.deferredPrompt as any).userChoice;
    if (result.outcome === 'accepted') {
      setState((s) => ({ ...s, installable: false, deferredPrompt: null }));
    }
  }, [state.deferredPrompt]);

  const handleUpdate = useCallback(() => {
    if (!swRegRef.current || !swRegRef.current.waiting) return;
    swRegRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }, []);

  return (
    <>
      {!state.installable && state.updateReady && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-[#00ff41]/40 bg-[#0d0d0d] px-4 py-3 shadow-lg">
          <span className="text-sm text-[#ceb788]">Update available</span>
          <button
            onClick={handleUpdate}
            className="rounded border border-[#00ff41] px-3 py-1 text-xs text-[#00ff41] hover:bg-[#00ff41]/10"
          >
            Reload
          </button>
        </div>
      )}

      {state.installable && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-[#00ff41]/40 bg-[#0d0d0d] px-4 py-3 shadow-lg">
          <span className="text-sm text-[#ceb788]">Install NullKey</span>
          <button
            onClick={handleInstall}
            className="rounded border border-[#00ff41] px-3 py-1 text-xs text-[#00ff41] hover:bg-[#00ff41]/10"
          >
            Install
          </button>
        </div>
      )}

      {state.offline && (
        <div className="fixed bottom-4 left-4 z-50 rounded-lg border border-[#ff5555]/40 bg-[#0d0d0d] px-4 py-3 shadow-lg">
          <span className="text-sm text-[#ff5555]">You are offline</span>
        </div>
      )}
    </>
  );
}
