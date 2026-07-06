/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

interface Props {
  username: string;
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  roomSecretInput: string;
  onRoomSecretChange: (value: string) => void;
  fingerprint: string;
  keystoreReady: boolean;
  status: string;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export default function RoomPanel({
  username: _username,
  usernameInput,
  onUsernameChange,
  roomSecretInput,
  onRoomSecretChange,
  fingerprint,
  keystoreReady,
  status,
  onCreateRoom,
  onJoinRoom,
}: Props) {
  return (
    <div className="text-center space-y-3 max-w-xl mx-auto">
      <div>
        <label className="block text-xs text-gray-500 mb-2 tracking-widest uppercase">
          Your display name (leave blank = Anonymous)
        </label>
        <input
          type="text"
          value={usernameInput}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="Anonymous"
          className="w-full px-4 py-2 bg-card-bg border border-dark-green text-neon-green focus:outline-none focus:border-neon-green text-center"
        />
      </div>

      <button
        className="w-full md:w-auto px-6 md:px-8 py-2 md:py-3 border border-neon-green text-neon-green text-xs md:text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
        onClick={onCreateRoom}
      >
        {'>'} CREATE SECURE ROOM
      </button>

      <div>
        <input
          type="text"
          value={roomSecretInput}
          onChange={(e) => onRoomSecretChange(e.target.value)}
          placeholder="Paste invite link to join&hellip;"
          className="w-full md:w-64 px-3 md:px-4 py-2 bg-card-bg border border-dark-green text-neon-green focus:outline-none focus:border-neon-green mb-2 text-sm md:text-base"
        />
        <button
          className="w-full md:w-auto px-6 md:px-8 py-2 md:py-3 border border-neon-green text-neon-green text-xs md:text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
          onClick={onJoinRoom}
        >
          {'>'} JOIN SECURE ROOM
        </button>
      </div>

      {fingerprint && (
        <div className="text-xs text-gray-500">
          Your fingerprint: {fingerprint.substring(0, 16)}&hellip;
          <span className="text-gray-700 mx-2">|</span>
          key persisted: {keystoreReady ? 'yes' : 'new'}
        </div>
      )}

      {status && <div className="text-xs text-red-500">{status}</div>}

      <p className="text-[10px] md:text-xs text-gray-500">
        By proceeding, you acknowledge that while we secure transmission, endpoint security (your device) is your responsibility.
      </p>
      <p className="text-[10px] md:text-xs text-gray-600">
        Note: NullKey does not implement forward secrecy — compromise of a private key may expose past messages.
      </p>
    </div>
  );
}
