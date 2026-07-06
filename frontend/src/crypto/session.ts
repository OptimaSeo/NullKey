/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 */

import { generateKeyPair, getFingerprint } from './keygen';
import { deriveSharedSecret } from './encryption';
import * as random from '@stablelib/random';
import type { StoredKeyPair } from '../storage';

/**
 * Represents a cryptographic session for a room
 */
export class SessionManager {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  fingerprint: string;
  sharedSecrets: Map<string, Uint8Array>; // Map from peer fingerprint to shared secret

  /**
   * Create a SessionManager, optionally restoring from a previously stored keypair.
   */
  constructor(keyPair?: StoredKeyPair) {
    if (keyPair) {
      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;
    } else {
      const kp = generateKeyPair();
      this.privateKey = kp.privateKey;
      this.publicKey = kp.publicKey;
    }
    this.fingerprint = '';
    this.sharedSecrets = new Map();
  }

  /**
   * Async factory: create + initialize in one call.
   */
  static async create(keyPair?: StoredKeyPair): Promise<SessionManager> {
    const sm = new SessionManager(keyPair);
    await sm.initialize();
    return sm;
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
    const secret = random.randomBytes(32);
    return Array.from(secret)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a one-time invite token for joining a room
   * The token is sent to the server instead of the room secret,
   * so the server never learns the actual room secret.
   * @returns Random 256-bit token as hex string
   */
  static generateInviteToken(): string {
    const token = random.randomBytes(32);
    return Array.from(token)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate a room ID from the room secret
   * @param roomSecret The secret used to create the room
   * @returns Room ID as hex string of the hash
   */
  static async getRoomId(roomSecret: string): Promise<string> {
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(roomSecret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', secretBytes as BufferSource);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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