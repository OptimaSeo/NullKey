import { ClientConnection } from '../ws/handler';

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

  constructor(id: string) {
    this.id = id;
    this.clients = [];
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  addClient(client: ClientConnection): boolean {
    // Limit to 10 clients per room as per MVP spec
    if (this.clients.length >= 10) {
      return false;
    }
    
    // Check if client is already in the room
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

  isExpired(maxIdleTime: number = 10 * 60 * 1000): boolean { // 10 minutes default
    return Date.now() - this.lastActivity > maxIdleTime;
  }
}