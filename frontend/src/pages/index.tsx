import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { SessionManager } from '../crypto/session';
import { WebSocketClient } from '../socket/client';

export default function Home() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [connected, setConnected] = useState(false);
  const sessionManagerRef = useRef<SessionManager | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Initialize cryptographic identity
    const initCrypto = async () => {
      const sessionManager = new SessionManager();
      await sessionManager.initialize();
      sessionManagerRef.current = sessionManager;
      setFingerprint(sessionManager.fingerprint);
    };

    // Initialize WebSocket client
    const wsClient = new WebSocketClient('ws://localhost:8080'); // Default server URL
    wsClientRef.current = wsClient;

    initCrypto();

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!sessionManagerRef.current || !wsClientRef.current) return;

    // Generate a new room secret
    const roomSecret = SessionManager.generateRoomSecret();
    const roomId = await SessionManager.getRoomId(roomSecret);

    // Connect to WebSocket server
    try {
      await wsClientRef.current.connect();
      setConnected(true);

      // Send room creation request
      wsClientRef.current.createRoom(roomId, roomSecret);

      alert(`Room created! Share this secret to invite others: ${roomSecret}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create room. Check console for details.');
    }
  };

  const handleJoinRoom = async () => {
    if (!sessionManagerRef.current || !wsClientRef.current || !roomId) return;

    try {
      // Connect to WebSocket server if not already connected
      if (!connected) {
        await wsClientRef.current.connect();
        setConnected(true);
      }

      // Join the room using the provided room ID/secret
      wsClientRef.current.joinRoom('', roomId); // roomId here refers to the secret
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Check console for details.');
    }
  };

  return (
    <div className="container">
      <Head>
        <title>NullKey - Anonymous Chat</title>
        <meta name="description" content="End-to-end encrypted anonymous chat" />
      </Head>

      <main className="main">
        <h1 className="title">Welcome to NullKey</h1>
        <p className="description">Anonymous, secure, ephemeral chat</p>

        <div className="form-group">
          <label htmlFor="username">Choose a username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="roomId">Room Secret:</label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room secret"
          />
        </div>

        <div className="button-group">
          <button onClick={handleCreateRoom}>Create Room</button>
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>

        {fingerprint && (
          <div className="fingerprint">
            <p>Your cryptographic fingerprint: {fingerprint}</p>
          </div>
        )}

        {connected && (
          <div className="connection-status">
            <p>Connected to server</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>NullKey - Anonymous E2E Encrypted Chat</p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }

        .title,
        .description {
          text-align: center;
        }

        .form-group {
          margin: 1.5rem 0;
          width: 100%;
          max-width: 400px;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }

        .form-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .button-group {
          margin: 2rem 0;
        }

        .button-group button {
          margin: 0 0.5rem;
          padding: 0.75rem 1.5rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .button-group button:hover {
          background-color: #0060d3;
        }

        .fingerprint {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #f0f0f0;
          border-radius: 4px;
          word-break: break-all;
        }

        .connection-status {
          margin-top: 1rem;
          padding: 0.5rem;
          background-color: #d4edda;
          color: #155724;
          border-radius: 4px;
        }

        .footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </div>
  );
}