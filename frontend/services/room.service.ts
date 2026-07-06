/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import type { InviteData } from '../types/protocol';

export class RoomService {
  static getInviteLink(roomSecret: string, inviteToken: string, fingerprint: string): string {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}#/s=${roomSecret}&t=${inviteToken}&k=${fingerprint}`;
  }

  static parseInviteFromHash(): InviteData | null {
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

  static parseInviteFromInput(input: string): InviteData | null {
    if (input.includes('#/s=')) {
      try {
        const url = new URL(input);
        window.location.hash = url.hash;
        return RoomService.parseInviteFromHash();
      } catch {
        return null;
      }
    }
    return null;
  }

  static clearHash(): void {
    if (typeof window !== 'undefined' && window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
}
