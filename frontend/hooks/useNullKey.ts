/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { CryptoService } from '../services/crypto.service';
import { SocketService, getDefaultWsUrl } from '../services/socket.service';
import { RoomService } from '../services/room.service';
import { saveKeyPair, loadKeyPair } from '../src/storage';
import { useRoom } from './useRoom';
import { useChat } from './useChat';
import { useTyping } from './useTyping';
import type { ServerEvent, ChatMessage } from '../types/protocol';

export function useNullKey() {
  const [username, setUsername] = useState('Anonymous');
  const [usernameInput, setUsernameInput] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [keystoreReady, setKeystoreReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ file: File; data: Uint8Array } | null>(null);

  const cryptoRef = useRef<CryptoService | null>(null);
  const socketRef = useRef<SocketService | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    addMessage({
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fingerprint: 'system',
      username: 'System',
      plaintext: text,
      timestamp: Date.now(),
      system: true,
    });
  }, [addMessage]);

  const onEnterRoom = useCallback((roomId: string) => {
    setShowChatInterface(true);
    setMessages([
      {
        id: 'sys-init',
        fingerprint: 'system',
        username: 'System',
        plaintext: 'Connecting to room\u2026',
        timestamp: Date.now(),
        system: true,
      },
    ]);
    setSelectedFile(null);
    setTimeout(() => roomActionsRef.current?.broadcastKeyExchange(roomId), 150);
  }, []);

  // Create room hook
  const roomActions = useRoom(
    cryptoRef.current,
    socketRef.current,
    username,
    addSystemMessage,
    onEnterRoom,
  );

  // Store broadcastKeyExchange in ref so onEnterRoom can use it
  const roomActionsRef = useRef(roomActions);
  roomActionsRef.current = roomActions;

  // Create chat hook
  const chatActions = useChat(
    cryptoRef.current,
    socketRef.current,
    roomActions.activeRoomId,
    roomActions.peers,
    username,
    messages,
    addMessage,
    addSystemMessage,
    selectedFile,
    setSelectedFile,
  );

  // Create typing hook
  const typingActions = useTyping(
    (rid: string) => socketRef.current?.sendTypingStart(rid),
    (rid: string) => socketRef.current?.sendTypingStop(rid),
    roomActions.activeRoomId,
    roomActions.peers,
  );

  // Bootstrap: init crypto + socket
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const storedKeys = await loadKeyPair();
      const crypto = await CryptoService.create(storedKeys ?? undefined);
      if (cancelled) return;
      cryptoRef.current = crypto;
      setFingerprint(crypto.fingerprint);

      if (!storedKeys) {
        await saveKeyPair({
          privateKey: crypto.privateKey,
          publicKey: crypto.publicKey,
        });
      }

      const wsUrl = getDefaultWsUrl();
      const socket = new SocketService(wsUrl);
      if (cancelled) return;
      socketRef.current = socket;

      socket.onStatus((s) => {
        if (s === 'open') setConnected(true);
        if (s === 'close') {
          setConnected(false);
          setStatus('Disconnected from server');
        }
        if (s === 'error') setStatus('Connection error');
      });

      setKeystoreReady(true);
    };

    init();
    return () => { cancelled = true; socketRef.current?.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to server events
  useEffect(() => {
    if (!socketRef.current || !keystoreReady) return;
    const unsub = socketRef.current.subscribe((event: ServerEvent, payload: any) => {
      switch (event) {
        case 'success':
          if (payload?.message) addSystemMessage(payload.message);
          break;
        case 'error':
          if (payload?.message) {
            addSystemMessage(`Server error: ${payload.message}`);
            setStatus(payload.message);
          }
          break;
        case 'key:exchange':
          roomActionsRef.current.handleKeyExchange(payload);
          break;
        case 'message:receive':
          chatActions.handleReceiveMessage(payload);
          break;
        case 'client:joined':
          if (payload?.fingerprint) {
            roomActionsRef.current.handleClientJoined(payload.fingerprint, payload.username);
          }
          break;
        case 'client:left':
          if (payload?.fingerprint) {
            roomActionsRef.current.handleClientLeft(payload.fingerprint, payload.username);
          }
          break;
        case 'typing:start':
          if (payload?.fingerprint) {
            typingActions.handleTypingEvent(payload.fingerprint);
          }
          break;
        case 'typing:stop':
          if (payload?.fingerprint) {
            typingActions.handleTypingStopEvent(payload.fingerprint);
          }
          break;
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keystoreReady, username]);

  // Auto-join from invite link
  useEffect(() => {
    if (!keystoreReady || roomActions.activeRoomSecret || showChatInterface) return;
    const invite = RoomService.parseInviteFromHash();
    if (invite) {
      if (invite.expectedFingerprint) {
        roomActions.setExpectedFingerprint(invite.expectedFingerprint);
      }
      if (invite.token && invite.secret) {
        roomActions.handleJoinRoom(invite.secret, invite.token);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keystoreReady]);

  const handleLeaveRoom = useCallback(() => {
    roomActions.handleLeaveRoom();
    setShowChatInterface(false);
    setMessages([]);
  }, [roomActions]);

  return {
    username, setUsername, usernameInput, setUsernameInput,
    fingerprint, connected, status, showChatInterface,
    messages, selectedFile, setSelectedFile,

    activeRoomId: roomActions.activeRoomId,
    activeRoomSecret: roomActions.activeRoomSecret,
    peers: roomActions.peers,
    latestRoomSecret: roomActions.latestRoomSecret,
    latestInviteToken: roomActions.latestInviteToken,
    showInviteModal: roomActions.showInviteModal,

    messagesEndRef: chatActions.messagesEndRef,
    fileInputRef: chatActions.fileInputRef,
    isFileMessage: chatActions.isFileMessage,
    typingPeerNames: typingActions.typingPeerNames,

    setShowInviteModal: roomActions.setShowInviteModal,
    setLatestInviteToken: roomActions.setLatestInviteToken,
    setShowChatInterface,

    handleCreateRoom: roomActions.handleCreateRoom,
    handleJoinRoom: roomActions.handleJoinRoom,
    handleLeaveRoom,
    handleCopyInvite: roomActions.handleCopyInvite,
    handleSendMessage: chatActions.handleSendMessage,
    handleFileSelect: chatActions.handleFileSelect,
    handleSendFile: chatActions.handleSendFile,
    handleDownloadFile: chatActions.handleDownloadFile,
    handleDraftChange: typingActions.handleDraftChange,
    finishTyping: typingActions.finishTyping,
  };
}
