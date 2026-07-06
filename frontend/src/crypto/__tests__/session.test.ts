/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { SessionManager } from '../session';

describe('SessionManager', () => {
  describe('static generateRoomSecret', () => {
    it('returns a 64-character hex string', () => {
      const secret = SessionManager.generateRoomSecret();
      expect(secret).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces different secrets each call', () => {
      const a = SessionManager.generateRoomSecret();
      const b = SessionManager.generateRoomSecret();
      expect(a).not.toBe(b);
    });
  });

  describe('static getRoomId', () => {
    it('returns a 64-character hex string', async () => {
      const roomId = await SessionManager.getRoomId('test-secret');
      expect(roomId).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces deterministic output for same secret', async () => {
      const a = await SessionManager.getRoomId('foo');
      const b = await SessionManager.getRoomId('foo');
      expect(a).toBe(b);
    });

    it('produces different output for different secrets', async () => {
      const a = await SessionManager.getRoomId('foo');
      const b = await SessionManager.getRoomId('bar');
      expect(a).not.toBe(b);
    });
  });

  describe('create and initialize', () => {
    it('creates a SessionManager with keys and fingerprint', async () => {
      const sm = await SessionManager.create();
      expect(sm.privateKey).toBeDefined();
      expect(sm.publicKey).toBeDefined();
      expect(sm.fingerprint).toMatch(/^[0-9a-f]{64}$/);
      expect(sm.sharedSecrets.size).toBe(0);
    });

    it('restores from a stored keypair', async () => {
      const sm1 = await SessionManager.create();
      const stored = { privateKey: sm1.privateKey, publicKey: sm1.publicKey };

      const sm2 = await SessionManager.create(stored);
      expect(sm2.privateKey).toEqual(stored.privateKey);
      expect(sm2.publicKey).toEqual(stored.publicKey);
      expect(sm2.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('shared secrets', () => {
    it('establishes and retrieves a shared secret', async () => {
      const alice = await SessionManager.create();
      const bob = await SessionManager.create();

      await alice.establishSharedSecret(bob.publicKey, bob.fingerprint);
      await bob.establishSharedSecret(alice.publicKey, alice.fingerprint);

      const aliceSecret = alice.getSharedSecret(bob.fingerprint);
      const bobSecret = bob.getSharedSecret(alice.fingerprint);
      expect(aliceSecret).toBeDefined();
      expect(bobSecret).toBeDefined();
      expect(aliceSecret).toEqual(bobSecret);
    });
  });
});
