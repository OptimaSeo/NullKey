/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 */

/**
 * Central configuration for the NullKey backend.
 * All values can be overridden via environment variables.
 */

function readInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function readBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  return raw === '1' || raw.toLowerCase() === 'true';
}

export const config = {
  // Server
  port: readInt('PORT', 8080),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Allowed origins for WebSocket connections (comma-separated, empty = all)
  allowedOrigins: process.env.ALLOWED_ORIGINS || '',

  // Rate limiting
  rateLimitWindowMs: readInt('RATE_LIMIT_WINDOW_MS', 900000),
  rateLimitMaxRequests: readInt('RATE_LIMIT_MAX_REQUESTS', 100),
  rateLimitMaxConnectionsPerIp: readInt('RATE_LIMIT_MAX_CONNECTIONS_PER_IP', 20),

  // Room
  maxParticipantsPerRoom: readInt('MAX_PARTICIPANTS_PER_ROOM', 10),
  maxRoomLifetimeMinutes: readInt('MAX_ROOM_LIFETIME_MINUTES', 60),
  roomIdleTimeoutMinutes: readInt('ROOM_IDLE_TIMEOUT_MINUTES', 10),

  // Message
  messageTtlMinutes: readInt('MESSAGE_TTL_MINUTES', 5),
  maxMessageSizeBytes: readInt('MAX_MESSAGE_SIZE_BYTES', 1048576),

  // Cleanup
  cleanupIntervalMs: readInt('CLEANUP_INTERVAL_MS', 60000),

  // Message rate limiting (per fingerprint)
  rateLimitMessagesPerWindow: readInt('RATE_LIMIT_MESSAGES_PER_WINDOW', 60),
  rateLimitMessagesWindowMs: readInt('RATE_LIMIT_MESSAGES_WINDOW_MS', 60000),

  // File validation
  maxFileSizeBytes: readInt('MAX_FILE_SIZE_BYTES', 104857600),

  // Replay protection
  replayProtectionEnabled: readBool('REPLAY_PROTECTION_ENABLED', true),

  // Security headers
  securityHeadersEnabled: readBool('SECURITY_HEADERS_ENABLED', true),

  // Abusive client disconnect
  disconnectOnRepeatedViolations: readBool('DISCONNECT_ON_REPEATED_VIOLATIONS', true),
  maxViolationsBeforeDisconnect: readInt('MAX_VIOLATIONS_BEFORE_DISCONNECT', 10),
} as const;
