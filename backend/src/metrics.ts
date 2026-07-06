/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

export const metrics = {
  startTime: Date.now(),
  connectionCounts: new Map<string, number>(),

  addConnection(ip: string): void {
    this.connectionCounts.set(ip, (this.connectionCounts.get(ip) || 0) + 1);
  },

  removeConnection(ip: string): void {
    const count = this.connectionCounts.get(ip) || 0;
    if (count <= 1) {
      this.connectionCounts.delete(ip);
    } else {
      this.connectionCounts.set(ip, count - 1);
    }
  },

  connectionCount(): number {
    let total = 0;
    for (const c of this.connectionCounts.values()) total += c;
    return total;
  },

  uptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  },
};
