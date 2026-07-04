# NullKey

**Disposable, end-to-end encrypted group chat.** No accounts. No message history. Self-host with one container.

```
┌────────────┐     WebSocket (ciphertext only)     ┌────────────┐
│  Browser A  │◄───────────────────────────────────►│  Browser B  │
│  (X25519    │         relay                        │  (X25519    │
│   + AES-    │         server                       │   + AES-    │
│   256-GCM)  │         (blind)                      │   256-GCM)  │
└────────────┘                                      └────────────┘
```

All cryptography runs client-side via WebCrypto API. The relay server **never** sees plaintext, encryption keys, or room secrets.

- **X25519** key exchange → **HKDF** key derivation → **AES-256-GCM** encryption
- Rooms identified by `SHA-256(room_secret)` — server cannot reverse the hash
- One-time invite tokens — server never receives the `room_secret`
- Fingerprint pinned in invite link — MITM detection on key exchange

---

## Quick Start

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000` in two tabs. Create a room in one, paste the invite link in the other.

---

## Features

| | |
|---|---|
| **End-to-end encryption** | X25519 + HKDF + AES-256-GCM via WebCrypto |
| **Key persistence** | Keypair survives page reload (IndexedDB) |
| **Invite token protocol** | Server validates one-time tokens; `room_secret` never leaves the client |
| **MITM protection** | Peer fingerprint embedded in invite link, verified after key exchange |
| **Encrypted file sharing** | Up to 100 MB per file, integrity verified with SHA-256 |
| **QR invites** | Scan from phone to join |
| **Typing indicators** | Real-time relay of `typing:start` / `typing:stop` |
| **Replay protection** | Nonce deduplication per sender fingerprint |
| **Rate limiting** | Per-IP connection limits + per-fingerprint message limits |
| **Origin validation** | WebSocket connections checked against allowed origins (exact hostname match) |
| **Security headers** | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Abusive client disconnect** | Auto-disconnect after repeated protocol violations |
| **Auto-cleanup** | Rooms expire after configurable idle timeout |

---

## Security Model

**Protected:**
| Threat | Mitigation |
|---|---|
| Server compromise | Ciphertext only — server has no keys or `room_secret` |
| Database leak | No database — everything lives in memory with TTL |
| Passive network monitoring | All content encrypted with AES-256-GCM |
| Man-in-the-middle | Fingerprint verification from out-of-band invite link |
| Replay attacks | Nonce deduplication per sender fingerprint |
| Cross-site WebSocket hijacking | Origin validation via exact hostname + port + protocol match |
| Message flooding | Per-IP + per-fingerprint rate limits; abusive clients disconnected |

**Not protected (by design):**
| Limitation | Reason |
|---|---|
| Compromised client device | Once the browser is owned, all bets are off |
| Network-level correlation | No TOR — IPs, timing, and message sizes are visible |
| Forward secrecy | Single X25519 keypair per session; no Double Ratchet |
| Metadata | Server sees IPs, connection timing, and participant fingerprints |

**Forward secrecy notice:** NullKey uses a static X25519 keypair. If a private key is compromised, all past messages in that session can be decrypted. This is a deliberate trade-off for simplicity.

---

## Configuration

```bash
cp .env.example .env
```

Key variables:
| Variable | Default | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed WebSocket origins |
| `RATE_LIMIT_MAX_CONNECTIONS_PER_IP` | `20` | Max concurrent WebSocket connections per IP |
| `MAX_PARTICIPANTS_PER_ROOM` | `10` | Max clients per room |
| `REPLAY_PROTECTION_ENABLED` | `true` | Enable/disable nonce replay check |

See [`.env.example`](.env.example) for the full list.

---

## Project Structure

```
├── backend/          WebSocket relay server (Node.js, ws, Express)
│   ├── src/
│   │   ├── server.ts       Entry point, Express + WebSocket
│   │   ├── config.ts       Environment-based configuration
│   │   ├── rooms/          Room lifecycle (create, join, leave, TTL)
│   │   ├── relay/          Message routing and forwarding
│   │   ├── ws/             Event handler, validation, replay guard
│   │   └── ttl/            Periodic room cleanup
│   ├── Dockerfile          Multi-stage, node:20-alpine
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
│   └── jest.config.js     Jest configuration
│
├── .env.example           All configurable environment variables
├── SECURITY.md            Vulnerability disclosure policy
├── CONTRIBUTING.md        Developer setup & PR guide
└── docs/                  Protocol spec, crypto design, threat model
```

---

## Docker

```bash
# Backend
docker build -t nullkey-backend ./backend
docker run -d -p 8080:8080 nullkey-backend

# Frontend (set WS URL to your backend)
docker build --build-arg NEXT_PUBLIC_WS_URL=ws://localhost:8080 -t nullkey-frontend ./frontend
docker run -d -p 3000:80 nullkey-frontend
```

---

## Testing

```bash
# Backend — 57+ tests (Room, Manager, ReplayGuard, Validators, Forwarder)
cd backend && npm test && npm run lint

# Frontend — 17+ tests (encryption, session, storage)
cd frontend && npm test
```

---

## License

AGPL-3.0 — see [`backend/LICENSE`](backend/LICENSE).

For commercial / closed-source licensing: [nullkey@optimaseo.id](mailto:nullkey@optimaseo.id)

---

**No Logs. No Accounts. No Trace.**
