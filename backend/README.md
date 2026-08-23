# NullKey Backend

WebSocket relay server for the NullKey anonymous end-to-end encrypted chat.

**Responsibilities:**
- Room lifecycle management (create, join, leave, expiry)
- Relay encrypted messages between peers (never sees plaintext)
- Replay protection, rate limiting, origin validation
- TTL-based automatic cleanup of idle rooms

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

Server listens on `http://localhost:8080` by default.

### Development

```bash
npm run dev
```

Uses `ts-node` for hot-reload.

## Configuration

All configuration is via environment variables (see root [`.env.example`](../.env.example)).

| Variable | Default | Description |
|---|---|---|---|
| `PORT` | `8080` | HTTP / WebSocket port |
| `NODE_ENV` | `development` | Runtime environment |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed WebSocket origins. Rejects connections with no match. |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | Connection rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max connection requests per window |
| `RATE_LIMIT_MAX_CONNECTIONS_PER_IP` | `20` | Max concurrent WebSocket connections per IP |
| `RATE_LIMIT_MESSAGES_PER_WINDOW` | `60` | Max messages per fingerprint per window |
| `RATE_LIMIT_MESSAGES_WINDOW_MS` | `60000` (1 min) | Message rate limit window |
| `MAX_PARTICIPANTS_PER_ROOM` | `10` | Max clients per room |
| `MAX_ROOM_LIFETIME_MINUTES` | `60` | Absolute room TTL |
| `ROOM_IDLE_TIMEOUT_MINUTES` | `10` | Room auto-deletes after this long with no activity |
| `MESSAGE_TTL_MINUTES` | `5` | Replay protection window |
| `MAX_MESSAGE_SIZE_BYTES` | `1048576` (1 MB) | Max payload for non-file messages |
| `MAX_FILE_SIZE_BYTES` | `104857600` (100 MB) | Max file size for file messages (drives the WS frame budget: base64(file+tag) must fit in one frame) |
| `REPLAY_PROTECTION_ENABLED` | `true` | Enable/disable nonce replay check |
| `SECURITY_HEADERS_ENABLED` | `true` | Enable HTTP security headers (CSP, X-Frame-Options, etc.) |
| `DISCONNECT_ON_REPEATED_VIOLATIONS` | `true` | Auto-disconnect clients with repeated protocol errors |
| `MAX_VIOLATIONS_BEFORE_DISCONNECT` | `10` | Protocol error threshold before disconnect |
| `CLEANUP_INTERVAL_MS` | `60000` (1 min) | How often expired rooms are purged |

## Architecture

```
src/
├── config.ts          # Centralised env-based configuration
├── server.ts          # Express + WebSocket server, rate limiting, origin check
├── rooms/
│   ├── room.ts        # RoomModel – client list, expiry, capacity
│   └── manager.ts     # RoomManager – create/join/leave/broadcast
├── relay/
│   ├── forwarder.ts   # MessageForwarder – relays messages to room peers
│   ├── routes.ts      # HTTP health + debug endpoints
│   └── message.ts     # Message type definitions
├── ws/
│   ├── handler.ts     # WebSocket event handler, validation, replay guard
│   └── validation.ts  # Payload schema validators
└── ttl/
    ├── cleanup.ts     # Periodic room cleanup
    └── scheduler.ts   # Scheduler for cleanup jobs
```

## API

### WebSocket (`ws://host:port`)

All messages are JSON `{ "event": "string", "payload": object }`.

| Event | Direction | Purpose |
|---|---|---|---|
| `room:create` | Client → Server | Create a room (payload: `room_id`, `invite_token`) |
| `room:join` | Client → Server | Join a room (payload: `room_id`, `invite_token`) |
| `key:exchange` | Both | Relay X25519 public keys between peers |
| `message:send` | Client → Server | Send encrypted message (optional `message_type`, `file_size`) |
| `message:receive` | Server → Client | Receive encrypted message from peer |
| `typing:start` / `typing:stop` | Both | Typing indicator relay |
| `room:leave` | Client → Server | Leave current room |
| `invite:create` | Client → Server | Register a new one-time invite token for the room the sender is in |
| `client:joined` / `client:left` | Server → Client | Room membership notifications |
| `room:closed` | Server → Client | Room expired and was removed; sockets are closed (code 4001) |

See [`docs/protocol.md`](../docs/protocol.md) for full protocol specification.

### HTTP

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check – returns `{ status, timestamp, roomsActive }` |

Note: the previous `/rooms` and `/rooms/:roomId` debug endpoints were removed —
they publicly exposed active room IDs, which combined with `room:create`
rejoining would have allowed anyone to enter any room.

## Docker

```bash
# Build image
docker build -t nullkey-backend .

# Run (the image listens on PORT=2020 by default)
docker run -d -p 2020:2020 \
  -e ALLOWED_ORIGINS=http://localhost:1010 \
  --name nullkey-backend \
  nullkey-backend
```

## Security Model

- **Zero-knowledge relay**: Server never decrypts messages and never receives `room_secret`. All cryptographic operations happen client-side.
- **Invite token protocol**: Room access uses one-time tokens. Server validates and consumes tokens on join.
- **No persistence**: No database. Rooms and messages exist only in memory and expire automatically.
- **Replay protection**: Each encrypted message contains a unique nonce. Duplicate nonces (per fingerprint) are rejected.
- **Rate limiting**: Per-IP request/connection limits + per-fingerprint message limits prevent abuse.
- **Origin validation**: WebSocket connections are validated against `ALLOWED_ORIGINS` using exact hostname matching (URL parsing, not `startsWith`).
- **File validation**: Server validates `file_size` for file-type messages against `MAX_FILE_SIZE_BYTES`.
- **Abusive client disconnect**: Clients with repeated protocol violations are automatically disconnected.
- **Security headers**: HTTP responses include CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

## Testing

```bash
npm test            # 57 tests (Room, Manager, ReplayGuard, Validators, Forwarder)
npm run lint        # ESLint (0 errors)
npm run format:check
```
