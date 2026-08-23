/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import {
  validateMessageFormat,
  validatePayloadSize,
  validateRoomCreation,
  validateRoomJoin,
  validateKeyExchange,
  validateMessage,
  validateInviteCreation,
} from '../validation';

jest.mock('../../config', () => ({
  config: { maxMessageSizeBytes: 1000 },
  wsMaxPayloadBytes: 1000,
}));

describe('validateMessageFormat', () => {
  it('accepts a valid message with event and payload', () => {
    const data = Buffer.from(JSON.stringify({ event: 'room:create', payload: { room_id: 'x' } }));
    expect(validateMessageFormat(data as any)).toBe(true);
  });

  it('accepts a message without payload', () => {
    const data = Buffer.from(JSON.stringify({ event: 'room:leave' }));
    expect(validateMessageFormat(data as any)).toBe(true);
  });

  it('rejects non-JSON data', () => {
    const data = Buffer.from('not json');
    expect(validateMessageFormat(data as any)).toBe(false);
  });

  it('rejects data without event field', () => {
    const data = Buffer.from(JSON.stringify({ payload: {} }));
    expect(validateMessageFormat(data as any)).toBe(false);
  });

  it('rejects non-string event', () => {
    const data = Buffer.from(JSON.stringify({ event: 123 }));
    expect(validateMessageFormat(data as any)).toBe(false);
  });

  it('rejects null data', () => {
    const data = Buffer.from('null');
    expect(validateMessageFormat(data as any)).toBe(false);
  });
});

describe('validatePayloadSize', () => {
  it('returns true for payload under limit', () => {
    expect(validatePayloadSize({ data: 'x'.repeat(500) })).toBe(true);
  });

  it('returns false for payload over limit', () => {
    expect(validatePayloadSize({ data: 'x'.repeat(2000) })).toBe(false);
  });

  it('returns true for null payload', () => {
    expect(validatePayloadSize(null)).toBe(true);
  });
});

describe('validateRoomCreation', () => {
  it('accepts valid payload', () => {
    expect(validateRoomCreation({ room_id: 'abc', invite_token: 'xyz' })).toBe(true);
  });

  it('rejects missing room_id', () => {
    expect(validateRoomCreation({ invite_token: 'xyz' })).toBe(false);
  });

  it('rejects missing invite_token', () => {
    expect(validateRoomCreation({ room_id: 'abc' })).toBe(false);
  });

  it('rejects null', () => {
    expect(validateRoomCreation(null)).toBe(false);
  });
});

describe('validateRoomJoin', () => {
  it('accepts valid payload', () => {
    expect(validateRoomJoin({ room_id: 'abc', invite_token: 'token' })).toBe(true);
  });

  it('rejects missing room_id', () => {
    expect(validateRoomJoin({ invite_token: 'token' })).toBe(false);
  });

  it('rejects missing invite_token', () => {
    expect(validateRoomJoin({ room_id: 'abc' })).toBe(false);
  });
});

describe('validateKeyExchange', () => {
  it('accepts valid payload', () => {
    const payload = { room_id: 'r', sender_fingerprint: 'fp', sender_public_key: 'pk' };
    expect(validateKeyExchange(payload)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(validateKeyExchange({ room_id: 'r' })).toBe(false);
    expect(validateKeyExchange({ sender_fingerprint: 'fp' })).toBe(false);
  });
});

describe('validateMessage', () => {
  it('accepts valid payload', () => {
    const payload = {
      room_id: 'r',
      sender_fingerprint: 'fp',
      ciphertext: 'ct',
      nonce: 'n',
      timestamp: 1000,
    };
    expect(validateMessage(payload)).toBe(true);
  });

  it('rejects missing each required field', () => {
    const base = { room_id: 'r', sender_fingerprint: 'fp', ciphertext: 'ct', nonce: 'n', timestamp: 1000 };
    expect(validateMessage({ ...base, room_id: undefined })).toBe(false);
    expect(validateMessage({ ...base, sender_fingerprint: undefined })).toBe(false);
    expect(validateMessage({ ...base, ciphertext: undefined })).toBe(false);
    expect(validateMessage({ ...base, nonce: undefined })).toBe(false);
    expect(validateMessage({ ...base, timestamp: 'not-number' })).toBe(false);
  });

  it('accepts a valid hex-64 recipient_fingerprint', () => {
    const base = { room_id: 'r', sender_fingerprint: 'fp', ciphertext: 'ct', nonce: 'n', timestamp: 1000 };
    const fp = 'a'.repeat(64);
    expect(validateMessage({ ...base, recipient_fingerprint: fp })).toBe(true);
    expect(validateMessage({ ...base, recipient_fingerprint: undefined })).toBe(true);
  });

  it('rejects malformed recipient_fingerprint', () => {
    const base = { room_id: 'r', sender_fingerprint: 'fp', ciphertext: 'ct', nonce: 'n', timestamp: 1000 };
    expect(validateMessage({ ...base, recipient_fingerprint: 'nothex' })).toBe(false);
    expect(validateMessage({ ...base, recipient_fingerprint: `${'g'.repeat(64)}` })).toBe(false);
    expect(validateMessage({ ...base, recipient_fingerprint: `${'a'.repeat(63)}` })).toBe(false);
    expect(validateMessage({ ...base, recipient_fingerprint: 12345 })).toBe(false);
  });
});

describe('validateInviteCreation', () => {
  const token = 'a'.repeat(64);

  it('accepts a valid payload', () => {
    expect(validateInviteCreation({ room_id: 'r', invite_token: token })).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(validateInviteCreation({ invite_token: token })).toBe(false);
    expect(validateInviteCreation({ room_id: 'r' })).toBe(false);
  });

  it('rejects malformed tokens', () => {
    expect(validateInviteCreation({ room_id: 'r', invite_token: 'short-token' })).toBe(false);
    expect(validateInviteCreation({ room_id: 'r', invite_token: `${'g'.repeat(64)}` })).toBe(false);
    expect(validateInviteCreation({ room_id: 'r', invite_token: null })).toBe(false);
  });
});
