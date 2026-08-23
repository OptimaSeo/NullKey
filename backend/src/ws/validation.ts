/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import WebSocket from 'ws';
import { wsMaxPayloadBytes } from '../config';

// Validation functions for incoming WebSocket messages

const HEX_64_RE = /^[0-9a-fA-F]{64}$/;
export function validateMessageFormat(data: WebSocket.Data): boolean {
  try {
    const message = JSON.parse(data.toString());
    
    // Check if message has required properties
    if (typeof message !== 'object' || message === null) {
      return false;
    }
    
    if (!message.event || typeof message.event !== 'string') {
      return false;
    }
    
    if (message.payload && typeof message.payload !== 'object') {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate total payload size.
 * Returns true if the payload is under the configured limit.
 */
export function validatePayloadSize(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return true;
  // Rough estimate via JSON stringify length
  const size = Buffer.byteLength(JSON.stringify(payload), 'utf-8');
  return size <= wsMaxPayloadBytes;
}

export function validateRoomCreation(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (!payload.room_id || typeof payload.room_id !== 'string') {
    return false;
  }

  if (!payload.invite_token || typeof payload.invite_token !== 'string') {
    return false;
  }

  return true;
}

export function validateRoomJoin(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (!payload.room_id || typeof payload.room_id !== 'string') {
    return false;
  }

  if (!payload.invite_token || typeof payload.invite_token !== 'string') {
    return false;
  }

  return true;
}

export function validateKeyExchange(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  if (!payload.room_id || typeof payload.room_id !== 'string') {
    return false;
  }
  
  if (!payload.sender_fingerprint || typeof payload.sender_fingerprint !== 'string') {
    return false;
  }
  
  if (!payload.sender_public_key || typeof payload.sender_public_key !== 'string') {
    return false;
  }
  
  return true;
}

export function validateMessage(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  if (!payload.room_id || typeof payload.room_id !== 'string') {
    return false;
  }
  
  if (!payload.sender_fingerprint || typeof payload.sender_fingerprint !== 'string') {
    return false;
  }
  
  if (!payload.ciphertext || typeof payload.ciphertext !== 'string') {
    return false;
  }
  
  if (!payload.nonce || typeof payload.nonce !== 'string') {
    return false;
  }
  
  if (!payload.timestamp || typeof payload.timestamp !== 'number') {
    return false;
  }

  // Optional targeted-delivery field: when present it must be a hex-64
  // fingerprint (sha256 of the recipient's public key).
  if (
    payload.recipient_fingerprint !== undefined &&
    !(typeof payload.recipient_fingerprint === 'string' && HEX_64_RE.test(payload.recipient_fingerprint))
  ) {
    return false;
  }
  
  return true;
}

export function validateInviteCreation(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (!payload.room_id || typeof payload.room_id !== 'string') {
    return false;
  }

  if (!payload.invite_token || !HEX_64_RE.test(payload.invite_token)) {
    return false;
  }

  return true;
}