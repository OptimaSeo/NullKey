/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { RoomModel } from './room';
import { ClientConnection } from '../ws/handler';

export class RoomManager {
  private rooms: Map<string, RoomModel>;
  private inviteTokens: Map<string, Set<string>>; // roomId → Set<one-time token>

  constructor() {
    this.rooms = new Map();
    this.inviteTokens = new Map();
  }

  /**
   * Add a new room with an optional invite token
   * @param roomId The unique identifier for the room
   * @param inviteToken Optional one-time token for joining
   * @returns True if room was added successfully, false otherwise
   */
  addRoom(roomId: string, inviteToken?: string): boolean {
    if (this.rooms.has(roomId)) {
      return false;
    }

    const room = new RoomModel(roomId);
    this.rooms.set(roomId, room);
    if (inviteToken) {
      this.inviteTokens.set(roomId, new Set([inviteToken]));
    }
    return true;
  }

  /**
   * Add a client to a room
   * @param roomId The room to add the client to
   * @param client The client connection to add
   * @returns True if client was added successfully, false otherwise
   */
  addClientToRoom(roomId: string, client: ClientConnection): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    return room.addClient(client);
  }

  /**
   * Remove a client from a room
   * @param roomId The room to remove the client from
   * @param client The client connection to remove
   * @returns True if client was removed successfully, false otherwise
   */
  removeClientFromRoom(roomId: string, client: ClientConnection): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    const removed = room.removeClient(client);
    return removed;
  }

  /**
   * Get the number of clients in a room
   * @param roomId The room to check
   * @returns Number of clients in the room
   */
  getClientCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.getClientCount() : 0;
  }

  /**
   * Broadcast a message to all clients in a room except the sender
   * @param roomId The room to broadcast to
   * @param message The message to broadcast
   * @param senderWs The WebSocket of the sender to exclude
   */
  broadcastToRoom(roomId: string, message: any, senderWs?: any): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const messageStr = JSON.stringify(message);
    room.clients.forEach(client => {
      if (!senderWs || client.ws !== senderWs) {
        if (client.ws.readyState === client.ws.OPEN) {
          client.ws.send(messageStr);
        }
      }
    });
  }

  /**
   * Get a room by ID
   * @param roomId The ID of the room to retrieve
   * @returns The room if found, undefined otherwise
   */
  getRoom(roomId: string): RoomModel | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Check if a room exists
   * @param roomId The ID of the room to check
   * @returns True if the room exists, false otherwise
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Verify an invite token for a room
   * @param roomId The room to verify against
   * @param token The invite token to check
   * @returns True if the token is valid for this room
   */
  verifyInviteToken(roomId: string, token: string): boolean {
    const tokens = this.inviteTokens.get(roomId);
    return tokens?.has(token) ?? false;
  }

  /**
   * Invalidate (consume) a one-time invite token
   * @param roomId The room the token belongs to
   * @param token The token to invalidate
   */
  invalidateToken(roomId: string, token: string): void {
    const tokens = this.inviteTokens.get(roomId);
    if (tokens) {
      tokens.delete(token);
      if (tokens.size === 0) {
        this.inviteTokens.delete(roomId);
      }
    }
  }

  /**
   * Add an invite token to an existing room (for reconnect or additional invites)
   * @param roomId The room to add the token to
   * @param token The invite token to add
   */
  addInviteToken(roomId: string, token: string): void {
    if (!this.inviteTokens.has(roomId)) {
      this.inviteTokens.set(roomId, new Set());
    }
    this.inviteTokens.get(roomId)!.add(token);
  }

  /**
   * Clean up expired rooms
   */
  cleanupExpiredRooms(): void {
    const expiredRooms: string[] = [];

    this.rooms.forEach((room, roomId) => {
      if (room.isExpired()) {
        expiredRooms.push(roomId);
      }
    });

    expiredRooms.forEach(roomId => {
      this.rooms.delete(roomId);
      this.inviteTokens.delete(roomId);
    });
  }

  /**
   * Get all room IDs
   * @returns Array of all room IDs
   */
  getAllRoomIds(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Get total number of active rooms
   * @returns Number of active rooms
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}