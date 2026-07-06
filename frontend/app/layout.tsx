/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NullKey - Secure Channel',
  description: 'Anonymous, ephemeral, end-to-end encrypted chat',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-terminal-bg text-gray-300 font-mono overflow-x-hidden min-h-screen flex flex-col relative">
        {children}
      </body>
    </html>
  );
}