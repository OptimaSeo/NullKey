/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

// Message interface for NullKey
// Defines the structure of messages sent between clients

export interface MessagePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_username: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
  message_type?: 'text' | 'file';
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_hash?: string;
}

export interface KeyExchangePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_public_key: string;
  sender_username: string;
}

export interface BaseMessage {
  event: string;
  payload: any;
}

export interface RoomActionPayload {
  room_id: string;
  invite_token: string;
}

// Message validation functions
export function isValidMessagePayload(payload: any): payload is MessagePayload {
  return (
    typeof payload === 'object' &&
    typeof payload.room_id === 'string' &&
    typeof payload.sender_fingerprint === 'string' &&
    typeof payload.sender_username === 'string' &&
    typeof payload.ciphertext === 'string' &&
    typeof payload.nonce === 'string' &&
    typeof payload.timestamp === 'number'
  );
}

export function isValidKeyExchangePayload(payload: any): payload is KeyExchangePayload {
  return (
    typeof payload === 'object' &&
    typeof payload.room_id === 'string' &&
    typeof payload.sender_fingerprint === 'string' &&
    typeof payload.sender_public_key === 'string' &&
    typeof payload.sender_username === 'string'
  );
}