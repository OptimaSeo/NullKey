# NullKey Protocol Specification

## Overview
This document specifies the communication protocol between NullKey clients and the server. The protocol is designed for anonymous end-to-end encrypted messaging with minimal metadata exposure.

## Transport Layer
- **Protocol**: WebSocket (ws:// or wss://)
- **Message Format**: JSON over WebSocket frames

## Message Structure
All messages follow this structure:
```json
{
  "event": "event_name",
  "payload": { /* event-specific data */ }
}
```

## Events

### Client-to-Server Events

#### `room:create`
Request to create a new chat room.

**Payload:**
```json
{
  "room_id": "sha256 hash of room secret",
  "invite_token": "one-time invite token (256-bit hex)"
}
```

Note: `room_secret` is never sent to the server. Only `invite_token` is sent; `room_secret` remains on the client and is used as an HKDF salt.

#### `room:join`
Request to join an existing chat room.

**Payload:**
```json
{
  "room_id": "sha256 hash of room secret",
  "invite_token": "one-time invite token (256-bit hex)"
}
```

Note: The invite token is verified and consumed (single-use) by the server. The server never learns the `room_secret`.

#### `key:exchange`
Exchange public keys with other participants in the room.

**Payload:**
```json
{
  "room_id": "room identifier",
  "sender_fingerprint": "sha256 hash of sender's public key",
  "sender_public_key": "public key for key exchange (base64 encoded)",
  "sender_username": "user-chosen display name"
}
```

#### `message:send`
Send an encrypted message to the room.

**Payload:**
```json
{
  "room_id": "room identifier",
  "sender_fingerprint": "sha256 hash of sender's public key",
  "sender_username": "sender's display name",
  "ciphertext": "encrypted message content (hex encoded)",
  "nonce": "nonce used for encryption (hex encoded)",
  "timestamp": 1234567890,
  "message_type": "text|file (optional)",
  "file_size": 12345 (optional, required if message_type=file)
}
```

#### `typing:start`
Signal that the sender is typing.

**Payload:**
```json
{
  "room_id": "room identifier"
}
```

#### `typing:stop`
Signal that the sender has stopped typing.

**Payload:**
```json
{
  "room_id": "room identifier"
}
```

### Server-to-Client Events

#### `success`
Indicates successful request processing.

**Payload:**
```json
{
  "message": "successful operation description"
}
```

#### `error`
Indicates an error occurred during request processing.

**Payload:**
```json
{
  "message": "error description"
}
```

#### `key:exchange`
Public key forwarded from another participant.

**Payload:**
```json
{
  "room_id": "room identifier",
  "sender_fingerprint": "sha256 hash of sender's public key",
  "sender_public_key": "public key for key exchange (base64 encoded)",
  "sender_username": "sender's display name"
}
```

#### `message:receive`
Encrypted message forwarded from another participant.

**Payload:**
```json
{
  "room_id": "room identifier",
  "sender_fingerprint": "sha256 hash of sender's public key",
  "sender_username": "sender's display name",
  "ciphertext": "encrypted message content (hex encoded)",
  "nonce": "nonce used for encryption (hex encoded)",
  "timestamp": 1234567890
}
```

#### `client:joined`
Notification that a client has joined the room.

**Payload:**
```json
{
  "fingerprint": "fingerprint of the joining client",
  "username": "username of the joining client"
}
```

#### `client:left`
Notification that a client has left the room.

**Payload:**
```json
{
  "fingerprint": "fingerprint of the leaving client",
  "username": "username of the leaving client"
}
```

#### `typing:start`
Forwarded from sender to other participants in the room.

**Payload:**
```json
{
  "fingerprint": "sender's fingerprint",
  "username": "sender's username"
}
```

#### `typing:stop`
Forwarded from sender to other participants in the room.

**Payload:**
```json
{
  "fingerprint": "sender's fingerprint",
  "username": "sender's username"
}
```

## Security Considerations

### Server Blindness
- Server never decrypts message content
- Server only processes ciphertext and routing metadata
- Server never receives `room_secret` — only one-time `invite_token`
- Server cannot correlate user identities with message content

### Public Key Authentication (MITM Prevention)
- SHA-256 fingerprint of public key is embedded in the invite link
- After key exchange, client verifies the received fingerprint against the one in the link
- If they do not match, the connection is rejected with a security warning
- Security depends on the confidentiality of the invite channel (out-of-band)

### Ephemeral Nature
- Rooms automatically expire after 10 minutes of inactivity
- Messages automatically expire after 5 minutes
- No persistent storage of message history

### Rate Limiting
- Connections limited by IP address (`RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MS`)
- Maximum connections per IP: `RATE_LIMIT_MAX_CONNECTIONS_PER_IP`
- Messages limited per fingerprint: `RATE_LIMIT_MESSAGES_PER_WINDOW` per `RATE_LIMIT_MESSAGES_WINDOW_MS`
- Repeatedly violating clients are disconnected (after `MAX_VIOLATIONS_BEFORE_DISCONNECT`)
- Server-side file size validation: `MAX_FILE_SIZE_BYTES`

### Origin Validation
- WebSocket connections validated against `ALLOWED_ORIGINS` using exact hostname comparison
- Prevents cross-site WebSocket hijacking

### Replay Protection
- Message nonces tracked per fingerprint within a TTL window
- Duplicate messages (same nonce, same fingerprint) are rejected

## Implementation Notes

### Client Requirements
- Generate X25519 key pair on initial load
- Private key stored in IndexedDB to survive page refreshes
- Compute fingerprint as SHA-256 hash of public key
- Encrypt messages with AES-256-GCM using derived shared secret

### Server Requirements
- Validate message format before forwarding
- Validate WebSocket connection origin
- Rate limiting per IP and per fingerprint
- Payload and file size validation
- Replay protection (nonce tracking)
- Disconnect repeatedly violating clients
- Enforce room participant limit (max 10)
- Enforce automatic expiration of stale rooms
- HTTP security headers (CSP, X-Frame-Options, etc.)
- Minimal logging (no user content)
