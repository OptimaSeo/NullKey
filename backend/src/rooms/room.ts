/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { ClientConnection } from '../ws/handler';
import { config } from '../config';

export interface Room {
  id: string;
  clients: ClientConnection[];
  createdAt: number;
  lastActivity: number;
}

export class RoomModel {
  id: string;
  clients: ClientConnection[];
  createdAt: number;
  lastActivity: number;
  private maxParticipants: number;

  constructor(id: string, maxParticipants?: number) {
    this.id = id;
    this.clients = [];
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.maxParticipants = maxParticipants ?? config.maxParticipantsPerRoom;
  }

  addClient(client: ClientConnection): boolean {
    if (this.clients.length >= this.maxParticipants) {
      return false;
    }
    
    if (this.clients.some(c => c.ws === client.ws)) {
      return false;
    }
    
    this.clients.push(client);
    this.updateLastActivity();
    return true;
  }

  removeClient(client: ClientConnection): boolean {
    const initialLength = this.clients.length;
    this.clients = this.clients.filter(c => c.ws !== client.ws);
    
    if (this.clients.length !== initialLength) {
      this.updateLastActivity();
      return true;
    }
    
    return false;
  }

  getClientCount(): number {
    return this.clients.length;
  }

  isEmpty(): boolean {
    return this.clients.length === 0;
  }

  updateLastActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * A room expires when EITHER the idle timeout is exceeded since the last
   * activity OR its absolute lifetime (since creation) is exhausted.
   */
  isExpired(maxIdleTime?: number, maxLifetime?: number): boolean {
    const idle = maxIdleTime ?? config.roomIdleTimeoutMinutes * 60 * 1000;
    const lifetime = maxLifetime ?? config.maxRoomLifetimeMinutes * 60 * 1000;
    if (Date.now() - this.createdAt > lifetime) {
      return true;
    }
    return Date.now() - this.lastActivity > idle;
  }
}