import WebSocket from 'ws';
import { config } from '../config';

// Validation functions for incoming WebSocket messages
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
  return size <= config.maxMessageSizeBytes;
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
  
  return true;
}