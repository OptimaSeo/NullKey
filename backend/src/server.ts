#!/usr/bin/env node
/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 */

// NullKey Backend Server
// WebSocket relay server for anonymous messaging

import WebSocket from 'ws';
import express from 'express';
import { createServer } from 'http';
import { IncomingMessage } from 'http';
import { RoomManager } from './rooms/manager';
import { MessageForwarder } from './relay/forwarder';
import { WebSocketHandler } from './ws/handler';
import { CleanupService } from './ttl/cleanup';
import { Scheduler } from './ttl/scheduler';
import { setupRoutes } from './relay/routes';
import { config } from './config';

const app = express();
const server = createServer(app);

// ── Security headers ──────────────────────────────────────────────

app.use((_req, res, next) => {
  if (config.securityHeadersEnabled) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:; frame-ancestors 'none'; form-action 'none'"
    );
  }
  next();
});

// Setup managers
const roomManager = new RoomManager();
const messageForwarder = new MessageForwarder(roomManager);
const webSocketHandler = new WebSocketHandler(roomManager, messageForwarder);

// Setup cleanup services
const cleanupService = new CleanupService(roomManager);
const scheduler = new Scheduler(cleanupService);

// ── Rate limiting ────────────────────────────────────────────────

interface RateBucket {
  count: number;
  windowStart: number;
}

const rateBuckets = new Map<string, RateBucket>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || now - bucket.windowStart > config.rateLimitWindowMs) {
    bucket = { count: 1, windowStart: now };
    rateBuckets.set(ip, bucket);
    return true;
  }

  bucket.count++;
  if (bucket.count > config.rateLimitMaxRequests) {
    return false;
  }
  return true;
}

const connectionCounts = new Map<string, number>();

// ── Origin check helper ──────────────────────────────────────────

const allowedOrigins: string[] = config.allowedOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return true; // no restriction
  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some((a) => {
      try {
        const allowedUrl = new URL(a);
        if (originUrl.hostname !== allowedUrl.hostname) return false;
        if (allowedUrl.port && originUrl.port !== allowedUrl.port) return false;
        if (allowedUrl.protocol !== originUrl.protocol) return false;
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// ── WebSocket server ─────────────────────────────────────────────

const wss = new WebSocket.Server({
  server,
  maxPayload: config.maxMessageSizeBytes,
  verifyClient: (info: { origin?: string; req: IncomingMessage }, callback: (res: boolean) => void): void => {
    // Origin check
    if (!isOriginAllowed(info.origin)) {
      console.warn(`Connection rejected: origin "${info.origin}" not allowed`);
      callback(false);
      return;
    }

    // Rate limit check
    const ip = info.req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      console.warn(`Connection rejected: rate limit exceeded for ${ip}`);
      callback(false);
      return;
    }

    // Connection limit per IP (tracked via connectionCounts)
    const current = connectionCounts.get(ip) || 0;
    if (current >= config.rateLimitMaxConnectionsPerIp) {
      console.warn(`Connection rejected: too many connections from ${ip}`);
      callback(false);
      return;
    }

    callback(true);
  },
});

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const ip = req.socket.remoteAddress || 'unknown';
  connectionCounts.set(ip, (connectionCounts.get(ip) || 0) + 1);

  console.log(`New client connected from ${ip}`);
  webSocketHandler.handleConnection(ws, ip);

  ws.on('close', () => {
    const count = connectionCounts.get(ip) || 0;
    if (count <= 1) {
      connectionCounts.delete(ip);
    } else {
      connectionCounts.set(ip, count - 1);
    }
    console.log(`Client from ${ip} disconnected`);
  });
});

// Cleanup stale rate buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now - bucket.windowStart > config.rateLimitWindowMs * 2) {
      rateBuckets.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Setup HTTP routes
setupRoutes(app, roomManager);

// Start cleanup scheduler
scheduler.start();

server.listen(config.port, () => {
  console.log(`NullKey server listening on port ${config.port}`);
  console.log(`WebSocket relay active (env: ${config.nodeEnv})`);
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
