/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import * as x25519 from '@stablelib/x25519';

const AES_KEY_LENGTH_BYTES = 32;
const AES_NONCE_LENGTH_BYTES = 12;

export function deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.sharedKey(privateKey, publicKey);
}

export async function deriveAesKey(rawSharedSecret: Uint8Array, saltBytes: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', rawSharedSecret as BufferSource, 'HKDF', false, ['deriveKey']);
  const info = new TextEncoder().encode('NullKey/message/v1');
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: saltBytes as BufferSource, info: info as BufferSource },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH_BYTES * 8 },
    false,
    ['encrypt', 'decrypt'],
  );
  return key;
}

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
}

/**
 * Encrypt a text message or binary file using AES-256-GCM (WebCrypto).
 */
export async function encryptMessage(
  message: string | Uint8Array,
  rawSharedSecret: Uint8Array,
  saltBytes: Uint8Array = new Uint8Array(0),
): Promise<EncryptedPayload> {
  const aesKey = await deriveAesKey(rawSharedSecret, saltBytes);
  const plaintext = typeof message === 'string' ? new TextEncoder().encode(message) : message;
  const nonce = crypto.getRandomValues(new Uint8Array(AES_NONCE_LENGTH_BYTES));

  const ciphertextBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aesKey, plaintext as BufferSource);
  const ciphertext = new Uint8Array(ciphertextBuffer);

  return { ciphertext, nonce };
}

/**
 * Decrypt a text message using AES-256-GCM (WebCrypto).
 */
export async function decryptMessage(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  rawSharedSecret: Uint8Array,
  saltBytes: Uint8Array = new Uint8Array(0),
): Promise<string> {
  const aesKey = await deriveAesKey(rawSharedSecret, saltBytes);
  const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aesKey, ciphertext as BufferSource);
  const plaintext = new Uint8Array(plaintextBuffer);
  return new TextDecoder().decode(plaintext);
}

/**
 * Decrypt a file payload and return raw bytes (suitable for Blob).
 */
export async function decryptFile(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  rawSharedSecret: Uint8Array,
  saltBytes: Uint8Array = new Uint8Array(0),
): Promise<Uint8Array> {
  const aesKey = await deriveAesKey(rawSharedSecret, saltBytes);
  const plaintextBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce as BufferSource }, aesKey, ciphertext as BufferSource);
  return new Uint8Array(plaintextBuffer);
}

export async function computeFileHash(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
