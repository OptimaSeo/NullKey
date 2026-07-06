/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

// Jest setup — must be plain JS, runs before transform pipeline.
// Provide `crypto.subtle` (jsdom only has getRandomValues) and `structuredClone`.

const { webcrypto } = require('node:crypto');

// Replace the entire crypto object — spread { ...webcrypto } loses prototype getters like `.subtle`.
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
  });
}

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// jsdom might not provide TextEncoder/TextDecoder
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
