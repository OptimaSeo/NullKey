/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

export default function Header() {
  return (
    <header className="text-center mb-10">
      {/* Status Indicator with glow effect */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-neon-green opacity-20 blur-xl"></div>
          <div className="relative w-12 h-12 rounded-full border border-neon-green flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Title - Console UI Style */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neon-green tracking-[0.35em] mb-3 uppercase">
        NULLKEY
      </h1>
      
      {/* Subtitle */}
      <h2 className="text-lg md:text-xl text-gray-200 mb-6 font-light tracking-wide">
        Anonymous, ephemeral, end-to-end encrypted chat.
      </h2>
      
      {/* Slogan Divider */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="h-px bg-gradient-to-r from-transparent via-dark-green to-transparent w-16 md:w-32"></div>
        <span className="text-neon-green tracking-[0.2em] text-xs md:text-sm font-bold uppercase whitespace-nowrap">No Logs. No Accounts. No Trace.</span>
        <div className="h-px bg-gradient-to-r from-transparent via-dark-green to-transparent w-16 md:w-32"></div>
      </div>

      {/* Navigation */}
      <nav className="flex justify-center gap-8 mt-6 text-xs uppercase tracking-[0.2em]">
        <a href="/" className="text-gray-500 hover:text-neon-green transition">Home</a>
        <a href="/license" className="text-gray-500 hover:text-neon-green transition">License</a>
      </nav>
    </header>
  );
}