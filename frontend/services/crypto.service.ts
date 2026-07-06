/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { SessionManager } from '../src/crypto/session';
import { encryptMessage, decryptMessage, decryptFile, computeFileHash } from '../src/crypto/encryption';
import type { StoredKeyPair } from '../src/storage';
import { toBase64, fromBase64 } from '../utils/encoding';

export class CryptoService {
  private sm: SessionManager;

  private constructor(sm: SessionManager) {
    this.sm = sm;
  }

  static async create(storedKeys?: StoredKeyPair): Promise<CryptoService> {
    const sm = await SessionManager.create(storedKeys);
    return new CryptoService(sm);
  }

  get fingerprint(): string {
    return this.sm.fingerprint;
  }

  get privateKey(): Uint8Array {
    return this.sm.privateKey;
  }

  get publicKey(): Uint8Array {
    return this.sm.publicKey;
  }

  generateRoomSecret(): string {
    return SessionManager.generateRoomSecret();
  }

  generateInviteToken(): string {
    return SessionManager.generateInviteToken();
  }

  async getRoomId(roomSecret: string): Promise<string> {
    return SessionManager.getRoomId(roomSecret);
  }

  publicKeyBase64(): string {
    let binary = '';
    for (let i = 0; i < this.sm.publicKey.length; i++) binary += String.fromCharCode(this.sm.publicKey[i]);
    return btoa(binary);
  }

  async establishSharedSecret(peerPublicKeyB64: string, peerFingerprint: string): Promise<void> {
    const binary = atob(peerPublicKeyB64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    await this.sm.establishSharedSecret(bytes, peerFingerprint);
  }

  getSharedSecret(peerFingerprint: string): Uint8Array | undefined {
    return this.sm.getSharedSecret(peerFingerprint);
  }

  async encryptMessage(message: string | Uint8Array, peerFingerprint: string, salt: Uint8Array) {
    const sharedSecret = this.sm.getSharedSecret(peerFingerprint);
    if (!sharedSecret) throw new Error('No shared secret for peer');
    return encryptMessage(message, sharedSecret, salt);
  }

  async decryptMessage(ciphertext: Uint8Array, nonce: Uint8Array, peerFingerprint: string, salt: Uint8Array): Promise<string> {
    const sharedSecret = this.sm.getSharedSecret(peerFingerprint);
    if (!sharedSecret) throw new Error('No shared secret for peer');
    return decryptMessage(ciphertext, nonce, sharedSecret, salt);
  }

  async decryptFile(ciphertext: Uint8Array, nonce: Uint8Array, peerFingerprint: string, salt: Uint8Array): Promise<Uint8Array> {
    const sharedSecret = this.sm.getSharedSecret(peerFingerprint);
    if (!sharedSecret) throw new Error('No shared secret for peer');
    return decryptFile(ciphertext, nonce, sharedSecret, salt);
  }

  async computeFileHash(data: Uint8Array): Promise<string> {
    return computeFileHash(data);
  }

  needsSave(): boolean {
    return this.sm.fingerprint !== '' && !localStorage.getItem('keys_saved');
  }

  markSaved(): void {
    try { localStorage.setItem('keys_saved', '1'); } catch { /* */ }
  }
}
