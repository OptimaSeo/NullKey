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