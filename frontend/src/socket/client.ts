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
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_hash?: string;
}

export interface KeyExchangePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_public_key: string;
  sender_username: string;
}

export type ServerEvent = 'success' | 'error' | 'key:exchange' | 'message:receive' | 'client:joined' | 'client:left' | 'typing:start' | 'typing:stop';
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

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageListeners: Set<MessageListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  constructor(serverUrl: string) {
    this.url = serverUrl;
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

      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.notifyStatus('open');
        resolve();
      };

      this.ws.onerror = (error) => {
        this.notifyStatus('error', error);
        // Only reject if we never opened; otherwise let onclose handle it.
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          reject(error);
        }
      };

      this.ws.onclose = (event) => {
        this.notifyStatus('close', event);
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
    this.teardown();
  }

  private teardown(): void {
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

  sendMessage(event: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    } else {
      console.error('WebSocket is not connected');
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
  createRoom(roomId: string, inviteToken: string): void {
    this.sendMessage('room:create', { room_id: roomId, invite_token: inviteToken });
  }

  joinRoom(roomId: string, inviteToken: string): void {
    this.sendMessage('room:join', { room_id: roomId, invite_token: inviteToken });
  }

  leaveRoom(): void {
    this.sendMessage('room:leave', {});
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
