# NullKey Crypto Design

## Overview
NullKey implements end-to-end encryption (E2EE) using modern cryptographic primitives. All encryption/decryption happens client-side with the server acting only as a message relay.

## Cryptographic Primitives

### Key Exchange
- **Algorithm**: X25519 (Elliptic Curve Diffie-Hellman over Curve25519)
- **Purpose**: Establish a shared secret between peers
- **Implementation**: @stablelib/x25519

### Symmetric Encryption
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Purpose**: Encrypt message content
- **Properties**: Authenticated encryption with associated data (AEAD)
- **Implementation**: WebCrypto API (crypto.subtle.encrypt/decrypt)

### Key Derivation
- **Algorithm**: HKDF (HMAC-based Extract-and-Expand Key Derivation Function)
- **Purpose**: Derive session keys from the shared secret
- **Implementation**: WebCrypto API

### Hashing
- **Algorithm**: SHA-256
- **Purpose**: Generate fingerprints from public keys and room IDs from secrets
- **Implementation**: WebCrypto API

## Protocol Flow

### Identity Creation
1. Client generates an X25519 key pair locally
2. Public key is hashed with SHA-256 to create a fingerprint
3. Fingerprint serves as the cryptographic identity for the session

### Room Creation
1. Client generates a random 256-bit room secret
2. Room ID is computed as the SHA-256 hash of the room secret
3. Client also generates a random one-time invite token
4. Only room ID + invite token are sent to the server (room secret is never sent)
5. Server stores the invite token per room for join validation
6. Invite link contains room secret + invite token + sender fingerprint (shared out-of-band)

### Key Exchange Process
1. Peer receives an invite link containing room secret + token + expected fingerprint
2. Peer connects to the room using the invite token (not the room secret)
3. Each peer broadcasts their public key to the room through the server
4. Peer computes shared secret using X25519 with their private key and the peer's public key
5. Peer receives server notification: `key:exchange` containing the other peer's public key + fingerprint
6. Received fingerprint is matched against the fingerprint from the invite link
7. If fingerprints do not match, the connection is rejected — this is the sole MITM protection
8. Shared secret is used to derive a session key with HKDF

### Message Encryption
1. Each message gets a unique random nonce (96 bits for AES-GCM)
2. Text messages are encrypted directly; file messages are encrypted as an
   envelope: `[u32 big-endian header length][header JSON: file_name,
   file_type, file_hash][raw file bytes]` — so file metadata is never
   visible to the server
3. The HKDF salt is derived from the room ID (never secret, but binds keys to the room)
4. Server only forwards ciphertext, nonce, and routing metadata

### Message Decryption
1. Receiver identifies the sender via fingerprint in metadata
2. Retrieves the corresponding shared secret from the session
3. Decrypts the message using AES-256-GCM with the shared secret and received nonce

## Security Properties

### Limitation: No Forward Secrecy
- Session keys are derived directly from the X25519 shared secret using HKDF
- No key rotation or ratchet mechanism (unlike Signal Protocol)
- If either party's long-term private key is compromised, all past messages can be decrypted
- This is a conscious design trade-off — NullKey prioritizes simplicity over FS

### Metadata Minimization
- Server never sees plaintext messages or room secrets
- File names, types, and checksums are encrypted inside the message envelope
- Server only stores room IDs, one-time invite tokens, and ephemeral membership
- Still visible to the server: participant fingerprints, usernames (display
  names — not authenticated), connection timing, and ciphertext sizes
- Connection logs hash IP addresses; plaintext IPs are never logged

### Authentication and MITM Prevention
- Public key fingerprints are embedded in the invite link alongside the room secret
- The invitee verifies the inviter's fingerprint after key exchange; if it
  does not match, the key is rejected and a warning is displayed. Note this
  verification is one-directional — the inviter has no out-of-band channel
  to authenticate the invitee
- Additional peers in multi-party rooms are trusted on first key exchange
- Security depends on the confidentiality of the invite channel (shared out-of-band)
- Message integrity is verified through AES-GCM authentication tags
