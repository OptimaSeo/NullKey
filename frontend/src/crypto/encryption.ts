import * as x25519 from '@stablelib/x25519';
import * as random from '@stablelib/random';
import { create, encrypt, decrypt } from '@stablelib/aes-gcm';

/**
 * Derive a shared secret using X25519 key exchange
 * @param privateKey Your private key
 * @param publicKey Peer's public key
 * @returns Shared secret for encryption/decryption
 */
export function deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.sharedSecret(privateKey, publicKey);
}

/**
 * Encrypt a message using AES-256-GCM
 * @param message Plain text message to encrypt
 * @param sharedSecret Shared secret derived from key exchange
 * @returns Object containing ciphertext and nonce
 */
export async function encryptMessage(message: string, sharedSecret: Uint8Array): Promise<{ ciphertext: Uint8Array, nonce: Uint8Array }> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(message);
  
  // Generate a random 96-bit (12-byte) nonce for AES-GCM
  const nonce = random.randomBytes(12);
  
  // Create AES-GCM cipher with the shared secret
  const cipher = create(sharedSecret);
  
  // Encrypt the message
  const ciphertext = encrypt(cipher, nonce, plaintext);
  
  return { ciphertext, nonce };
}

/**
 * Decrypt a message using AES-256-GCM
 * @param ciphertext Encrypted message
 * @param nonce Nonce used during encryption
 * @param sharedSecret Shared secret derived from key exchange
 * @returns Decrypted plain text message
 */
export async function decryptMessage(ciphertext: Uint8Array, nonce: Uint8Array, sharedSecret: Uint8Array): Promise<string> {
  // Create AES-GCM cipher with the shared secret
  const cipher = create(sharedSecret);
  
  // Decrypt the message
  const plaintext = decrypt(cipher, nonce, ciphertext);
  
  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}