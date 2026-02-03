/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import crypto from 'crypto';
import { RoomModel } from './room';
import { ClientConnection } from '../ws/handler';

export class RoomManager {
  private rooms: Map<string, RoomModel>;
  private secrets: Map<string, string>; // Maps secret to room ID

  constructor() {
    this.rooms = new Map();
    this.secrets = new Map();
  }

  /**
   * Add a new room
   * @param roomId The unique identifier for the room
   * @param roomSecret The secret used to join the room
   * @returns True if room was added successfully, false otherwise
   */
  addRoom(roomId: string): boolean {
    if (this.rooms.has(roomId)) {
      return false;
    }

    const room = new RoomModel(roomId);
    this.rooms.set(roomId, room);
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
    
    // If room is empty after removal, clean it up
    if (room.isEmpty()) {
      this.rooms.delete(roomId);
      // Also remove the corresponding secret mapping
      for (const [secret, id] of this.secrets.entries()) {
        if (id === roomId) {
          this.secrets.delete(secret);
          break;
        }
      }
    }
    
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
   * Get room ID from secret
   * @param roomSecret The secret used to create/join the room
   * @returns Room ID if found, undefined otherwise
   */
  getRoomIdFromSecret(roomSecret: string): string | undefined {
    return this.secrets.get(roomSecret);
  }

  /**
   * Register a secret for a room
   * @param roomSecret The secret for the room
   * @param roomId The ID of the room
   */
  registerRoomSecret(roomSecret: string, roomId: string): void {
    this.secrets.set(roomSecret, roomId);
  }

  /**
   * Clean up expired rooms
   */
  cleanupExpiredRooms(): void {
    const now = Date.now();
    const expiredRooms: string[] = [];

    this.rooms.forEach((room, roomId) => {
      if (room.isExpired()) {
        expiredRooms.push(roomId);
      }
    });

    expiredRooms.forEach(roomId => {
      this.rooms.delete(roomId);
      // Also remove the corresponding secret mapping
      for (const [secret, id] of this.secrets.entries()) {
        if (id === roomId) {
          this.secrets.delete(secret);
          break;
        }
      }
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