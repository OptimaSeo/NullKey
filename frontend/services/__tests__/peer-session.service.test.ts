/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { PeerSessionManager, PeerSessionState } from '../peer-session.service';

function b64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

describe('PeerSessionManager', () => {
  let manager: PeerSessionManager;
  let keyExchangeCalled: boolean;

  beforeEach(() => {
    manager = new PeerSessionManager();
    keyExchangeCalled = false;
    manager.setSendKeyExchange(() => {
      keyExchangeCalled = true;
    });
  });

  const aliceFp = 'a'.repeat(64);
  const bobFp = 'b'.repeat(64);
  const bobPubKey = b64FromBytes(new Uint8Array([1, 2, 3, 4]));

  describe('initial state', () => {
    it('starts with no sessions', () => {
      expect(manager.getReadyPeers()).toEqual([]);
      expect(manager.isReady(aliceFp)).toBe(false);
    });
  });

  describe('T1: ROOM_JOINED → KEY_PENDING → KEY_SENT (peer joined)', () => {
    it('sends key exchange on peer joined', () => {
      manager.onRoomJoined();
      const sent = manager.onPeerJoined(bobFp, 'Bob');
      expect(sent).toBe(true);
      expect(keyExchangeCalled).toBe(true);
      expect(manager.getSessionState(bobFp)).toBe('KEY_SENT');
    });

    it('adds peer to sessions map', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      expect(manager.getSessionState(bobFp)).toBe('KEY_SENT');
    });
  });

  describe('T2: ROOM_JOINED → KEY_SENT (received key first, reply not needed)', () => {
    it('sends key on first key received when state is ROOM_JOINED', () => {
      manager.onRoomJoined();
      const result = manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(keyExchangeCalled).toBe(true);
      // After sending, both keys exchanged → READY
      expect(manager.getSessionState(bobFp)).toBe('READY');
    });
  });

  describe('T3: KEY_SENT → READY (received their key after sending ours)', () => {
    it('transitions to READY on key received after we sent ours', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob'); // sends key → KEY_SENT
      expect(keyExchangeCalled).toBe(true);

      // Reset flag to verify no redundant send
      keyExchangeCalled = false;

      const result = manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(result).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(keyExchangeCalled).toBe(false); // already sent
      expect(manager.getSessionState(bobFp)).toBe('READY');
    });
  });

  describe('T4: KEY_SENT (redundant key from peer, no-op)', () => {
    it('stays READY on redundant key after both keys exchanged', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob'); // → KEY_SENT
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob'); // → READY

      keyExchangeCalled = false;
      const result = manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(result).toBeDefined();
      expect(keyExchangeCalled).toBe(false);
      expect(manager.getSessionState(bobFp)).toBe('READY');
    });
  });

  describe('T5: ROOM_JOINED → KEY_SENT (received key from peer, sends ours)', () => {
    it('sends key when receiving from peer while in ROOM_JOINED', () => {
      manager.onRoomJoined();
      const result = manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(result).toBeDefined();
      expect(keyExchangeCalled).toBe(true);
      // Both keys exchanged → READY
      expect(manager.getSessionState(bobFp)).toBe('READY');
    });
  });

  describe('T6: ROOM_JOINED (same peer rejoins, redundant event)', () => {
    it('resends key if peer rejoins while in ROOM_JOINED', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob'); // → KEY_SENT

      // Simulate disconnect/reconnect: onRoomJoined resets to ROOM_JOINED
      manager.onRoomJoined();
      expect(manager.getSessionState(bobFp)).toBe('ROOM_JOINED');

      keyExchangeCalled = false;
      manager.onPeerJoined(bobFp, 'Bob'); // → should send again
      expect(keyExchangeCalled).toBe(true);
      expect(manager.getSessionState(bobFp)).toBe('KEY_SENT');
    });
  });

  describe('T7: DISCONNECTED → ROOM_JOINED → KEY_SENT (reconnect flow)', () => {
    it('re-establishes session after disconnect and peer rejoin', () => {
      // Initial join
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      manager.markSharedSecretReady(bobFp);
      expect(manager.isReady(bobFp)).toBe(true);

      // Simulate disconnect
      manager.onDisconnected();
      expect(manager.getSessionState(bobFp)).toBe('DISCONNECTED');

      // Simulate reconnect
      manager.onRoomJoined();
      expect(manager.getSessionState(bobFp)).toBe('ROOM_JOINED');

      // Peer rejoins
      keyExchangeCalled = false;
      manager.onPeerJoined(bobFp, 'Bob'); // → should send key
      expect(keyExchangeCalled).toBe(true);
      expect(manager.getSessionState(bobFp)).toBe('KEY_SENT');

      // Peer sends key back
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(manager.getSessionState(bobFp)).toBe('READY');
    });
  });

  describe('T8: KEY_PENDING → KEY_SENT (dual key exchange, no race)', () => {
    it('handles simultaneous key exchange correctly', () => {
      manager.onRoomJoined();

      // Both peers detect each other and send keys
      manager.onPeerJoined(bobFp, 'Bob'); // → KEY_SENT
      expect(keyExchangeCalled).toBe(true);

      keyExchangeCalled = false;
      // Receive their key
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(keyExchangeCalled).toBe(false); // already sent
      expect(manager.getSessionState(bobFp)).toBe('READY');
    });
  });

  describe('T9: READY → peer left → removed from sessions', () => {
    it('removes peer session on peer left', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      manager.markSharedSecretReady(bobFp);
      expect(manager.isReady(bobFp)).toBe(true);

      manager.onPeerLeft(bobFp);
      expect(manager.isReady(bobFp)).toBe(false);
      expect(manager.getSessionState(bobFp)).toBeUndefined();
    });
  });

  describe('T10: LEAVE_ROOM → sessions cleared', () => {
    it('clears all sessions on leave room', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      manager.markSharedSecretReady(bobFp);

      manager.onLeaveRoom();
      expect(manager.getReadyPeers()).toEqual([]);
      expect(manager.isReady(bobFp)).toBe(false);
      expect(manager.getSessionState(bobFp)).toBeUndefined();
    });
  });

  describe('markSharedSecretReady', () => {
    it('returns false if session not in READY state', () => {
      manager.onRoomJoined();
      expect(manager.markSharedSecretReady(bobFp)).toBe(false);
    });

    it('returns true and marks shared secret ready', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(manager.markSharedSecretReady(bobFp)).toBe(true);
      expect(manager.isReady(bobFp)).toBe(true);
    });
  });

  describe('isReady', () => {
    it('returns false for unknown peer', () => {
      expect(manager.isReady('unknown')).toBe(false);
    });

    it('returns true only after full handshake + shared secret', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      expect(manager.isReady(bobFp)).toBe(false);

      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      expect(manager.isReady(bobFp)).toBe(false); // markSharedSecretReady not called yet

      manager.markSharedSecretReady(bobFp);
      expect(manager.isReady(bobFp)).toBe(true);
    });
  });

  describe('invalid base64', () => {
    it('returns null for invalid base64', () => {
      const result = manager.onKeyReceived(bobFp, '!!!invalid-b64!!!', 'Bob');
      expect(result).toBeNull();
    });
  });

  describe('getReadyPeers', () => {
    it('returns empty array when no ready peers', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      expect(manager.getReadyPeers()).toEqual([]);
    });

    it('returns fingerprint of ready peers', () => {
      manager.onRoomJoined();
      manager.onPeerJoined(bobFp, 'Bob');
      manager.onKeyReceived(bobFp, bobPubKey, 'Bob');
      manager.markSharedSecretReady(bobFp);
      expect(manager.getReadyPeers()).toEqual([bobFp]);
    });
  });
});
