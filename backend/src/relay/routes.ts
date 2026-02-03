import express from 'express';
import { RoomManager } from '../rooms/manager';

export function setupRoutes(app: express.Application): void {
  const roomManager = new RoomManager();

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