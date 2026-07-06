# NullKey Frontend

Client-side web application for the NullKey anonymous end-to-end encrypted chat.

**Responsibilities:**
- X25519 keypair generation & storage (IndexedDB)
- E2EE message encryption / decryption (AES-256-GCM via WebCrypto)
- WebSocket communication with the relay server
- QR code generation for room invite links
- Encrypted file sharing

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Production build

```bash
npm run build
```

Output is a static export in `out/` (Next.js `output: 'export'`). Serve with any HTTP server (nginx, caddy, etc.).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080` | WebSocket URL of the backend relay server |

Set via environment or `.env.local`:

```bash
echo "NEXT_PUBLIC_WS_URL=wss://relay.example.com" >> .env.local
```

## Architecture

```
app/
├── globals.css          # Tailwind + custom scanline effect
├── layout.tsx           # Root layout – dark terminal theme
└── page.tsx             # Main page – full app UI

src/
├── crypto/
│   ├── keygen.ts        # X25519 keypair generation, SHA-256 fingerprint
│   ├── encryption.ts    # AES-256-GCM encrypt/decrypt, HKDF key derivation
│   └── session.ts       # SessionManager – keypair lifecycle, shared secrets
├── socket/
│   └── client.ts        # WebSocket client, event listeners, Hex/Base64 helpers
├── storage/
│   └── index.ts         # IndexedDB persistence for keypair (survives reload)
└── ui/                  # UI helpers (extensible)

components/
├── Header.tsx            # Terminal-style header with "No Logs. No Accounts. No Trace."
├── FeaturePanel.tsx      # Feature cards (Blind Relay, Client Encryption, Ephemeral)
└── MatrixBackground.tsx  # Animated Matrix rain canvas background
```

## Features

### Key Persistence
Keypair is stored in IndexedDB on first generation. Reloading the page restores the same identity. Fingerprint shown in UI: `key persisted: yes`.

### Create a Room
1. Enter a handle (optional)
2. Click **CREATE SECURE ROOM**
3. Share the invite via:
   - **QR code** — scan from phone
   - **Invite link** — `https://domain/#/s=<secret>&t=<token>&k=<fingerprint>` (auto-join on open)
   - The invite link includes the room secret, one-time invite token, and creator's fingerprint

### Join a Room
- Click an invite link — auto-joins on page load, verifies fingerprint after key exchange
- Paste the full invite link into the input field and click **JOIN**
- Manual join with only `room_secret` is not supported (requires invite token)

### Send Encrypted Messages
- Type a message and press Enter or click SEND
- Message is encrypted per-peer using X25519 shared secret → HKDF → AES-256-GCM
- Only intended recipients can decrypt

### Send Encrypted Files
- Click the attach button (📎) next to the input field
- Select a file (any type)
- Click **SEND FILE** — file is encrypted with AES-256-GCM and sent via relay
- Recipient sees file name, size, and a **DOWNLOAD** button
- Click download → decrypted client-side → browser download

### Typing Indicator
- Other peers see when you're typing ("... is typing")
- Auto-stops after 2 seconds of inactivity

## Docker

```bash
# Build with custom WebSocket URL
docker build \
  --build-arg NEXT_PUBLIC_WS_URL=ws://backend:8080 \
  -t nullkey-frontend .

# Run behind nginx on port 3000
docker run -d -p 3000:80 --name nullkey-frontend nullkey-frontend
```

## Security Notes

- **Keys never leave the browser**: Private key stays in memory / IndexedDB. Only public key is sent via relay.
- **Server is blind**: All messages are encrypted before leaving the client. The relay only sees ciphertext.
- **No forward secrecy**: The X25519 shared secret is static per session. No ratcheting. Compromise of a private key exposes all past messages for that session.
- **MITM protection**: Fingerprint is embedded in the invite link. After key exchange, the received fingerprint is compared against the one in the link. Mismatch produces a prominent warning.
- **No tracking**: No cookies, no analytics, no third-party requests (except QR code which is generated client-side).

## Testing

```bash
npm test
```

(Test runner to be configured.)
