/**
 * WebSocket client for NullKey
 */

export interface MessagePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_username: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
}

export interface KeyExchangePayload {
  room_id: string;
  sender_fingerprint: string;
  sender_public_key: string;
  sender_username: string;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(serverUrl: string) {
    this.url = serverUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('Connected to server');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Disconnected from server');
      };
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(event: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(callback: (event: string, payload: any) => void): void {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        callback(data.event, data.payload);
      };
    }
  }

  onError(callback: (error: Event) => void): void {
    if (this.ws) {
      this.ws.onerror = callback;
    }
  }

  onClose(callback: (event: CloseEvent) => void): void {
    if (this.ws) {
      this.ws.onclose = callback;
    }
  }

  // Specific methods for NullKey events
  createRoom(roomId: string, roomSecret: string): void {
    this.sendMessage('room:create', { room_id: roomId, room_secret: roomSecret });
  }

  joinRoom(roomId: string, roomSecret: string): void {
    this.sendMessage('room:join', { room_id: roomId, room_secret: roomSecret });
  }

  sendKeyExchange(payload: KeyExchangePayload): void {
    this.sendMessage('key:exchange', payload);
  }

  sendMessageToRoom(payload: MessagePayload): void {
    this.sendMessage('message:send', payload);
  }
}