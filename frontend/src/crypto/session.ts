/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { generateKeyPair, getFingerprint } from './keygen';
import { deriveSharedSecret } from './encryption';
import * as random from '@stablelib/random';

/**
 * Represents a cryptographic session for a room
 */
export class SessionManager {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  fingerprint: string;
  sharedSecrets: Map<string, Uint8Array>; // Map from peer fingerprint to shared secret

  constructor() {
    const keyPair = generateKeyPair();
    this.privateKey = keyPair.privateKey;
    this.publicKey = keyPair.publicKey;
    this.fingerprint = ''; // Will be set after async initialization
    this.sharedSecrets = new Map();
  }

  /**
   * Initialize the session manager and compute the fingerprint
   */
  async initialize(): Promise<void> {
    this.fingerprint = await getFingerprint(this.publicKey);
  }

  /**
   * Generate a room secret for creating a new room
   * @returns Random 256-bit room secret as hex string
   */
  static generateRoomSecret(): string {
    const secret = random.randomBytes(32); // 32 bytes = 256 bits
    return Array.from(secret)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a room ID from the room secret
   * @param roomSecret The secret used to create the room
   * @returns Room ID as hex string of the hash
   */
  static getRoomId(roomSecret: string): string {
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(roomSecret);
    
    return crypto.subtle.digest('SHA-256', secretBytes).then(hashBuffer => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  /**
   * Establish a shared secret with a peer
   * @param peerPublicKey Public key of the peer
   * @param peerFingerprint Fingerprint of the peer (used as key in map)
   */
  async establishSharedSecret(peerPublicKey: Uint8Array, peerFingerprint: string): Promise<void> {
    const sharedSecret = deriveSharedSecret(this.privateKey, peerPublicKey);
    this.sharedSecrets.set(peerFingerprint, sharedSecret);
  }

  /**
   * Get a shared secret for a specific peer
   * @param peerFingerprint Fingerprint of the peer
   * @returns Shared secret or undefined if not found
   */
  getSharedSecret(peerFingerprint: string): Uint8Array | undefined {
    return this.sharedSecrets.get(peerFingerprint);
  }
}