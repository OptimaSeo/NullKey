/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import WebSocket from 'ws';
import { RoomManager } from '../rooms/manager';
import { BaseMessage } from './message';

export class MessageForwarder {
  private roomManager: RoomManager;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Forward a message to all clients in a room except the sender
   * @param roomId The room to forward the message to
   * @param message The message to forward
   * @param senderWs The WebSocket of the sender to exclude
   */
  forwardMessage(roomId: string, message: BaseMessage, senderWs?: WebSocket): void {
    this.roomManager.broadcastToRoom(roomId, message, senderWs);
  }

  /**
   * Forward a message to a specific client in a room
   * @param roomId The room containing the target client
   * @param message The message to forward
   * @param targetFingerprint The fingerprint of the target client
   */
  forwardMessageToClient(roomId: string, message: BaseMessage, targetFingerprint: string): boolean {
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      return false;
    }

    const targetClient = room.clients.find(client => client.fingerprint === targetFingerprint);
    if (!targetClient) {
      return false;
    }

    if (targetClient.ws.readyState === targetClient.ws.OPEN) {
      targetClient.ws.send(JSON.stringify(message));
      return true;
    }

    return false;
  }

  /**
   * Check if a room has enough clients to send a message
   * @param roomId The room to check
   * @returns True if there are other clients in the room, false otherwise
   */
  canSendMessage(roomId: string): boolean {
    const clientCount = this.roomManager.getClientCount(roomId);
    // Need at least one other client to send a message to
    return clientCount > 1;
  }
}