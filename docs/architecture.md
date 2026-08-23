# NullKey Architecture

## Overview
NullKey is an anonymous end-to-end encrypted chat application designed with a privacy-first approach. The architecture follows a minimal-metadata principle with no persistent user accounts.

## Components

### Client (Frontend)
- **Framework**: Next.js (App Router with Client-Side Rendering for MVP)
- **Crypto Library**: WebCrypto API, @stablelib implementation
- **Storage**: IndexedDB for local key storage
- **Communication**: WebSocket connection to the backend

### Server (Backend)
- **Runtime**: Node.js
- **Protocol**: WebSocket relay
- **Message Storage**: None — messages are relayed in real time and never stored, not even in memory
- **No Persistent Storage**: No user accounts or message history stored

## Data Flow

1. Client generates X25519 key pair locally (stored in IndexedDB)
2. Room created with a random 256-bit `room_secret`; the HKDF salt is derived from the room ID (SHA-256 of the secret), plus `invite_token` for the server
3. Only the room ID and `invite_token` are sent to the server; `room_secret` stays on the client
4. Invite link contains `room_secret` + `invite_token` + sender fingerprint
5. Messages are end-to-end encrypted (server never sees plaintext)
6. File metadata (name, type, checksum) is encrypted inside the message envelope — only ciphertext size is visible to the server
7. All data is ephemeral: rooms expire on idle timeout or absolute lifetime; nothing is written to disk

## Security Model

- Zero-knowledge server (cannot read messages, never sees `room_secret`)
- No account system reduces attack surface
- Cryptographic identities generated and stored client-side
- Public key authentication via fingerprint in invite link (MITM prevention)
- Rate limiting per IP and per fingerprint
- WebSocket origin validation (hostname comparison)
- Replay protection (nonce tracking)
- HTTP security headers (CSP, X-Frame-Options, etc.)
- Abusive clients disconnected after repeated violations
- Automatic room and message expiration
