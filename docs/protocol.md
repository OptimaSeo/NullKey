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