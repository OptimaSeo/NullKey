# NullKey

Anonymous, end‑to‑end encrypted 1‑to‑1 chat web application.

Copyright (c) 2026 OptimaSeo

Licensed under the GNU Affero General Public License v3 (AGPL‑3.0)

---

## 1. Repository Structure

```
nullkey/
├─ README.md
├─ LICENSE
├─ NOTICE
├─ DISCLAIMER.md
├─ SECURITY.md
├─ CODE_OF_CONDUCT.md
├─ CONTRIBUTING.md
├─ docs/
│  ├─ threat-model.md
│  ├─ crypto-design.md
│  ├─ protocol.md
│  └─ architecture.md
├─ frontend/
│  ├─ README.md
│  ├─ package.json
│  ├─ src/
│  │  ├─ crypto/
│  │  ├─ socket/
│  │  ├─ ui/
│  │  └─ index.ts
│  └─ public/
├─ backend/
│  ├─ README.md
│  ├─ package.json
│  └─ src/
│     ├─ ws/
│     ├─ rooms/
│     ├─ relay/
│     ├─ ttl/
│     └─ server.ts
└─ .gitignore
```

---

## 2. README.md (Root)

```md
# NullKey

NullKey is an anonymous, end‑to‑end encrypted (E2EE) 1‑to‑1 chat web application.

No accounts. No email. No phone number.
The server never sees plaintext messages.

## Core Principles

- Anonymous by design
- End‑to‑end encrypted
- Minimal metadata
- Ephemeral messages
- Server‑blind architecture

## What NullKey Is

- 1‑to‑1 anonymous chat
- Room based on shared secret
- Client‑side cryptography
- Messages auto‑deleted

## What NullKey Is NOT

- Not a guarantee of perfect anonymity
- Not protected against compromised devices
- Not resistant to global traffic correlation

## License

NullKey is licensed under the GNU Affero General Public License v3 (AGPL‑3.0).

You are free to use, study, and modify this software.

If you modify the code or run it as a network service (SaaS),
you must make the complete source code publicly available
under the same AGPL‑3.0 license.

Commercial Use Notice:
Using NullKey as part of a proprietary or closed‑source commercial service
without releasing the source code is NOT permitted.

Commercial licensing is available.
Contact: <your‑email>

## Disclaimer

This software is provided as‑is. There is no guarantee of absolute anonymity.
Users are responsible for how they use this software.
```

---

## 3. LICENSE

Use the **unmodified** official text of:

GNU Affero General Public License v3

---

## 4. NOTICE

```
NullKey © 2026 Snoopy Boys
Licensed under the GNU Affero General Public License v3 (AGPL‑3.0)
```

---

## 5. DISCLAIMER.md

```md
# Disclaimer

NullKey is an experimental privacy‑focused communication tool.

- This software does NOT guarantee perfect anonymity.
- It does NOT protect against compromised client devices.
- It does NOT protect against advanced traffic correlation attacks.

This project does not encourage or endorse illegal activity.
Use at your own risk.
```

---

## 6. SECURITY.md

```md
# Security Policy

## Reporting Vulnerabilities

Please do NOT open public issues for security vulnerabilities.

Send reports to:
security@nullkey.app (example)

We welcome responsible disclosure.
```

---

## 7. CODE_OF_CONDUCT.md

```md
# Code of Conduct

This project follows a zero‑tolerance policy for harassment.

Be respectful.
No abusive behavior.
No coercion or threats.

Violations may result in removal from the project.
```

---

## 8. CONTRIBUTING.md

```md
# Contributing to NullKey

## Rules

- No feature requests that weaken privacy
- No telemetry or tracking
- No user identification features

## Pull Requests

- One feature per PR
- Clear explanation required
- Security impact must be documented

By contributing, you agree your code is licensed under AGPL‑3.0.
```

---

## 9. docs/threat-model.md

```md
# Threat Model

Protected Against:
- Curious server operators
- Database compromise
- Passive network sniffing

Not Protected Against:
- Compromised user devices
- ISP‑level correlation
- Social engineering
```

---

## 10. docs/crypto-design.md

```md
# Cryptographic Design

- X25519 for key exchange
- HKDF for key derivation
- AES‑256‑GCM for message encryption

All cryptographic operations are performed client‑side.
The server never handles plaintext keys or messages.
```

---

## 11. docs/protocol.md

```md
# Messaging Protocol

Client → Server:

{
  room_id,
  sender_fingerprint,
  ciphertext,
  nonce,
  timestamp
}

The server acts only as a relay.
```

---

## 12. docs/architecture.md

```md
# Architecture Overview

Client:
- Browser‑based
- WebCrypto API
- IndexedDB for key storage

Server:
- WebSocket relay
- Redis TTL queues
- No message persistence
```

---

## 13. Frontend README (frontend/README.md)

```md
# NullKey Frontend

Client‑side application responsible for:

- Key generation
- Encryption / decryption
- WebSocket communication

No sensitive data leaves the browser unencrypted.
```

---

## 14. Backend README (backend/README.md)

```md
# NullKey Backend

WebSocket relay server.

Responsibilities:
- Room lifecycle management
- Message relay
- TTL enforcement

The backend must never:
- Decrypt messages
- Store long‑term data
- Identify users
```

---

## 15. Legal Posture Summary

* AGPL‑3.0 ensures no closed‑source SaaS abuse
* Commercial licensing remains possible
* Blueprint and reference implementation are protected

This repository is legally and structurally ready for public release.
