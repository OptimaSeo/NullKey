# Cryptographic Design

- X25519 for key exchange
- HKDF for key derivation
- AES‑256‑GCM for message encryption

All cryptographic operations are performed client‑side.
The server never handles plaintext keys or messages.