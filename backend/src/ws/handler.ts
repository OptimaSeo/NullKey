/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 */

import WebSocket from 'ws';
import { RoomManager } from '../rooms/manager';
import { MessageForwarder } from '../relay/forwarder';
import { config } from '../config';
import { logger } from '../logger';
import {
  validateMessageFormat,
  validatePayloadSize,
  validateRoomCreation,
  validateRoomJoin,
  validateKeyExchange,
  validateMessage,
} from './validation';

export interface ClientConnection {
  ws: WebSocket;
  roomId?: string;
  fingerprint?: string;
  username?: string;
  ip?: string;
  violations?: number;
}

/**
 * Replay protection: track nonces seen per sender fingerprint within the TTL window.
 * Entries older than message TTL are pruned lazily on each check.
 */
export class ReplayGuard {
  private seen: Map<string, Map<string, number>> = new Map(); // fingerprint → (nonce → timestamp)

  /** Returns true if this (fingerprint, nonce) pair has NOT been seen before (i.e. is fresh). */
  checkAndMark(fingerprint: string, nonce: string, now: number, ttlMs: number): boolean {
    if (!config.replayProtectionEnabled) return true;

    let perFinger = this.seen.get(fingerprint);
    if (!perFinger) {
      perFinger = new Map();
      this.seen.set(fingerprint, perFinger);
    }

    // Prune expired entries for this fingerprint
    const cutoff = now - ttlMs;
    for (const [n, ts] of perFinger) {
      if (ts < cutoff) perFinger.delete(n);
    }

    if (perFinger.has(nonce)) return false; // replayed!

    perFinger.set(nonce, now);
    return true;
  }

  /** Remove all replay data for a given fingerprint (called on disconnect). */
  purge(fingerprint: string): void {
    this.seen.delete(fingerprint);
  }
}

export class WebSocketHandler {
  private roomManager: RoomManager;
  private messageForwarder: MessageForwarder;
  private replayGuard: ReplayGuard = new ReplayGuard();
  private messageRateBuckets: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(roomManager: RoomManager, messageForwarder: MessageForwarder) {
    this.roomManager = roomManager;
    this.messageForwarder = messageForwarder;
  }

  private checkMessageRateLimit(fingerprint: string | undefined): boolean {
    if (!fingerprint) return true;
    const now = Date.now();
    let bucket = this.messageRateBuckets.get(fingerprint);
    if (!bucket || now - bucket.windowStart > config.rateLimitMessagesWindowMs) {
      bucket = { count: 1, windowStart: now };
      this.messageRateBuckets.set(fingerprint, bucket);
      return true;
    }
    bucket.count++;
    if (bucket.count > config.rateLimitMessagesPerWindow) {
      return false;
    }
    return true;
  }

  handleConnection(ws: WebSocket, ip?: string): void {
    const client: ClientConnection = { ws, ip };
    
    ws.on('message', (data: WebSocket.Data) => {
      if (!validateMessageFormat(data)) {
        this.sendError(ws, 'Invalid message format');
        return;
      }

      let message: any;
      try {
        message = JSON.parse(data.toString());
      } catch {
        this.sendError(ws, 'Invalid message format');
        return;
      }

      if (message.payload && !validatePayloadSize(message.payload)) {
        this.sendError(ws, 'Payload exceeds maximum allowed size');
        return;
      }

      this.handleClientMessage(client, message);
    });

    ws.on('close', () => {
      this.handleClientDisconnect(client);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', { error: (error as Error).message || String(error), ip });
    });
  }

  private handleClientMessage(client: ClientConnection, message: any): void {
    switch (message.event) {
      case 'room:create':
        this.handleRoomCreate(client, message.payload);
        break;
      case 'room:join':
        this.handleRoomJoin(client, message.payload);
        break;
      case 'key:exchange':
        this.handleKeyExchange(client, message.payload);
        break;
      case 'message:send':
        this.handleSendMessage(client, message.payload);
        break;
      case 'typing:start':
        this.handleTypingEvent(client, 'typing:start');
        break;
      case 'typing:stop':
        this.handleTypingEvent(client, 'typing:stop');
        break;
      case 'room:leave':
        this.handleRoomLeave(client);
        break;
      default:
        this.sendError(client.ws, 'Unknown event type', client);
    }
  }

  private handleRoomCreate(client: ClientConnection, payload: any): void {
    if (!validateRoomCreation(payload)) {
      this.sendError(client.ws, 'Missing or invalid room_id or invite_token', client);
      return;
    }

    const { room_id, invite_token, sender_fingerprint, sender_username } = payload;
    if (sender_fingerprint) client.fingerprint = sender_fingerprint;
    if (sender_username) client.username = sender_username;

    // Create room if it doesn't exist, storing the invite token
    if (this.roomManager.addRoom(room_id, invite_token)) {
      client.roomId = room_id;
      this.roomManager.addClientToRoom(room_id, client);
      this.sendSuccess(client.ws, 'Room created successfully');
    } else {
      // Room already exists — creator is reconnecting, add them back
      if (this.roomManager.addClientToRoom(room_id, client)) {
        client.roomId = room_id;
        this.sendSuccess(client.ws, 'Rejoined existing room');
        this.roomManager.broadcastToRoom(
          room_id,
          { event: 'client:joined', payload: { fingerprint: client.fingerprint, username: client.username } },
          client.ws,
        );
      } else {
        this.sendError(client.ws, 'Failed to rejoin room', client);
      }
    }
  }

  private handleRoomJoin(client: ClientConnection, payload: any): void {
    if (!validateRoomJoin(payload)) {
      this.sendError(client.ws, 'Missing or invalid room_id or invite_token', client);
      return;
    }

    const { room_id, invite_token, sender_fingerprint, sender_username } = payload;
    if (sender_fingerprint) client.fingerprint = sender_fingerprint;
    if (sender_username) client.username = sender_username;

    if (!this.roomManager.hasRoom(room_id)) {
      this.sendError(client.ws, 'Room not found', client);
      return;
    }

    if (!this.roomManager.verifyInviteToken(room_id, invite_token)) {
      this.sendError(client.ws, 'Invalid or expired invite token', client);
      return;
    }

    if (this.roomManager.getClientCount(room_id) >= config.maxParticipantsPerRoom) {
      this.sendError(client.ws, `Room is full (max ${config.maxParticipantsPerRoom} participants)`, client);
      return;
    }

    if (this.roomManager.addClientToRoom(room_id, client)) {
      client.roomId = room_id;
      this.roomManager.invalidateToken(room_id, invite_token);
      this.sendSuccess(client.ws, 'Joined room successfully');

      this.roomManager.broadcastToRoom(
        room_id,
        { event: 'client:joined', payload: { fingerprint: client.fingerprint, username: client.username } },
        client.ws,
      );
    } else {
      this.sendError(client.ws, 'Failed to join room', client);
    }
  }

  private handleKeyExchange(client: ClientConnection, payload: any): void {
    if (!validateKeyExchange(payload)) {
      this.sendError(client.ws, 'Missing or invalid fields for key exchange', client);
      return;
    }

    const { room_id, sender_fingerprint, sender_public_key, sender_username } = payload;

    if (client.roomId && client.roomId !== room_id) {
      this.sendError(client.ws, 'Room ID mismatch', client);
      return;
    }

    client.fingerprint = sender_fingerprint;
    client.username = sender_username;

    if (client.roomId) {
      this.roomManager.broadcastToRoom(
        client.roomId,
        {
          event: 'key:exchange',
          payload: { sender_fingerprint, sender_public_key, sender_username },
        },
        client.ws,
      );
    }
  }

  private handleSendMessage(client: ClientConnection, payload: any): void {
    if (!client.roomId) {
      this.sendError(client.ws, 'Not in a room', client);
      return;
    }

    if (!validateMessage(payload)) {
      this.sendError(client.ws, 'Missing or invalid fields for message', client);
      return;
    }

    const { room_id, sender_fingerprint, sender_username, ciphertext, nonce, timestamp, message_type, file_size } = payload;

    if (room_id !== client.roomId) {
      this.sendError(client.ws, 'Room ID mismatch', client);
      return;
    }

    // Per-fingerprint message rate limiting
    if (!this.checkMessageRateLimit(client.fingerprint)) {
      this.sendError(client.ws, 'Rate limit exceeded. Please slow down.', client);
      return;
    }

    // File-specific server-side validation
    if (message_type === 'file') {
      if (!file_size || typeof file_size !== 'number') {
        this.sendError(client.ws, 'Missing or invalid file_size for file message', client);
        return;
      }
      if (file_size > config.maxFileSizeBytes) {
        this.sendError(client.ws, 'File size exceeds maximum allowed (100MB)', client);
        return;
      }
    }

    // Replay protection
    if (config.replayProtectionEnabled) {
      const ttlMs = config.messageTtlMinutes * 60 * 1000;
      const now = Date.now();
      if (!this.replayGuard.checkAndMark(sender_fingerprint, nonce, now, ttlMs)) {
        this.sendError(client.ws, 'Duplicate message (replay detected)', client);
        return;
      }
    }

    this.messageForwarder.forwardMessage(
      client.roomId,
      {
        event: 'message:receive',
        payload: {
          room_id,
          sender_fingerprint,
          sender_username,
          ciphertext,
          nonce,
          timestamp,
          message_type,
          file_name: payload.file_name,
          file_size: payload.file_size,
          file_type: payload.file_type,
          file_hash: payload.file_hash,
        },
      },
      client.ws,
    );
  }

  private handleTypingEvent(client: ClientConnection, event: 'typing:start' | 'typing:stop'): void {
    if (!client.roomId) return;
    this.roomManager.broadcastToRoom(
      client.roomId,
      { event, payload: { fingerprint: client.fingerprint, username: client.username } },
      client.ws,
    );
  }

  private handleRoomLeave(client: ClientConnection): void {
    if (client.roomId) {
      this.roomManager.broadcastToRoom(
        client.roomId,
        { event: 'client:left', payload: { fingerprint: client.fingerprint, username: client.username } },
        client.ws,
      );
      this.roomManager.removeClientFromRoom(client.roomId, client);
      const fp = client.fingerprint;
      client.roomId = undefined;
      if (fp) this.replayGuard.purge(fp);
      this.sendSuccess(client.ws, 'Left room successfully');
    }
  }

  private handleClientDisconnect(client: ClientConnection): void {
    if (client.roomId) {
      this.roomManager.removeClientFromRoom(client.roomId, client);

      this.roomManager.broadcastToRoom(
        client.roomId,
        { event: 'client:left', payload: { fingerprint: client.fingerprint, username: client.username } },
        client.ws,
      );
      if (client.fingerprint) {
        this.replayGuard.purge(client.fingerprint);
        this.messageRateBuckets.delete(client.fingerprint);
      }
    }
  }

  private sendSuccess(ws: WebSocket, message: string): void {
    ws.send(JSON.stringify({ event: 'success', payload: { message } }));
  }

  private sendError(ws: WebSocket, message: string, client?: ClientConnection): void {
    if (client && config.disconnectOnRepeatedViolations) {
      client.violations = (client.violations || 0) + 1;
      if (client.violations >= config.maxViolationsBeforeDisconnect) {
        ws.close(4000, 'Repeated protocol violations');
        return;
      }
    }
    ws.send(JSON.stringify({ event: 'error', payload: { message } }));
  }
}
