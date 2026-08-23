/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // Pin the workspace root so Next.js doesn't guess it from stray
  // lockfiles in parent directories.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig