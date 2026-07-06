/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

import { useState, useEffect } from 'react';
import MatrixBackground from './MatrixBackground';

interface Props {
  inviteLink: string;
  roomSecret: string;
  creatorFingerprint: string;
  onClose: () => void;
}

export default function QRCodeModal({ inviteLink, roomSecret, creatorFingerprint, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const QRCode = await import('qrcode/lib/browser');
        const url = await QRCode.toDataURL(inviteLink, {
          width: 200,
          margin: 2,
          color: { dark: '#00ff41', light: '#0a0a0a' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch {
        // QR failed — non-critical
      }
    };
    load();
    return () => { cancelled = true; };
  }, [inviteLink]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(inviteLink || roomSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-terminal-bg text-gray-300 font-mono">
      <MatrixBackground />
      <div className="scanlines fixed inset-0 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-lg mx-auto px-4 md:px-6 py-10 md:py-20 flex flex-col justify-center items-center min-h-screen">
        <div className="bg-card-bg border border-neon-green p-8 w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full border border-neon-green flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl text-neon-green tracking-[0.3em] uppercase mb-2">Secure Room Created</h2>
            <p className="text-xs text-gray-400">
              Share this invitation with the person you want to chat with.
              Only someone with this secret can join.
            </p>
          </div>

          <div className="flex justify-center mb-6">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="border border-dark-green" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] border border-dark-green flex items-center justify-center text-gray-600 text-xs">
                generating QR&hellip;
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1 tracking-widest uppercase">Room Secret</label>
            <div className="bg-terminal-bg border border-dark-green p-3 text-neon-green text-xs break-all select-all">
              {roomSecret}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1 tracking-widest uppercase">Invite Link</label>
            <div className="bg-terminal-bg border border-dark-green p-3 text-neon-green text-xs break-all select-all">
              {inviteLink}
            </div>
          </div>

          {creatorFingerprint && (
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 tracking-widest uppercase">Your Key Fingerprint</label>
              <div className="bg-terminal-bg border border-dark-green p-3 text-neon-green text-xs break-all select-all">
                {creatorFingerprint}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this fingerprint out-of-band so the recipient can verify your identity.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              className="px-6 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
              onClick={handleCopy}
            >
              {copied ? 'COPIED' : 'COPY LINK'}
            </button>
            <button
              className="px-6 py-3 border border-dark-green text-gray-400 text-sm tracking-[0.3em] hover:border-neon-green hover:text-neon-green transition"
              onClick={onClose}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
