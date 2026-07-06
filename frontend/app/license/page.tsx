/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import Header from '../../components/Header';

export default function LicensePage() {
  return (
    <>
      <div className="scanlines" />
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 py-12">
        <Header />

        <section className="w-full max-w-3xl space-y-10">

          {/* Intro */}
          <div className="border border-dark-green bg-card-bg p-6">
            <h2 className="text-neon-green text-xl font-semibold mb-4 uppercase tracking-[0.15em]">
              License
            </h2>
            <p className="leading-relaxed text-sm">
              NullKey is <span className="text-neon-green">free and open source</span> software.
              You can use, modify, and redistribute it freely under the terms of the
              GNU Affero General Public License v3.0 (AGPL-3.0).
            </p>
            <p className="leading-relaxed text-sm mt-3">
              For organizations that need to integrate NullKey into proprietary or
              closed-source products without the copyleft obligations of the AGPL,
              we offer a <span className="text-neon-green">commercial license</span>.
            </p>
          </div>

          {/* AGPL-3.0 */}
          <div className="border border-dark-green bg-card-bg p-6">
            <h3 className="text-neon-green text-lg font-semibold mb-3 uppercase tracking-[0.15em]">
              Open Source — AGPL-3.0
            </h3>
            <ul className="text-sm space-y-2 leading-relaxed list-disc list-inside text-gray-400">
              <li>Free to use, modify, and distribute</li>
              <li>Source code must be disclosed when distributed or run as a network service</li>
              <li>Derivative works must be licensed under AGPL-3.0</li>
              <li>
                <a
                  href="https://www.gnu.org/licenses/agpl-3.0.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-green underline hover:opacity-80"
                >
                  Full license text
                </a>
              </li>
            </ul>
            <div className="mt-4">
              <a
                href="https://github.com/OptimaSeo-Indonesia/NullKey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border border-neon-green text-neon-green px-5 py-2 text-sm uppercase tracking-[0.15em] hover:bg-neon-green hover:text-black transition"
              >
                View Source on GitHub
              </a>
            </div>
          </div>

          {/* Commercial */}
          <div className="border border-neon-green bg-card-bg p-6">
            <h3 className="text-neon-green text-lg font-semibold mb-3 uppercase tracking-[0.15em]">
              Commercial License
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              The commercial license is intended for organizations that want to use NullKey
              in proprietary environments without the AGPL copyleft requirements. Benefits
              include:
            </p>
            <ul className="text-sm space-y-2 leading-relaxed list-disc list-inside text-gray-400 mb-6">
              <li>Use NullKey in closed-source products</li>
              <li>No obligation to disclose proprietary modifications</li>
              <li>Integration into commercial applications and services</li>
              <li>Perpetual or annual terms available</li>
            </ul>
            <a
              href="mailto:nullkey@optimaseo.id?subject=Commercial%20License%20Inquiry"
              className="inline-block border border-neon-green bg-neon-green text-black px-6 py-2 text-sm uppercase tracking-[0.15em] font-bold hover:opacity-80 transition"
            >
              Request a Commercial License
            </a>
          </div>

          {/* FAQ */}
          <div className="border border-dark-green bg-card-bg p-6">
            <h3 className="text-neon-green text-lg font-semibold mb-4 uppercase tracking-[0.15em]">
              FAQ
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-neon-green font-semibold mb-1">
                  Can I use NullKey for free in my commercial product?
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Yes, if your use complies with the AGPL-3.0. You must make your source
                  code available to users and license derivative works under AGPL-3.0.
                </p>
              </div>
              <div>
                <p className="text-neon-green font-semibold mb-1">
                  What if I just host NullKey for internal use?
                </p>
                <p className="text-gray-400 leading-relaxed">
                  The AGPL requires you to provide source code to anyone who uses the
                  software over a network. For internal-only deployment behind a firewall
                  with no external users, this may not apply, but we recommend contacting
                  us to confirm.
                </p>
              </div>
              <div>
                <p className="text-neon-green font-semibold mb-1">
                  How much does a commercial license cost?
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Pricing depends on the scope of use. Contact us at{' '}
                  <a href="mailto:nullkey@optimaseo.id" className="text-neon-green underline">
                    nullkey@optimaseo.id
                  </a>{' '}
                  with a brief description of your use case and we will provide a quote.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-600 space-y-1">
          <p>&copy; {new Date().getFullYear()} OptimaSeo. All rights reserved.</p>
          <p>
            <a href="/" className="text-neon-green underline hover:opacity-80">Back to NullKey</a>
          </p>
        </footer>
      </main>
    </>
  );
}
