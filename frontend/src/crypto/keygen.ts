/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import * as x25519 from '@stablelib/x25519';
import * as random from '@stablelib/random';

/**
 * Generate a new X25519 key pair for E2EE
 * @returns Object containing private and public keys
 */
export function generateKeyPair() {
  const keyPair = x25519.generateKeyPair();
  
  return {
    privateKey: keyPair.secretKey,
    publicKey: keyPair.publicKey
  };
}

/**
 * Calculate fingerprint from public key
 * @param publicKey The public key to hash
 * @returns Hex string representation of the fingerprint
 */
export async function getFingerprint(publicKey: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', publicKey);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}