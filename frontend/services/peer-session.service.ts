/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

export type PeerSessionState =
  | 'DISCONNECTED'
  | 'ROOM_JOINED'
  | 'KEY_PENDING'
  | 'KEY_SENT'
  | 'READY';

export interface PeerSession {
  fingerprint: string;
  username: string;
  state: PeerSessionState;
  publicKeyReceived: Uint8Array | null;
  sharedSecretReady: boolean;
}

export type SendKeyExchangeFn = () => void;

export class PeerSessionManager {
  private sessions: Map<string, PeerSession> = new Map();
  private sendKeyExchange: SendKeyExchangeFn | null = null;

  setSendKeyExchange(fn: SendKeyExchangeFn): void {
    this.sendKeyExchange = fn;
  }

  private broadcastKeyExchange(session: PeerSession): void {
    if (this.sendKeyExchange) {
      this.sendKeyExchange();
    }
    session.state = 'KEY_SENT';
  }

  /**
   * Reset all sessions to ROOM_JOINED on reconnect or room join.
   * This triggers a fresh handshake for each peer on the next event.
   */
  onRoomJoined(): void {
    for (const session of this.sessions.values()) {
      session.state = 'ROOM_JOINED';
      session.publicKeyReceived = null;
      session.sharedSecretReady = false;
    }
  }

  /**
   * A peer joined the room. Always resets state and sends our key,
   * because client:joined means the peer just arrived or reconnected.
   */
  onPeerJoined(fingerprint: string, username: string): boolean {
    let session = this.sessions.get(fingerprint);
    if (!session) {
      session = {
        fingerprint,
        username,
        state: 'ROOM_JOINED',
        publicKeyReceived: null,
        sharedSecretReady: false,
      };
      this.sessions.set(fingerprint, session);
    }
    session.username = username;
    session.publicKeyReceived = null;
    session.sharedSecretReady = false;

    this.broadcastKeyExchange(session);
    return true;
  }

  /**
   * We received a key:exchange from a peer.
   * Stores the public key. If we haven't sent ours yet, sends it now.
   * When both keys are exchanged, session reaches READY.
   * Returns the decoded public key if valid, null on base64 error.
   */
  onKeyReceived(fingerprint: string, publicKeyBase64: string, username: string): Uint8Array | null {
    let publicKey: Uint8Array;
    try {
      const binary = atob(publicKeyBase64);
      publicKey = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) publicKey[i] = binary.charCodeAt(i);
    } catch {
      return null;
    }

    let session = this.sessions.get(fingerprint);
    if (!session) {
      session = {
        fingerprint,
        username,
        state: 'ROOM_JOINED',
        publicKeyReceived: null,
        sharedSecretReady: false,
      };
      this.sessions.set(fingerprint, session);
    }
    session.username = username;
    session.publicKeyReceived = publicKey;

    if (session.state === 'KEY_SENT') {
      session.state = 'READY';
    } else if (session.state !== 'READY') {
      // We received their key but haven't sent ours yet — send it now
      this.broadcastKeyExchange(session);
      // After sending, both keys are now exchanged → READY
      session.state = 'READY';
    }

    return publicKey;
  }

  /**
   * Mark the shared secret as derived for a peer.
   * State must already be READY (both keys exchanged).
   */
  markSharedSecretReady(fingerprint: string): boolean {
    const session = this.sessions.get(fingerprint);
    if (!session || session.state !== 'READY') return false;
    session.sharedSecretReady = true;
    return true;
  }

  /**
   * A peer disconnected or left the room.
   * Removes the session entirely so a fresh one is created on rejoin.
   */
  onPeerLeft(fingerprint: string): void {
    this.sessions.delete(fingerprint);
  }

  /**
   * We disconnected from the server. Reset all sessions.
   */
  onDisconnected(): void {
    for (const session of this.sessions.values()) {
      session.state = 'DISCONNECTED';
      session.publicKeyReceived = null;
      session.sharedSecretReady = false;
    }
  }

  /**
   * We left the room. Clear all sessions.
   */
  onLeaveRoom(): void {
    this.sessions.clear();
  }

  /**
   * Check if a peer session is ready for communication.
   */
  isReady(fingerprint: string): boolean {
    const session = this.sessions.get(fingerprint);
    return !!session && session.state === 'READY' && session.sharedSecretReady;
  }

  /**
   * Get fingerprint of all peers with a READY session.
   */
  getReadyPeers(): string[] {
    const result: string[] = [];
    for (const [fp, session] of this.sessions) {
      if (session.state === 'READY') result.push(fp);
    }
    return result;
  }

  /**
   * Get session state for a peer (for logging/debugging).
   */
  getSessionState(fingerprint: string): PeerSessionState | undefined {
    return this.sessions.get(fingerprint)?.state;
  }
}
