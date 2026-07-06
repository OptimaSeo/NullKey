/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import type { Peer } from '../types/protocol';

const TYPING_TIMEOUT = 2000;
const INDICATOR_CLEANUP_INTERVAL = 1000;
const INDICATOR_EXPIRY = 3000;

export function useTyping(sendTypingStart: (roomId: string) => void, sendTypingStop: (roomId: string) => void, activeRoomId: string, peers: Peer[]) {
  const [typingPeers, setTypingPeers] = useState<Map<string, number>>(new Map());
  const typingStopTimerRef = useRef<number | null>(null);

  const handleDraftChange = useCallback((value: string) => {
    if (!activeRoomId) return;
    sendTypingStart(activeRoomId);
    if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    typingStopTimerRef.current = window.setTimeout(() => {
      sendTypingStop(activeRoomId);
    }, TYPING_TIMEOUT);
  }, [activeRoomId, sendTypingStart, sendTypingStop]);

  const finishTyping = useCallback(() => {
    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    if (activeRoomId) sendTypingStop(activeRoomId);
  }, [activeRoomId, sendTypingStop]);

  const handleTypingEvent = useCallback((fingerprint: string) => {
    setTypingPeers((prev) => {
      const next = new Map(prev);
      next.set(fingerprint, Date.now());
      return next;
    });
  }, []);

  const handleTypingStopEvent = useCallback((fingerprint: string) => {
    setTypingPeers((prev) => {
      const next = new Map(prev);
      next.delete(fingerprint);
      return next;
    });
  }, []);

  // Auto-cleanup stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - INDICATOR_EXPIRY;
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
    }, INDICATOR_CLEANUP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) clearTimeout(typingStopTimerRef.current);
    };
  }, []);

  const typingPeerNames = Array.from(typingPeers.entries())
    .map(([fp]) => peers.find((p) => p.fingerprint === fp)?.username)
    .filter(Boolean) as string[];

  return { typingPeerNames, handleDraftChange, finishTyping, handleTypingEvent, handleTypingStopEvent };
}
