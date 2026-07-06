/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { useState, useCallback } from 'react';
import type { Peer, InviteData } from '../types/protocol';
import type { CryptoService } from '../services/crypto.service';
import type { SocketService } from '../services/socket.service';
import { RoomService } from '../services/room.service';

export function useRoom(crypto: CryptoService | null, socket: SocketService | null, username: string, addSystemMessage: (text: string) => void, onEnterRoom: (roomId: string, roomSecret: string) => void) {
  const [activeRoomSecret, setActiveRoomSecret] = useState('');
  const [activeRoomId, setActiveRoomId] = useState('');
  const [peers, setPeers] = useState<Peer[]>([]);
  const [latestRoomSecret, setLatestRoomSecret] = useState('');
  const [latestInviteToken, setLatestInviteToken] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expectedFingerprint, setExpectedFingerprint] = useState<string | null>(null);

  const handleCreateRoom = useCallback(async () => {
    if (!crypto || !socket) return;
    const roomSecret = crypto.generateRoomSecret();
    const roomId = await crypto.getRoomId(roomSecret);
    const inviteToken = crypto.generateInviteToken();

    try {
      await socket.connect();
      socket.createRoom(roomId, inviteToken, crypto.fingerprint, username);
      setLatestRoomSecret(roomSecret);
      setLatestInviteToken(inviteToken);
      setActiveRoomSecret(roomSecret);
      setActiveRoomId(roomId);
      setShowInviteModal(true);
      setPeers([]);
      onEnterRoom(roomId, roomSecret);
    } catch {
      addSystemMessage('Failed to create room.');
    }
  }, [crypto, socket, onEnterRoom, addSystemMessage]);

  const handleJoinRoom = useCallback(async (secret?: string, token?: string) => {
    if (!crypto || !socket) return;

    let roomSecret = secret;
    let inviteToken = token;

    if (!roomSecret || !inviteToken) {
      const invite = RoomService.parseInviteFromHash();
      if (invite) {
        roomSecret = invite.secret;
        inviteToken = invite.token;
        if (invite.expectedFingerprint) setExpectedFingerprint(invite.expectedFingerprint);
      } else {
        // Try manual input — the hook caller handles the input state
        addSystemMessage('Paste the full invite link to join.');
        return;
      }
    }

    if (!roomSecret || !/^[0-9a-fA-F]{64}$/.test(roomSecret)) {
      addSystemMessage('Invalid invite — expected a 64-char room secret');
      return;
    }

    if (!inviteToken) {
      addSystemMessage('Missing invite token. Use an invite link to join.');
      return;
    }

    try {
      const roomId = await crypto.getRoomId(roomSecret);
      await socket.connect();
      socket.joinRoom(roomId, inviteToken, crypto.fingerprint, username);
      setActiveRoomSecret(roomSecret);
      setActiveRoomId(roomId);
      setPeers([]);
      onEnterRoom(roomId, roomSecret);
    } catch {
      addSystemMessage('Failed to join room.');
    }
  }, [crypto, socket, onEnterRoom, addSystemMessage]);

  const handleLeaveRoom = useCallback(() => {
    socket?.leaveRoom();
    setActiveRoomSecret('');
    setActiveRoomId('');
    setPeers([]);
    setExpectedFingerprint(null);
    RoomService.clearHash();
  }, [socket]);

  const handleClientJoined = useCallback((fingerprint: string, peerUsername: string) => {
    setPeers((prev) => {
      if (prev.some((p) => p.fingerprint === fingerprint)) return prev;
      return [...prev, { fingerprint, username: peerUsername || 'Anonymous' }];
    });
    addSystemMessage(`${peerUsername || 'Anonymous'} joined the room`);
  }, [addSystemMessage]);

  const handleClientLeft = useCallback((fingerprint: string, peerUsername: string) => {
    setPeers((prev) => prev.filter((p) => p.fingerprint !== fingerprint));
    addSystemMessage(`${peerUsername || 'Anonymous'} left the room`);
  }, [addSystemMessage]);

  const handleCopyInvite = useCallback(async () => {
    if (!crypto) return;
    const link = RoomService.getInviteLink(latestRoomSecret, latestInviteToken, crypto.fingerprint);
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(link || latestRoomSecret);
      return true;
    } catch {
      return false;
    }
  }, [crypto, latestRoomSecret, latestInviteToken]);

  const broadcastKeyExchange = useCallback(async (roomId: string) => {
    if (!crypto || !socket) return;
    socket.sendKeyExchange({
      room_id: roomId,
      sender_fingerprint: crypto.fingerprint,
      sender_public_key: crypto.publicKeyBase64(),
      sender_username: username || 'Anonymous',
    });
  }, [crypto, socket, username]);

  const handleKeyExchange = useCallback((payload: any) => {
    if (!crypto || !payload || !payload.sender_fingerprint || !payload.sender_public_key) return;
    if (payload.sender_fingerprint === crypto.fingerprint) return;

    if (expectedFingerprint && payload.sender_fingerprint !== expectedFingerprint) {
      addSystemMessage(
        `SECURITY WARNING: Fingerprint mismatch! Expected ${expectedFingerprint.substring(0, 16)}… but received ${payload.sender_fingerprint.substring(0, 16)}… Possible MITM attack. Shared secret NOT established.`,
      );
      return;
    }

    crypto.establishSharedSecret(payload.sender_public_key, payload.sender_fingerprint)
      .then(() => {
        setPeers((prev) => {
          if (prev.some((p) => p.fingerprint === payload.sender_fingerprint)) return prev;
          return [...prev, { fingerprint: payload.sender_fingerprint, username: payload.sender_username || 'Anonymous' }];
        });
        addSystemMessage(`Secure session established with ${payload.sender_username || 'Anonymous'}`);
      })
      .catch(() => {
        addSystemMessage('Failed to establish shared secret');
      });
  }, [crypto, expectedFingerprint, addSystemMessage]);

  return {
    // state
    activeRoomId,
    activeRoomSecret,
    peers,
    latestRoomSecret,
    latestInviteToken,
    showInviteModal,
    expectedFingerprint,
    // setters
    setActiveRoomId,
    setActiveRoomSecret,
    setPeers,
    setShowInviteModal,
    setLatestInviteToken,
    setExpectedFingerprint,
    // actions
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyInvite,
    broadcastKeyExchange,
    handleKeyExchange,
    handleClientJoined,
    handleClientLeft,
  };
}
