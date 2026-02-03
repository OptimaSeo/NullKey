#!/usr/bin/env node
// NullKey Backend Server
// WebSocket relay server for anonymous messaging

import WebSocket from 'ws';
import express from 'express';
import { createServer } from 'http';
import { RoomManager } from './rooms/manager';
import { MessageForwarder } from './relay/forwarder';
import { WebSocketHandler } from './ws/handler';
import { CleanupService } from './ttl/cleanup';
import { Scheduler } from './ttl/scheduler';
import { setupRoutes } from './relay/routes';

const PORT = process.env.PORT || 8080;
const app = express();
const server = createServer(app);

// Setup managers
const roomManager = new RoomManager();
const messageForwarder = new MessageForwarder(roomManager);
const webSocketHandler = new WebSocketHandler(roomManager, messageForwarder);

// Setup cleanup services
const cleanupService = new CleanupService(roomManager);
const scheduler = new Scheduler(cleanupService);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');
  webSocketHandler.handleConnection(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Setup HTTP routes
setupRoutes(app);

// Start cleanup scheduler
scheduler.start();

server.listen(PORT, () => {
  console.log(`NullKey server listening on port ${PORT}`);
  console.log('WebSocket relay active');
  console.log('Ready for anonymous connections');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  scheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { server, wss };