/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

import FeaturePanel from './FeaturePanel';

export default function FeatureCards() {
  return (
    <>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-8 max-w-6xl mx-auto w-full">
        <FeaturePanel
          title="Blind Relay"
          desc="Server relays encrypted data only. It cannot read message contents."
        />
        <FeaturePanel
          title="Client Encryption"
          desc="Browser generates encryption keys locally. Messages protected using X25519, HKDF-SHA256 and AES-256-GCM."
        />
        <FeaturePanel
          title="Ephemeral"
          desc="Messages are not stored permanently. Rooms expire automatically after inactivity."
        />
      </section>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-5 md:mb-8 text-[11px] md:text-xs text-gray-400">
        <span className="text-neon-green">✓</span><span className="mr-2">End-to-End Encrypted</span>
        <span className="text-neon-green">✓</span><span className="mr-2">Browser Only</span>
        <span className="text-neon-green">✓</span><span className="mr-2">Self Host Friendly</span>
        <span className="text-neon-green">✓</span><span className="mr-2">No Registration</span>
      </div>
    </>
  );
}
