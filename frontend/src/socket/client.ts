/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

/**
 * WebSocket client for NullKey
 */

export interface MessagePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_username: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
  message_type?: 'text' | 'file';
  recipient_fingerprint?: string;
  file_size?: number;
}

export interface KeyExchangePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_public_key: string;
  sender_username: string;
}

export type ServerEvent = 'success' | 'error' | 'key:exchange' | 'message:receive' | 'client:joined' | 'client:left' | 'typing:start' | 'typing:stop' | 'room:closed';
type MessageListener = (event: ServerEvent, payload: any) => void;
type StatusListener = (status: 'open' | 'close' | 'error', detail?: Event | CloseEvent) => void;

/**
 * Converts a Uint8Array to a lowercase hex string.
 */
export function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * Converts a lowercase hex string to a Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

interface QueuedMessage {
  event: string;
  payload: any;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private intentionalClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: QueuedMessage[] = [];
  private readonly maxQueueSize = 100;

  constructor(serverUrl: string) {
    this.url = serverUrl;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Called when the page resumes from background (visibilitychange / bfcache).
   * Forces a reconnect if the connection is stale or dead.
   */
  resume(): void {
    if (this.ws) {
      const state = this.ws.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CLOSED || state === WebSocket.CLOSING) {
        this.teardown();
        this.connect().catch(() => {});
      }
    } else {
      this.connect().catch(() => {});
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately.
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      // Tear down any half-open socket first.
      this.teardown();
      this.intentionalClose = false;

      this.ws = new WebSocket(this.url);

      // Connection timeout — reject if we don't open within 10s
      const timeout = setTimeout(() => {
        this.teardown();
        reject(new Error('Connection timed out after 10s'));
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.notifyStatus('open');
        this.flushQueue();
        resolve();
      };

      this.ws.onerror = () => {
        this.notifyStatus('error');
        // Only reject if we never opened; otherwise let onclose handle it.
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          clearTimeout(timeout);
          reject(new Error('WebSocket connection failed — is the server running?'));
        }
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        this.notifyStatus('close', event);
        // Auto-reconnect if the close was not intentional
        if (!this.intentionalClose) {
          this.ws = null;
          this.reconnectTimer = setTimeout(() => {
            this.connect().catch(() => {});
          }, 3000);
        }
      };

      this.ws.onmessage = (event) => {
        let data: any;
        try {
          data = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          return;
        }
        const evt = data.event as ServerEvent;
        const payload = data.payload;
        // Snapshot to a local array so a listener can safely unsubscribe during iteration.
        const listeners = Array.from(this.messageListeners);
        for (const listener of listeners) {
          try {
            listener(evt, payload);
          } catch (err) {
            console.error('Listener threw:', err);
          }
        }
      };
    });
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearQueue();
    this.teardown();
  }

  private teardown(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws.onmessage = null;
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch {
        // ignore
      }
    }
    this.ws = null;
  }

  private flushQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const queue = this.messageQueue;
    this.messageQueue = [];
    for (const msg of queue) {
      this.ws.send(JSON.stringify({ event: msg.event, payload: msg.payload }));
    }
  }

  private clearQueue(): void {
    this.messageQueue = [];
  }

  sendMessage(event: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    } else {
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push({ event, payload });
      } else {
        console.warn('WebSocket message queue full, dropping message:', event);
      }
    }
  }

  /**
   * Subscribe to incoming server messages. Returns an unsubscribe function.
   * Multiple listeners are supported.
   */
  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * Subscribe to connection status changes. Returns an unsubscribe function.
   */
  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyStatus(status: 'open' | 'close' | 'error', detail?: Event | CloseEvent): void {
    const listeners = Array.from(this.statusListeners);
    for (const listener of listeners) {
      try {
        listener(status, detail);
      } catch (err) {
        console.error('Status listener threw:', err);
      }
    }
  }

  // Specific methods for NullKey events
  createRoom(roomId: string, inviteToken: string, fingerprint: string, username: string): void {
    this.clearQueue();
    this.sendMessage('room:create', { room_id: roomId, invite_token: inviteToken, sender_fingerprint: fingerprint, sender_username: username });
  }

  joinRoom(roomId: string, inviteToken: string, fingerprint: string, username: string): void {
    this.clearQueue();
    this.sendMessage('room:join', { room_id: roomId, invite_token: inviteToken, sender_fingerprint: fingerprint, sender_username: username });
  }

  leaveRoom(): void {
    this.clearQueue();
    this.sendMessage('room:leave', {});
  }

  createInvite(roomId: string, inviteToken: string): void {
    this.sendMessage('invite:create', { room_id: roomId, invite_token: inviteToken });
  }

  sendKeyExchange(payload: KeyExchangePayload): void {
    this.sendMessage('key:exchange', payload);
  }

  sendMessageToRoom(payload: MessagePayload): void {
    this.sendMessage('message:send', payload);
  }

  sendTypingStart(roomId: string): void {
    this.sendMessage('typing:start', { room_id: roomId });
  }

  sendTypingStop(roomId: string): void {
    this.sendMessage('typing:stop', { room_id: roomId });
  }
}
