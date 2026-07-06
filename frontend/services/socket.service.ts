/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { WebSocketClient } from '../src/socket/client';
import type { ServerEvent, ConnectionStatus, MessagePayload, KeyExchangePayload } from '../types/protocol';

export type { ServerEvent, ConnectionStatus };
export type EventHandler = (event: ServerEvent, payload: any) => void;
export type StatusHandler = (status: ConnectionStatus) => void;

export class SocketService {
  private client: WebSocketClient;

  constructor(serverUrl: string) {
    this.client = new WebSocketClient(serverUrl);

    // Listen for page resume from background
    if (typeof window !== 'undefined') {
      const onResume = () => this.client.resume();
      window.addEventListener('nullkey:resume', onResume);
      // Store cleanup reference
      (this as any)._resumeCleanup = () => window.removeEventListener('nullkey:resume', onResume);
    }
  }

  async connect(): Promise<void> {
    return this.client.connect();
  }

  disconnect(): void {
    (this as any)._resumeCleanup?.();
    this.client.disconnect();
  }

  subscribe(handler: EventHandler): () => void {
    return this.client.onMessage(handler);
  }

  onStatus(handler: StatusHandler): () => void {
    return this.client.onStatus(handler);
  }

  createRoom(roomId: string, inviteToken: string, fingerprint: string, username: string): void {
    this.client.createRoom(roomId, inviteToken, fingerprint, username);
  }

  joinRoom(roomId: string, inviteToken: string, fingerprint: string, username: string): void {
    this.client.joinRoom(roomId, inviteToken, fingerprint, username);
  }

  leaveRoom(): void {
    this.client.leaveRoom();
  }

  sendKeyExchange(payload: KeyExchangePayload): void {
    this.client.sendKeyExchange(payload);
  }

  sendMessage(payload: MessagePayload): void {
    this.client.sendMessageToRoom(payload);
  }

  sendTypingStart(roomId: string): void {
    this.client.sendTypingStart(roomId);
  }

  sendTypingStop(roomId: string): void {
    this.client.sendTypingStop(roomId);
  }
}

export function getDefaultWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:8080';
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
}
