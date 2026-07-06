/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import express from 'express';
import { RoomManager } from '../rooms/manager';

export function setupRoutes(app: express.Application, roomManager: RoomManager): void {
  // WebSocket endpoint — return informative error for plain HTTP requests
  app.get('/ws', (req, res) => {
    res.status(400).json({
      error: 'WebSocket connection required',
      hint: 'This endpoint only accepts WebSocket connections (wss:///ws). Ensure your proxy/CDN forwards the Upgrade and Connection headers.',
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      roomsActive: roomManager.getRoomCount()
    });
  });

  // Get room info (for debugging purposes only in MVP)
  app.get('/rooms/:roomId', (req, res) => {
    const roomId = req.params.roomId;
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.status(200).json({
      id: room.id,
      clientCount: room.getClientCount(),
      createdAt: new Date(room.createdAt).toISOString(),
      lastActivity: new Date(room.lastActivity).toISOString(),
      isEmpty: room.isEmpty()
    });
  });

  // Get all active rooms (for debugging purposes only in MVP)
  app.get('/rooms', (req, res) => {
    const roomIds = roomManager.getAllRoomIds();
    res.status(200).json({
      rooms: roomIds,
      count: roomIds.length
    });
  });
}