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
- **Message Storage**: In-memory with TTL (time-to-live)
- **No Persistent Storage**: No user accounts or message history stored

## Data Flow

1. Client generates X25519 key pair locally (stored in IndexedDB)
2. Room created with `room_secret` (HKDF salt) + `invite_token` (for the server)
3. Only `invite_token` is sent to the server; `room_secret` stays on the client
4. Invite link contains `room_secret` + `invite_token` + sender fingerprint
5. Messages are end-to-end encrypted (server never sees plaintext)
6. All data is ephemeral with automatic cleanup

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
