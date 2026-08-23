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
import { config, wsMaxPayloadBytes } from './config';
import { logger } from './logger';

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

/**
 * IPs are never written to logs in plaintext — only a short hash is kept so
 * operators can still correlate connection events for abuse handling.
 */
function maskIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash * 31 + ip.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36).padStart(7, '0');
}

// ── WebSocket server ─────────────────────────────────────────────

const wss = new WebSocket.Server({
  server,
  // Sized to carry an encrypted, base64-encoded file up to
  // MAX_FILE_SIZE_BYTES in a single frame (see config.wsMaxPayloadBytes).
  maxPayload: wsMaxPayloadBytes,
  verifyClient: (info: { origin?: string; req: IncomingMessage }, callback: (res: boolean) => void): void => {
    const ip = info.req.socket.remoteAddress || 'unknown';
    const masked = maskIp(ip);

    logger.info('WS verifyClient', {
      origin: info.origin,
      ipHash: masked,
      path: info.req.url,
      allowedOrigins,
    });

    // Origin check
    if (!isOriginAllowed(info.origin)) {
      logger.warn('WS rejected: origin not allowed', { origin: info.origin, ipHash: masked });
      callback(false);
      return;
    }

    // Rate limit check
    if (!checkRateLimit(ip)) {
      logger.warn('WS rejected: rate limit exceeded', { ipHash: masked });
      callback(false);
      return;
    }

    // Connection limit per IP (tracked via connectionCounts)
    const current = connectionCounts.get(ip) || 0;
    if (current >= config.rateLimitMaxConnectionsPerIp) {
      logger.warn('WS rejected: too many connections', { ipHash: masked, current });
      callback(false);
      return;
    }

    callback(true);
  },
});

// Ping all connected clients every 25s to prevent proxy/CDN idle timeouts
const keepAliveInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, 25000);

wss.on('close', () => {
  clearInterval(keepAliveInterval);
});

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  const ip = req.socket.remoteAddress || 'unknown';
  connectionCounts.set(ip, (connectionCounts.get(ip) || 0) + 1);

  logger.info('WS client connected', { ipHash: maskIp(ip) });
  webSocketHandler.handleConnection(ws, ip);

  ws.on('close', () => {
    const count = connectionCounts.get(ip) || 0;
    if (count <= 1) {
      connectionCounts.delete(ip);
    } else {
      connectionCounts.set(ip, count - 1);
    }
    logger.info('WS client disconnected', { ipHash: maskIp(ip) });
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
  logger.info('Server started', { port: config.port, env: config.nodeEnv });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down (SIGTERM)');
  scheduler.stop();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { server, wss };
