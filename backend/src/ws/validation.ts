import WebSocket from 'ws';

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
  } catch (error) {
    return false;
  }
}

export function validateRoomCreation(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  if (!payload.room_id || typeof payload.room_id !== 'string') {
    return false;
  }
  
  if (!payload.room_secret || typeof payload.room_secret !== 'string') {
    return false;
  }
  
  return true;
}

export function validateRoomJoin(payload: any): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  if (!payload.room_secret || typeof payload.room_secret !== 'string') {
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