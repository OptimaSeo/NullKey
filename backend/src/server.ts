#!/usr/bin/env node
// NullKey Backend Server
// WebSocket relay server for anonymous messaging

import WebSocket from 'ws';
import express from 'express';
import { createServer } from 'http';
import { setupWebSocketServer } from './ws/websocket';
import { setupRoutes } from './relay/routes';

const PORT = process.env.PORT || 8080;
const app = express();
const server = createServer(app);

// Setup WebSocket server
const wss = new WebSocket.Server({ server });
setupWebSocketServer(wss);

// Setup HTTP routes
setupRoutes(app);

server.listen(PORT, () => {
    console.log(`NullKey server listening on port ${PORT}`);
    console.log('WebSocket relay active');
    console.log('Ready for anonymous connections');
});

export { server, wss };