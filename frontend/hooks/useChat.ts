/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types/protocol';
import type { CryptoService } from '../services/crypto.service';
import type { SocketService } from '../services/socket.service';
import { toHex, fromHex, toBase64 } from '../utils/encoding';
import { FileService } from '../services/file.service';

export function useChat(
  crypto: CryptoService | null,
  socket: SocketService | null,
  activeRoomId: string,
  peers: { fingerprint: string; username: string }[],
  username: string,
  messages: ChatMessage[],
  addMessage: (msg: ChatMessage) => void,
  addSystemMessage: (text: string) => void,
  selectedFile: { file: File; data: Uint8Array } | null,
  setSelectedFile: (f: { file: File; data: Uint8Array } | null) => void,
) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isFileMessage = useCallback((msg: ChatMessage): boolean => {
    try {
      const meta = JSON.parse(msg.plaintext);
      return !!meta.file_name;
    } catch {
      return false;
    }
  }, []);

  const handleSendMessage = useCallback(async (draft: string) => {
    if (!crypto || !socket || !draft.trim() || !activeRoomId) return;

    const recipients = peers.filter((p) => crypto.getSharedSecret(p.fingerprint));
    if (recipients.length === 0) {
      addSystemMessage('No encrypted session established with any peer yet. Wait for key exchange.');
      return;
    }

    const plaintext = draft.trim();
    const salt = fromHex(activeRoomId);
    let firstSent = false;
    for (const peer of recipients) {
      try {
        const { ciphertext, nonce } = await crypto.encryptMessage(plaintext, peer.fingerprint, salt);
        socket.sendMessage({
          room_id: activeRoomId,
          sender_fingerprint: crypto.fingerprint,
          sender_username: username,
          ciphertext: toHex(ciphertext),
          nonce: toHex(nonce),
          timestamp: Date.now(),
        });
        firstSent = true;
      } catch {
        addSystemMessage(`Failed to encrypt message for ${peer.username}`);
      }
    }

    if (firstSent) {
      addMessage({
        id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fingerprint: crypto.fingerprint,
        username: username || 'me',
        plaintext,
        timestamp: Date.now(),
        mine: true,
      });
    }
  }, [crypto, socket, activeRoomId, peers, username, addMessage, addSystemMessage]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const error = FileService.validate(file);
    if (error) {
      addSystemMessage(error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      const selected = await FileService.readFile(file);
      setSelectedFile(selected);
    } catch {
      addSystemMessage('Failed to read file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [addSystemMessage, setSelectedFile]);

  const handleSendFile = useCallback(async () => {
    if (!crypto || !socket || !selectedFile || !activeRoomId) return;

    const recipients = peers.filter((p) => crypto.getSharedSecret(p.fingerprint));
    if (recipients.length === 0) {
      addSystemMessage('No encrypted session established with any peer yet.');
      return;
    }

    const salt = fromHex(activeRoomId);
    let firstSent = false;
    for (const peer of recipients) {
      try {
        const fileHash = await crypto.computeFileHash(selectedFile.data);
        const { ciphertext, nonce } = await crypto.encryptMessage(selectedFile.data, peer.fingerprint, salt);
        socket.sendMessage({
          room_id: activeRoomId,
          sender_fingerprint: crypto.fingerprint,
          sender_username: username,
          ciphertext: toBase64(ciphertext),
          nonce: toHex(nonce),
          timestamp: Date.now(),
          message_type: 'file',
          file_name: selectedFile.file.name,
          file_size: selectedFile.file.size,
          file_type: selectedFile.file.type || 'application/octet-stream',
          file_hash: fileHash,
        });
        firstSent = true;
      } catch {
        addSystemMessage(`Failed to encrypt file for ${peer.username}`);
      }
    }

    if (firstSent) {
      addMessage({
        id: `outfile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fingerprint: crypto.fingerprint,
        username: username || 'me',
        plaintext: JSON.stringify({
          file_name: selectedFile.file.name,
          file_size: selectedFile.file.size,
          file_type: selectedFile.file.type || 'application/octet-stream',
        }),
        timestamp: Date.now(),
        mine: true,
      });
      setSelectedFile(null);
    }
  }, [crypto, socket, selectedFile, activeRoomId, peers, username, addMessage, addSystemMessage, setSelectedFile]);

  const handleDownloadFile = useCallback(async (msg: ChatMessage) => {
    if (!crypto) return;
    try {
      await FileService.downloadFile(msg, activeRoomId, crypto);
    } catch (err) {
      addSystemMessage((err as Error).message || 'Failed to decrypt file');
    }
  }, [crypto, activeRoomId, addSystemMessage]);

  const handleReceiveMessage = useCallback((payload: any) => {
    if (!crypto || !payload || !payload.sender_fingerprint || !payload.ciphertext || !payload.nonce) return;
    if (payload.sender_fingerprint === crypto.fingerprint) return;

    if (!crypto.getSharedSecret(payload.sender_fingerprint)) {
      addSystemMessage(`Received message from ${payload.sender_username || 'Anonymous'} but no shared secret is established yet`);
      return;
    }

    const salt = fromHex(payload.room_id || '');
    const isFile = payload.message_type === 'file';

    if (isFile) {
      addMessage({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fingerprint: payload.sender_fingerprint,
        username: payload.sender_username || 'Anonymous',
        plaintext: JSON.stringify({
          ciphertext: payload.ciphertext,
          nonce: payload.nonce,
          file_name: payload.file_name || 'unnamed',
          file_size: payload.file_size || 0,
          file_type: payload.file_type || 'application/octet-stream',
          file_hash: payload.file_hash || '',
        }),
        timestamp: payload.timestamp || Date.now(),
        mine: false,
      });
    } else {
      const ciphertext = fromHex(payload.ciphertext);
      const nonce = fromHex(payload.nonce);
      crypto.decryptMessage(ciphertext, nonce, payload.sender_fingerprint, salt)
        .then((text) => {
          addMessage({
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fingerprint: payload.sender_fingerprint,
            username: payload.sender_username || 'Anonymous',
            plaintext: text,
            timestamp: payload.timestamp || Date.now(),
            mine: false,
          });
        })
        .catch(() => {
          addSystemMessage(`Failed to decrypt message from ${payload.sender_username || 'Anonymous'}`);
        });
    }
  }, [crypto, addMessage, addSystemMessage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messagesEndRef,
    fileInputRef,
    isFileMessage,
    handleSendMessage,
    handleFileSelect,
    handleSendFile,
    handleDownloadFile,
    handleReceiveMessage,
  };
}
