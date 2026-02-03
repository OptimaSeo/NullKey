# Architecture Overview

Client:
- Browser‑based
- WebCrypto API
- IndexedDB for key storage

Server:
- WebSocket relay
- Redis TTL queues
- No message persistence