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
import { MessageForwarder } from '../relay/forwarder';

export interface ClientConnection {
  ws: WebSocket;
  roomId?: string;
  fingerprint?: string;
  username?: string;
}

export class WebSocketHandler {
  private roomManager: RoomManager;
  private messageForwarder: MessageForwarder;

  constructor(roomManager: RoomManager, messageForwarder: MessageForwarder) {
    this.roomManager = roomManager;
    this.messageForwarder = messageForwarder;
  }

  handleConnection(ws: WebSocket): void {
    const client: ClientConnection = { ws };
    
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(client, message);
      } catch (error) {
        console.error('Error parsing message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleClientDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
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
      case 'room:leave':
        this.handleRoomLeave(client, message.payload);
        break;
      default:
        this.sendError(client.ws, 'Unknown event type');
    }
  }

  private handleRoomCreate(client: ClientConnection, payload: any): void {
    const { room_id, room_secret } = payload;
    
    if (!room_id || !room_secret) {
      this.sendError(client.ws, 'Missing room_id or room_secret');
      return;
    }

    // In MVP, we only store the room ID, not the secret
    if (this.roomManager.addRoom(room_id)) {
      client.roomId = room_id;
      this.sendSuccess(client.ws, 'Room created successfully');
    } else {
      this.sendError(client.ws, 'Room already exists');
    }
  }

  private handleRoomJoin(client: ClientConnection, payload: any): void {
    const { room_secret } = payload;
    
    if (!room_secret) {
      this.sendError(client.ws, 'Missing room_secret');
      return;
    }

    // In MVP, we use the room_secret as the room identifier
    const roomId = this.roomManager.getRoomIdFromSecret(room_secret);
    
    if (!roomId) {
      this.sendError(client.ws, 'Invalid room secret');
      return;
    }

    if (this.roomManager.getClientCount(roomId) >= 10) {
      this.sendError(client.ws, 'Room is full (max 10 participants)');
      return;
    }

    // Add client to room
    if (this.roomManager.addClientToRoom(roomId, client)) {
      client.roomId = roomId;
      this.sendSuccess(client.ws, 'Joined room successfully');
      
      // Notify other clients in the room
      this.roomManager.broadcastToRoom(
        roomId,
        { event: 'client:joined', payload: { fingerprint: client.fingerprint, username: client.username } },
        client.ws
      );
    } else {
      this.sendError(client.ws, 'Failed to join room');
    }
  }

  private handleKeyExchange(client: ClientConnection, payload: any): void {
    const { room_id, sender_fingerprint, sender_public_key, sender_username } = payload;
    
    if (!room_id || !sender_fingerprint || !sender_public_key) {
      this.sendError(client.ws, 'Missing required fields for key exchange');
      return;
    }

    // Store client's fingerprint and username
    client.fingerprint = sender_fingerprint;
    client.username = sender_username;

    // Broadcast the key exchange to other clients in the room
    if (client.roomId) {
      this.roomManager.broadcastToRoom(
        client.roomId,
        { 
          event: 'key:exchange', 
          payload: { 
            sender_fingerprint, 
            sender_public_key, 
            sender_username 
          } 
        },
        client.ws
      );
    }
  }

  private handleSendMessage(client: ClientConnection, payload: any): void {
    const { room_id, sender_fingerprint, sender_username, ciphertext, nonce, timestamp } = payload;
    
    if (!room_id || !sender_fingerprint || !ciphertext || !nonce) {
      this.sendError(client.ws, 'Missing required fields for message');
      return;
    }

    // Forward the encrypted message to other clients in the room
    if (client.roomId) {
      // Add the original sender's info to the forwarded message
      const messageToForward = {
        event: 'message:receive',
        payload: {
          room_id,
          sender_fingerprint,
          sender_username,
          ciphertext,
          nonce,
          timestamp
        }
      };

      this.messageForwarder.forwardMessage(client.roomId, messageToForward, client.ws);
    }
  }

  private handleRoomLeave(client: ClientConnection, payload: any): void {
    if (client.roomId) {
      this.roomManager.removeClientFromRoom(client.roomId, client);
      client.roomId = undefined;
      this.sendSuccess(client.ws, 'Left room successfully');
    }
  }

  private handleClientDisconnect(client: ClientConnection): void {
    if (client.roomId) {
      this.roomManager.removeClientFromRoom(client.roomId, client);
      
      // Notify other clients in the room
      if (client.roomId) {
        this.roomManager.broadcastToRoom(
          client.roomId,
          { 
            event: 'client:left', 
            payload: { fingerprint: client.fingerprint, username: client.username } 
          },
          client.ws
        );
      }
    }
  }

  private sendSuccess(ws: WebSocket, message: string): void {
    ws.send(JSON.stringify({ event: 'success', payload: { message } }));
  }

  private sendError(ws: WebSocket, message: string): void {
    ws.send(JSON.stringify({ event: 'error', payload: { message } }));
  }
}