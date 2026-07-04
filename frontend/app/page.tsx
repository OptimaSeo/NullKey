/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../components/Header';
import FeaturePanel from '../components/FeaturePanel';
import MatrixBackground from '../components/MatrixBackground';
import { SessionManager } from '../src/crypto/session';
import { encryptMessage, decryptMessage, decryptFile, computeFileHash } from '../src/crypto/encryption';
import { WebSocketClient, toHex, fromHex } from '../src/socket/client';
import { saveKeyPair, loadKeyPair } from '../src/storage';

type RelayEvent = 'success' | 'error' | 'key:exchange' | 'message:receive' | 'client:joined' | 'client:left' | 'typing:start' | 'typing:stop';

interface ChatMessage {
  id: string;
  fingerprint: string;
  username: string;
  plaintext: string;
  timestamp: number;
  mine?: boolean;
  system?: boolean;
}

interface Peer {
  fingerprint: string;
  username: string;
}

interface InviteData {
  secret: string;
  token: string;
  expectedFingerprint?: string;
}

function getInviteLink(roomSecret: string, inviteToken: string, fingerprint: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}${window.location.pathname}#/s=${roomSecret}&t=${inviteToken}&k=${fingerprint}`;
}

function parseInviteFromHash(): InviteData | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash || '';
  const secretMatch = hash.match(/s=([0-9a-fA-F]{64})/);
  const tokenMatch = hash.match(/t=([0-9a-fA-F]{64})/);
  const fpMatch = hash.match(/k=([0-9a-fA-F]{64})/);
  if (!secretMatch || !tokenMatch) return null;
  return {
    secret: secretMatch[1],
    token: tokenMatch[1],
    expectedFingerprint: fpMatch?.[1],
  };
}

function bufToB64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

function b64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function isFileMessage(msg: ChatMessage): boolean {
  try {
    const meta = JSON.parse(msg.plaintext);
    return !!meta.file_name;
  } catch {
    return false;
  }
}

function FileMessage({ msg, onDownload }: { msg: ChatMessage; onDownload: (m: ChatMessage) => void }) {
  let fileName = 'file';
  let fileSize = 0;
  try {
    const meta = JSON.parse(msg.plaintext);
    fileName = meta.file_name || 'file';
    fileSize = meta.file_size || 0;
  } catch { /* */ }
  const sizeLabel = fileSize >= 1048576
    ? `${(fileSize / 1048576).toFixed(1)} MB`
    : fileSize >= 1024
      ? `${(fileSize / 1024).toFixed(1)} KB`
      : `${fileSize} B`;

  return (
    <div className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
      <div className={msg.mine ? 'text-right max-w-[80%]' : 'max-w-[80%]'}>
        <div className="text-xs text-gray-500 mb-1">
          {msg.mine ? 'you' : msg.username}
          <span className="text-gray-700 mx-1">·</span>
          {new Date(msg.timestamp).toLocaleTimeString()}
        </div>
        <div className="bg-card-bg border border-neon-green px-3 py-2 rounded text-sm">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neon-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-neon-green truncate">{fileName}</span>
            <span className="text-gray-500 text-xs shrink-0">{sizeLabel}</span>
          </div>
          <button
            className="mt-2 text-xs border border-neon-green text-neon-green px-2 py-0.5 hover:bg-neon-green hover:text-black transition"
            onClick={() => onDownload(msg)}
          >
            DOWNLOAD
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [username, setUsername] = useState('Anonymous');
  const [usernameInput, setUsernameInput] = useState('');
  const [roomSecretInput, setRoomSecretInput] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [connected, setConnected] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [latestRoomSecret, setLatestRoomSecret] = useState('');
  const [latestInviteToken, setLatestInviteToken] = useState('');
  const [activeRoomSecret, setActiveRoomSecret] = useState('');
  const [activeRoomId, setActiveRoomId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<string>('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [typingPeers, setTypingPeers] = useState<Map<string, number>>(new Map());
  const [keysRestored, setKeysRestored] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ file: File; data: Uint8Array } | null>(null);
  const [expectedFingerprint, setExpectedFingerprint] = useState<string | null>(null);

  const sessionManagerRef = useRef<SessionManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimersRef = useRef<Map<string, number>>(new Map());
  const typingStopTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── helpers ──

  const addSystemMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fingerprint: 'system',
        username: 'System',
        plaintext: text,
        timestamp: Date.now(),
        system: true,
      },
    ]);
  }, []);

  const ensureConnected = useCallback(async (): Promise<void> => {
    if (!wsClientRef.current) return;
    if (connected) return;
    await wsClientRef.current.connect();
    setConnected(true);
  }, [connected]);

  // ── bootstrap ──

  useEffect(() => {
    let unsubMessage: (() => void) | undefined;
    let unsubStatus: (() => void) | undefined;

    const init = async () => {
      // Restore keypair from IndexedDB if available
      const storedKeys = await loadKeyPair();
      const sessionManager = await SessionManager.create(storedKeys ?? undefined);
      sessionManagerRef.current = sessionManager;
      setFingerprint(sessionManager.fingerprint);
      setKeysRestored(true);

      // Save newly generated keys for the first time
      if (!storedKeys) {
        await saveKeyPair({
          privateKey: sessionManager.privateKey,
          publicKey: sessionManager.publicKey,
        });
      }

      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ||
        (typeof window !== 'undefined'
          ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
          : 'ws://localhost:8080');
      const wsClient = new WebSocketClient(wsUrl);
      wsClientRef.current = wsClient;

      unsubStatus = wsClient.onStatus((s: string) => {
        if (s === 'open') setConnected(true);
        if (s === 'close') {
          setConnected(false);
          setStatus('Disconnected from server');
        }
        if (s === 'error') setStatus('Connection error');
      });
    };

    init();

    return () => {
      unsubMessage?.();
      unsubStatus?.();
      wsClientRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to server events
  useEffect(() => {
    if (!wsClientRef.current) return;
    const unsub = wsClientRef.current.onMessage((event, payload) => {
      switch (event as RelayEvent) {
        case 'success': {
          if (payload?.message) addSystemMessage(payload.message as string);
          break;
        }
        case 'error': {
          if (payload?.message) {
            addSystemMessage(`Server error: ${payload.message}`);
            setStatus(payload.message);
          }
          break;
        }
        case 'key:exchange': {
          handleKeyExchangeFromServer(payload);
          break;
        }
        case 'message:receive': {
          handleReceiveMessageFromServer(payload);
          break;
        }
        case 'client:joined': {
          if (payload?.fingerprint) {
            setPeers((prev) => {
              if (prev.some((p) => p.fingerprint === payload.fingerprint)) return prev;
              return [...prev, { fingerprint: payload.fingerprint, username: payload.username || 'Anonymous' }];
            });
            addSystemMessage(`${payload.username || 'Anonymous'} joined the room`);
          }
          break;
        }
        case 'client:left': {
          if (payload?.fingerprint) {
            setPeers((prev) => prev.filter((p) => p.fingerprint !== payload.fingerprint));
            addSystemMessage(`${payload.username || 'Anonymous'} left the room`);
          }
          break;
        }
        case 'typing:start': {
          if (payload?.fingerprint && payload.fingerprint !== sessionManagerRef.current?.fingerprint) {
            setTypingPeers((prev) => {
              const next = new Map(prev);
              next.set(payload.fingerprint, Date.now());
              return next;
            });
          }
          break;
        }
        case 'typing:stop': {
          if (payload?.fingerprint) {
            setTypingPeers((prev) => {
              const next = new Map(prev);
              next.delete(payload.fingerprint);
              return next;
            });
          }
          break;
        }
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Auto-hide typing indicators after 3s of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 3000;
      setTypingPeers((prev) => {
        let changed = false;
        for (const [fp, ts] of prev) {
          if (ts < cutoff) {
            prev.delete(fp);
            changed = true;
          }
        }
        return changed ? new Map(prev) : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-join from invite link (#/s=<secret>&t=<token>&k=<fingerprint>)
  useEffect(() => {
    if (keysRestored && activeRoomSecret === '' && !showChatInterface) {
      const invite = parseInviteFromHash();
      if (invite) {
        setRoomSecretInput(invite.secret);
        if (invite.expectedFingerprint) {
          setExpectedFingerprint(invite.expectedFingerprint);
        }
        // If a token is present, trigger auto-join
        if (invite.token && invite.secret) {
          handleJoinRoom(invite.secret, invite.token);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysRestored, activeRoomSecret, showChatInterface]);

  // ── crypto helpers ──

  const publicKeyBase64 = useCallback((): string => {
    if (!sessionManagerRef.current) return '';
    const pubkey = sessionManagerRef.current.publicKey;
    let binary = '';
    for (let i = 0; i < pubkey.length; i++) binary += String.fromCharCode(pubkey[i]);
    return typeof window !== 'undefined' ? window.btoa(binary) : '';
  }, []);

  const broadcastKeyExchange = useCallback(
    async (roomId: string) => {
      const sm = sessionManagerRef.current;
      const ws = wsClientRef.current;
      if (!sm || !ws) return;
      ws.sendKeyExchange({
        room_id: roomId,
        sender_fingerprint: sm.fingerprint,
        sender_public_key: publicKeyBase64(),
        sender_username: username || 'Anonymous',
      });
    },
    [publicKeyBase64, username],
  );

  const handleKeyExchangeFromServer = useCallback(
    (payload: any) => {
      if (!payload || !payload.sender_fingerprint || !payload.sender_public_key) return;
      const sm = sessionManagerRef.current;
      if (!sm) return;
      if (payload.sender_fingerprint === sm.fingerprint) return;

      // Verify expected fingerprint from invite link (MITM protection)
      if (expectedFingerprint && payload.sender_fingerprint !== expectedFingerprint) {
        addSystemMessage(
          `SECURITY WARNING: Fingerprint mismatch! Expected ${expectedFingerprint.substring(0, 16)}… but received ${payload.sender_fingerprint.substring(0, 16)}… Possible MITM attack. Shared secret NOT established.`,
        );
        return;
      }

      try {
        const binary = typeof window !== 'undefined' ? window.atob(payload.sender_public_key) : '';
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        sm.establishSharedSecret(bytes, payload.sender_fingerprint);
        setPeers((prev) => {
          if (prev.some((p) => p.fingerprint === payload.sender_fingerprint)) return prev;
          return [...prev, { fingerprint: payload.sender_fingerprint, username: payload.sender_username || 'Anonymous' }];
        });
        addSystemMessage(`Secure session established with ${payload.sender_username || 'Anonymous'}`);
      } catch (err) {
        console.error('Failed to establish shared secret:', err);
      }
    },
    [addSystemMessage, expectedFingerprint],
  );

  const handleReceiveMessageFromServer = useCallback(
    (payload: any) => {
      if (!payload || !payload.sender_fingerprint || !payload.ciphertext || !payload.nonce) return;
      const sm = sessionManagerRef.current;
      if (!sm) return;
      if (payload.sender_fingerprint === sm.fingerprint) return;

      const sharedSecret = sm.getSharedSecret(payload.sender_fingerprint);
      if (!sharedSecret) {
        addSystemMessage(`Received message from ${payload.sender_username || 'Anonymous'} but no shared secret is established yet`);
        return;
      }

      const salt = fromHex(payload.room_id || '');
      const isFile = payload.message_type === 'file';

      if (isFile) {
        setMessages((prev) => [
          ...prev,
          {
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
          },
        ]);
      } else {
        try {
          const ciphertext = fromHex(payload.ciphertext);
          const nonce = fromHex(payload.nonce);
          decryptMessage(ciphertext, nonce, sharedSecret, salt)
            .then((text) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  fingerprint: payload.sender_fingerprint,
                  username: payload.sender_username || 'Anonymous',
                  plaintext: text,
                  timestamp: payload.timestamp || Date.now(),
                  mine: false,
                },
              ]);
            })
            .catch((err) => {
              console.error('Decryption failed:', err);
              addSystemMessage(`Failed to decrypt message from ${payload.sender_username || 'Anonymous'}`);
            });
        } catch (err) {
          console.error('Decryption error:', err);
        }
      }
    },
    [addSystemMessage],
  );

  // ── room actions ──

  const handleCreateRoom = async () => {
    const sm = sessionManagerRef.current;
    const roomSecret = SessionManager.generateRoomSecret();
    const roomId = await SessionManager.getRoomId(roomSecret);
    const inviteToken = SessionManager.generateInviteToken();

    try {
      await ensureConnected();
      const ws = wsClientRef.current;
      if (!ws) { setStatus('Not connected'); return; }
      ws.createRoom(roomId, inviteToken);
      setActiveRoomSecret(roomSecret);
      setActiveRoomId(roomId);
      setLatestRoomSecret(roomSecret);
      setLatestInviteToken(inviteToken);
      setShowInviteModal(true);
      setMessages([
        {
          id: 'sys-init',
          fingerprint: 'system',
          username: 'System',
          plaintext: 'Room created.',
          timestamp: Date.now(),
          system: true,
        },
      ]);
      setPeers([]);
      setShowChatInterface(true);
      setTimeout(() => broadcastKeyExchange(roomId), 150);
    } catch (error) {
      console.error('Failed to create room:', error);
      setStatus('Failed to create room. Check console for details.');
    }
  };

  const handleJoinRoom = async (secret?: string, token?: string) => {
    if (!sessionManagerRef.current || !wsClientRef.current) return;

    let roomSecret = secret;
    let inviteToken = token;

    // If called without explicit args, try parsing from hash or manual input
    if (!roomSecret || !inviteToken) {
      // First check the URL hash for an invite
      const invite = parseInviteFromHash();
      if (invite) {
        roomSecret = invite.secret;
        inviteToken = invite.token;
        if (invite.expectedFingerprint) {
          setExpectedFingerprint(invite.expectedFingerprint);
        }
      } else {
        // Try manual input — could be a raw secret or full URL
        const input = roomSecretInput.trim();
        if (input.includes('#/s=')) {
          // Full URL — extract hash portion
          try {
            const url = new URL(input);
            window.location.hash = url.hash;
            const parsed = parseInviteFromHash();
            if (parsed) {
              roomSecret = parsed.secret;
              inviteToken = parsed.token;
              if (parsed.expectedFingerprint) {
                setExpectedFingerprint(parsed.expectedFingerprint);
              }
            }
          } catch {
            setStatus('Invalid invite URL');
            return;
          }
        } else if (/^[0-9a-fA-F]{64}$/.test(input)) {
          setStatus('Paste the full invite link (not just the secret) to join.');
          return;
        }
      }
    }

    if (!roomSecret || !/^[0-9a-fA-F]{64}$/.test(roomSecret)) {
      setStatus('Invalid invite — expected a 64-char room secret');
      return;
    }

    if (!inviteToken) {
      setStatus('Missing invite token. Use an invite link to join.');
      return;
    }

    try {
      const roomId = await SessionManager.getRoomId(roomSecret);
      await ensureConnected();
      const ws = wsClientRef.current;
      if (!ws) { setStatus('Not connected'); return; }
      ws.joinRoom(roomId, inviteToken);
      setActiveRoomSecret(roomSecret);
      setActiveRoomId(roomId);
      setMessages([
        {
          id: 'sys-join',
          fingerprint: 'system',
          username: 'System',
          plaintext: 'Connecting to room\u2026',
          timestamp: Date.now(),
          system: true,
        },
      ]);
      setPeers([]);
      setShowChatInterface(true);
      setTimeout(() => broadcastKeyExchange(roomId), 150);
    } catch (error) {
      console.error('Failed to join room:', error);
      setStatus('Failed to join room. Check console for details.');
    }
  };

  const handleLeaveRoom = () => {
    wsClientRef.current?.leaveRoom();
    setActiveRoomSecret('');
    setActiveRoomId('');
    setPeers([]);
    setMessages([]);
    setShowChatInterface(false);
    setExpectedFingerprint(null);
    if (typeof window !== 'undefined' && window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleSendMessage = async () => {
    const sm = sessionManagerRef.current;
    const ws = wsClientRef.current;
    if (!sm || !ws || !draft.trim()) return;

    if (peers.length === 0) {
      addSystemMessage('No peers connected yet \u2014 your message has no recipients.');
      return;
    }

    const recipients = peers.filter((p) => sm.getSharedSecret(p.fingerprint));
    if (recipients.length === 0) {
      addSystemMessage('No encrypted session established with any peer yet. Wait for key exchange.');
      return;
    }

    const plaintext = draft.trim();
    const salt = fromHex(activeRoomId);
    let firstSent = false;
    for (const peer of recipients) {
      const sharedSecret = sm.getSharedSecret(peer.fingerprint);
      if (!sharedSecret) continue;
      try {
        const { ciphertext, nonce } = await encryptMessage(plaintext, sharedSecret, salt);
        ws.sendMessageToRoom({
          room_id: activeRoomId,
          sender_fingerprint: sm.fingerprint,
          sender_username: username,
          ciphertext: toHex(ciphertext),
          nonce: toHex(nonce),
          timestamp: Date.now(),
        });
        firstSent = true;
      } catch (err) {
        console.error('Encryption failed:', err);
        addSystemMessage(`Failed to encrypt message for ${peer.username}`);
      }
    }

    if (firstSent) {
      setMessages((prev) => [
        ...prev,
        {
          id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          fingerprint: sm.fingerprint,
          username: username || 'me',
          plaintext,
          timestamp: Date.now(),
          mine: true,
        },
      ]);
      setDraft('');
    }
  };

  const handleCopyInvite = async () => {
    const sm = sessionManagerRef.current;
    const fp = sm?.fingerprint ?? '';
    const link = getInviteLink(activeRoomSecret, latestInviteToken, fp);
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(link || activeRoomSecret);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  // ── file sharing ──

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      addSystemMessage('File too large — maximum 100 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = new Uint8Array(reader.result as ArrayBuffer);
      setSelectedFile({ file, data });
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendFile = async () => {
    const sm = sessionManagerRef.current;
    const ws = wsClientRef.current;
    if (!sm || !ws || !selectedFile) return;

    const recipients = peers.filter((p) => sm.getSharedSecret(p.fingerprint));
    if (recipients.length === 0) {
      addSystemMessage('No encrypted session established with any peer yet.');
      return;
    }

    const salt = fromHex(activeRoomId);
    let firstSent = false;
    for (const peer of recipients) {
      const sharedSecret = sm.getSharedSecret(peer.fingerprint);
      if (!sharedSecret) continue;
      try {
        const fileHash = await computeFileHash(selectedFile.data);
        const { ciphertext, nonce } = await encryptMessage(selectedFile.data, sharedSecret, salt);
        ws.sendMessageToRoom({
          room_id: activeRoomId,
          sender_fingerprint: sm.fingerprint,
          sender_username: username,
          ciphertext: bufToB64(ciphertext),
          nonce: toHex(nonce),
          timestamp: Date.now(),
          message_type: 'file',
          file_name: selectedFile.file.name,
          file_size: selectedFile.file.size,
          file_type: selectedFile.file.type || 'application/octet-stream',
          file_hash: fileHash,
        });
        firstSent = true;
      } catch (err) {
        console.error('File encryption failed:', err);
        addSystemMessage(`Failed to encrypt file for ${peer.username}`);
      }
    }

    if (firstSent) {
      const fileMsg = {
        id: `outfile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fingerprint: sm.fingerprint,
        username: username || 'me',
        plaintext: JSON.stringify({
          file_name: selectedFile.file.name,
          file_size: selectedFile.file.size,
          file_type: selectedFile.file.type || 'application/octet-stream',
        }),
        timestamp: Date.now(),
        mine: true,
      };
      setMessages((prev) => [...prev, fileMsg]);
      setSelectedFile(null);
    }
  };

  const handleDownloadFile = async (msg: ChatMessage) => {
    const sm = sessionManagerRef.current;
    if (!sm) return;

    const meta = JSON.parse(msg.plaintext);
    const sharedSecret = sm.getSharedSecret(msg.fingerprint);
    if (!sharedSecret) {
      addSystemMessage('No shared secret for this peer');
      return;
    }

    try {
      const ciphertext = b64ToBuf(meta.ciphertext);
      const nonce = fromHex(meta.nonce);
      const salt = fromHex(activeRoomId);
      const decrypted = await decryptFile(ciphertext, nonce, sharedSecret, salt);

      if (meta.file_hash) {
        const actualHash = await computeFileHash(decrypted);
        if (actualHash !== meta.file_hash) {
          addSystemMessage('File integrity check failed — hash mismatch. The file may be corrupted or tampered with.');
          return;
        }
      }

      const blob = new Blob([decrypted.buffer as ArrayBuffer], { type: meta.file_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = meta.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('File decryption failed:', err);
      addSystemMessage('Failed to decrypt file');
    }
  };

  // ── typing indicator ──

  const handleDraftChange = (value: string) => {
    setDraft(value);
    const ws = wsClientRef.current;
    if (!ws || !activeRoomId) return;

    ws.sendTypingStart(activeRoomId);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = window.setTimeout(() => {
      ws.sendTypingStop(activeRoomId);
    }, 2000);
  };

  const finishTyping = () => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    wsClientRef.current?.sendTypingStop(activeRoomId);
  };

  const typingPeerNames = Array.from(typingPeers.entries())
    .map(([fp]) => peers.find((p) => p.fingerprint === fp)?.username)
    .filter(Boolean);

  // ── render: invite modal ──

  if (showInviteModal) {
    const sm = sessionManagerRef.current;
    const fp = sm?.fingerprint ?? '';
    const inviteLink = getInviteLink(latestRoomSecret, latestInviteToken, fp);
    return (
      <QRCodeModal
        inviteLink={inviteLink}
        roomSecret={latestRoomSecret}
        creatorFingerprint={fp}
        onClose={() => setShowInviteModal(false)}
      />
    );
  }

  // ── render: chat interface ──

  if (showChatInterface) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-terminal-bg text-gray-300 font-mono">
        <MatrixBackground />
        <div className="scanlines fixed inset-0 z-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex-grow flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-neon-green opacity-20 blur-xl"></div>
                <div className="relative w-12 h-12 rounded-full border border-neon-green flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neon-green tracking-[0.35em] mb-3 uppercase">
              NULLKEY
            </h1>
            <h2 className="text-lg md:text-xl text-gray-200 mb-6 font-light tracking-wide">
              Connected to room: {activeRoomId.substring(0, 8)}&hellip;
            </h2>
          </div>

          {/* Peserta & status */}
          <div className="flex flex-wrap gap-4 justify-between items-center mb-4 text-xs">
            <div className="text-gray-500">
              You:<span className="text-neon-green ml-2">{username || 'Anonymous'}</span>
              <span className="text-gray-600 mx-2">·</span>
              <span className="text-gray-500">key: {fingerprint.substring(0, 16)}&hellip;</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={connected ? 'text-neon-green' : 'text-red-500'}>
                {connected ? '\u25cf connected' : '\u25cf disconnected'}
              </span>
              <span className="text-gray-500">{peers.length} peer(s)</span>
              <button
                className="px-3 py-1 border border-dark-green text-xs text-neon-green hover:bg-neon-green hover:text-black transition"
                onClick={() => {
                  setLatestRoomSecret(activeRoomSecret);
                  if (sessionManagerRef.current) {
                    setLatestInviteToken(SessionManager.generateInviteToken());
                  }
                  setShowInviteModal(true);
                }}
              >
                invite
              </button>
            </div>
          </div>

          {/* Area chat */}
          <div className="bg-card-bg border border-dark-green p-6 mb-3 h-96 overflow-y-auto">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-gray-400 text-sm">No messages yet.</div>
              )}
              {messages.map((m) =>
                m.system ? (
                  <div key={m.id} className="text-gray-500 text-xs italic">
                    &mdash; {m.plaintext}
                  </div>
                ) : isFileMessage(m) ? (
                  <FileMessage key={m.id} msg={m} onDownload={handleDownloadFile} />
                ) : (
                  <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={m.mine ? 'text-right max-w-[80%]' : 'max-w-[80%]'}>
                      <div className="text-xs text-gray-500 mb-1">
                        {m.mine ? 'you' : m.username}
                        <span className="text-gray-700 mx-1">·</span>
                        {new Date(m.timestamp).toLocaleTimeString()}
                      </div>
                      <div
                        className={
                          m.mine
                            ? 'inline-block bg-neon-green text-black px-3 py-2 rounded text-sm break-words'
                            : 'inline-block bg-dark-green text-neon-green border border-dark-green px-3 py-2 rounded text-sm break-words'
                        }
                      >
                        {m.plaintext}
                      </div>
                    </div>
                  </div>
                ),
              )}
              {/* Typing indicator */}
              {typingPeerNames.length > 0 && (
                <div className="text-gray-500 text-xs italic">
                  {typingPeerNames.join(', ')} {typingPeerNames.length === 1 ? 'is' : 'are'} typing&hellip;
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Selected file indicator */}
          {selectedFile && (
            <div className="bg-card-bg border border-dark-green p-2 mb-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neon-green truncate">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{selectedFile.file.name}</span>
                <span className="text-gray-500 shrink-0">
                  {(selectedFile.file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  className="border border-neon-green text-neon-green px-2 py-0.5 hover:bg-neon-green hover:text-black transition"
                  onClick={handleSendFile}
                >
                  SEND FILE
                </button>
                <button
                  className="border border-dark-green text-gray-400 px-2 py-0.5 hover:border-neon-green hover:text-neon-green transition"
                  onClick={() => setSelectedFile(null)}
                >
                  X
                </button>
              </div>
            </div>
          )}

          {/* Input pesan */}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              type="text"
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  finishTyping();
                  handleSendMessage();
                }
              }}
              onBlur={finishTyping}
              placeholder="Type your encrypted message&hellip;"
              className="flex-grow bg-card-bg border border-dark-green text-neon-green p-3 focus:outline-none focus:border-neon-green"
            />
            <button
              className="px-3 py-3 border border-dark-green text-gray-400 hover:border-neon-green hover:text-neon-green transition"
              onClick={() => fileInputRef.current?.click()}
              title="Send a file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
              className="px-4 py-3 border border-neon-green text-neon-green hover:bg-neon-green hover:text-black transition"
              onClick={() => {
                finishTyping();
                handleSendMessage();
              }}
            >
              SEND
            </button>
          </div>

          {status && <div className="mt-3 text-xs text-red-500">{status}</div>}

          <div className="mt-4 text-center">
            <button
              className="px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
              onClick={handleLeaveRoom}
            >
              {'>'} LEAVE ROOM
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── render: terminal utama ──

  return (
    <main className="relative min-h-screen overflow-hidden">
      <MatrixBackground />
      <div className="scanlines fixed inset-0 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex-grow flex flex-col justify-center">
        <Header />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-10 max-w-6xl mx-auto w-full">
          <FeaturePanel
            title="Blind Relay"
            desc="Server handles encrypted blobs only. Message contents are inaccessible."
          />
          <FeaturePanel
            title="Client Encryption"
            desc="Keys generated by browser, encrypted using ECDH and AES-256-GCM."
          />
          <FeaturePanel
            title="Ephemeral"
            desc="Messages stored in RAM, auto-delete after delivery, rooms auto-expire."
          />
        </section>

        <div className="text-center mt-6 space-y-4 max-w-xl mx-auto">
          {/* Username */}
          <div>
            <label className="block text-xs text-gray-500 mb-2 tracking-widest uppercase">
              Your display name (leave blank = Anonymous)
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setUsername(e.target.value.trim() || 'Anonymous');
              }}
              placeholder="Anonymous"
              className="w-full px-4 py-2 bg-card-bg border border-dark-green text-neon-green focus:outline-none focus:border-neon-green text-center"
            />
          </div>

          <button
            className="w-full md:w-auto px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
            onClick={handleCreateRoom}
          >
            {'>'} CREATE SECURE ROOM
          </button>

          <div className="mb-4">
            <input
              type="text"
              value={roomSecretInput}
              onChange={(e) => setRoomSecretInput(e.target.value)}
              placeholder="Paste invite link to join&hellip;"
              className="w-full md:w-64 px-4 py-2 bg-card-bg border border-dark-green text-neon-green focus:outline-none focus:border-neon-green mb-2"
            />
            <button
              className="w-full md:w-auto px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
              onClick={() => handleJoinRoom()}
            >
              {'>'} JOIN SECURE ROOM
            </button>
          </div>

          {fingerprint && (
            <div className="mt-4 text-xs text-gray-500">
              Your fingerprint: {fingerprint.substring(0, 16)}&hellip;
              <span className="text-gray-700 mx-2">|</span>
              key persisted: {keysRestored ? 'yes' : 'new'}
            </div>
          )}

          {status && <div className="text-xs text-red-500">{status}</div>}

          <p className="mt-3 text-xs text-gray-500">
            By proceeding, you acknowledge that while we secure transmission, endpoint security (your device) is your responsibility.
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Note: NullKey does not implement forward secrecy — compromise of a private key may expose past messages.
          </p>
        </div>
      </div>
    </main>
  );
}

// ── QR Code Modal Component ──

function QRCodeModal({ inviteLink, roomSecret, creatorFingerprint, onClose }: {
  inviteLink: string;
  roomSecret: string;
  creatorFingerprint: string;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const QRCode = await import('qrcode/lib/browser');
        const url = await QRCode.toDataURL(inviteLink, {
          width: 200,
          margin: 2,
          color: { dark: '#00ff41', light: '#0a0a0a' },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [inviteLink]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-terminal-bg text-gray-300 font-mono">
      <MatrixBackground />
      <div className="scanlines fixed inset-0 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-20 flex flex-col justify-center items-center min-h-screen">
        <div className="bg-card-bg border border-neon-green p-8 w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full border border-neon-green flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-xl text-neon-green tracking-[0.3em] uppercase mb-2">Secure Room Created</h2>
            <p className="text-xs text-gray-400">
              Share this invitation with the person you want to chat with.
              Only someone with this secret can join.
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="border border-dark-green" width={200} height={200} />
            ) : (
              <div className="w-[200px] h-[200px] border border-dark-green flex items-center justify-center text-gray-600 text-xs">
                generating QR&hellip;
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1 tracking-widest uppercase">Room Secret</label>
            <div className="bg-terminal-bg border border-dark-green p-3 text-neon-green text-xs break-all select-all">
              {roomSecret}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-500 mb-1 tracking-widest uppercase">Invite Link</label>
            <div className="bg-terminal-bg border border-dark-green p-3 text-neon-green text-xs break-all select-all">
              {inviteLink}
            </div>
          </div>

          {creatorFingerprint && (
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-1 tracking-widest uppercase">Your Key Fingerprint</label>
              <div className="bg-terminal-bg border border-dark-green p-3 text-neon-green text-xs break-all select-all">
                {creatorFingerprint}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Share this fingerprint out-of-band so the recipient can verify your identity.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              className="px-6 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
              onClick={async () => {
                try {
                  if (navigator.clipboard) await navigator.clipboard.writeText(inviteLink || roomSecret);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch { /* */ }
              }}
            >
              {copied ? 'COPIED' : 'COPY LINK'}
            </button>
            <button
              className="px-6 py-3 border border-dark-green text-gray-400 text-sm tracking-[0.3em] hover:border-neon-green hover:text-neon-green transition"
              onClick={onClose}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
