/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

interface Props {
  title: string;
  desc: string;
}

export default function FeaturePanel({ title, desc }: Props) {
  return (
    <div className="bg-card-bg border border-dark-green p-6 transition-colors duration-200 hover:border-neon-green">
      <div className="flex items-center justify-between mb-4">
        <div className="text-neon-green text-xl">
          {title === "Blind Relay" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neon-green opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {title === "Client Encryption" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neon-green opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )}
          {title === "Ephemeral" && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neon-green opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="text-sm text-neon-green tracking-widest uppercase mb-2">
        {title}
      </h3>
      <p className="text-xs text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}