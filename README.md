# NullKey — Disposable Encrypted Group Chat

**Browser-based, end-to-end encrypted group chat.** No accounts. No message history. One Docker to self-host.

## Overview

```
┌────────────┐     WebSocket (ciphertext only)     ┌────────────┐
│  Browser A  │◄───────────────────────────────────►│  Browser B  │
│  (X25519    │         relay                        │  (X25519    │
│   + AES-    │         server                       │   + AES-    │
│   256-GCM)  │         (blind)                      │   256-GCM)  │
└────────────┘                                      └────────────┘
```

All cryptography is client-side (WebCrypto API). The server **never** sees plaintext, encryption keys, or room secrets.

- **X25519** key exchange → **HKDF** key derivation → **AES-256-GCM** encryption
- Rooms identified by `SHA-256(room_secret)` — server cannot derive the secret
- No user accounts, no database, no persistent identity

## Project Structure

```
├── backend/          WebSocket relay server (Node.js, ws, Express)
│   ├── src/
│   │   ├── server.ts       Entry point, Express + WebSocket
│   │   ├── config.ts       Central env-var configuration
│   │   ├── rooms/          Room lifecycle (create, join, leave, TTL)
│   │   ├── relay/          Message routing and forwarding
│   │   ├── ws/             Event handler, validation, replay guard
│   │   └── ttl/            Periodic room cleanup
│   ├── Dockerfile          Multi-stage, node:20-alpine
│   ├── eslint.config.mjs   ESLint flat config
│   └── jest.config.js      Jest configuration
│
├── frontend/         Web client (Next.js static export)
│   ├── app/               Next.js App Router pages
│   ├── components/        React components (Header, FeaturePanel, MatrixBg)
│   ├── src/
│   │   ├── crypto/        X25519 keygen, AES-256-GCM, HKDF, session mgmt
│   │   ├── socket/        WebSocket client with event listeners
│   │   └── storage/       IndexedDB keypair persistence
│   ├── Dockerfile         Next.js → nginx:stable-alpine
│   └── .eslintrc.json     ESLint (extends Next.js + Prettier)
│
├── .github/
│   ├── dependabot.yml     Auto-update npm dependencies
│   └── ISSUE_TEMPLATE/    Bug report & feature request templates
├── .editorconfig
├── .gitignore
├── .env.example           All configurable environment variables
├── SECURITY.md            Vulnerability disclosure policy
├── CONTRIBUTING.md        Developer setup & PR guide
└── README.md              You are here
```

## Quick Start

```bash
# Backend
cd backend
npm install
npm run dev          # http://localhost:8080

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:3000
```

Open `http://localhost:3000` in two browser tabs. Create a room in one, copy the secret, join in the other.

## Features

| Feature | Details |
|---|---|---|
| **E2EE** | X25519 + HKDF + AES-256-GCM, all via WebCrypto |
| **Key persistence** | Keypair survives page reload (IndexedDB) |
| **Invite token protocol** | Server never sees `room_secret` — one-time tokens instead |
| **MITM protection** | Peer fingerprint in invite link, verified after key exchange |
| **File sharing** | Encrypted file transfer (max 100 MB) with server-side size validation |
| **QR invites** | QR code for room invites, scannable from phone |
| **Typing indicators** | `typing:start` / `typing:stop` relayed in real-time |
| **Replay protection** | Nonce-based dedup with per-fingerprint window |
| **Rate limiting** | Per-IP + per-fingerprint message limits |
| **Origin validation** | WebSocket connections checked against `ALLOWED_ORIGINS` (URL hostname match) |
| **Security headers** | CSP, X-Frame-Options, X-Content-Type-Options, etc. |
| **Abusive client disconnect** | Auto-disconnect after repeated protocol violations |
| **Auto-cleanup** | Idle rooms expired after `ROOM_IDLE_TIMEOUT_MINUTES` |

## Security Model

**Protected:**
- Server compromise — ciphertext only, server has no decryption keys or `room_secret`
- Database leak — no database, no persistence
- Passive network monitoring — all content encrypted with AES-256-GCM
- Man-in-the-middle during key exchange — prevented by fingerprint verification in invite link
- Replay attacks — nonce dedup per sender fingerprint
- Cross-site WebSocket hijacking — origin validation uses exact hostname matching
- Abusive clients — rate limited per IP + per fingerprint, disconnected after repeated violations

**Not protected:**
- Compromised client device — once someone controls the browser, game over
- ISP-level traffic correlation — no TOR, metadata like IP and packet timing visible
- Forward secrecy — session key is static for the room lifetime; no ratcheting
- Metadata — server sees IPs, connection timing, message sizes, and participant fingerprints

**Known limitations:**
- Forward secrecy: uses a single X25519 keypair per session, not Double Ratchet. Private key compromise exposes past messages.
- Network anonymity: *anonymous identity, not anonymous network*

## Configuration

Copy `.env.example` and adjust:

```bash
cp .env.example .env
# Edit .env to taste
```

Key variables:
- `ALLOWED_ORIGINS` — comma-separated origins permitted to connect via WebSocket
- `RATE_LIMIT_MAX_CONNECTIONS_PER_IP` — max concurrent connections per IP
- `MAX_PARTICIPANTS_PER_ROOM` — max clients per room (default 10)
- `REPLAY_PROTECTION_ENABLED` — enable/disable nonce replay check

## Docker

```bash
# Backend
cd backend
docker build -t nullkey-backend .
docker run -d -p 8080:8080 nullkey-backend

# Frontend (build with WS URL targeting your backend)
cd frontend
docker build --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:8080 -t nullkey-frontend .
docker run -d -p 3000:80 nullkey-frontend
```

## Testing

```bash
# Backend — 57 unit tests (Room, Manager, ReplayGuard, Validators, Forwarder)
cd backend
npm test
npm run lint        # ESLint (0 errors)
npm run format:check

# Frontend — 17 unit tests (encryption, session, storage)
cd frontend
npm test
```

## Development

```bash
cd backend
npm run dev         # ts-node hot-reload

cd frontend
npm run dev         # Next.js dev server
```

## License

AGPL-3.0 — see [LICENSE](backend/LICENSE).

For commercial / closed-source licensing: <nullkey@optimaseo.id>

---

**No Logs. No Accounts. No Trace.**
