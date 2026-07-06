/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

export type ServerEvent =
  | 'success'
  | 'error'
  | 'key:exchange'
  | 'message:receive'
  | 'client:joined'
  | 'client:left'
  | 'typing:start'
  | 'typing:stop';

export type ConnectionStatus = 'open' | 'close' | 'error';

export interface ChatMessage {
  id: string;
  fingerprint: string;
  username: string;
  plaintext: string;
  timestamp: number;
  mine?: boolean;
  system?: boolean;
}

export interface Peer {
  fingerprint: string;
  username: string;
}

export interface InviteData {
  secret: string;
  token: string;
  expectedFingerprint?: string;
}

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
