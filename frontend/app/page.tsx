/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import FeaturePanel from '../components/FeaturePanel';
import MatrixBackground from '../components/MatrixBackground';
import { SessionManager } from '../../src/crypto/session';
import { WebSocketClient } from '../../src/socket/client';

export default function HomePage() {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [connected, setConnected] = useState(false);
  const [showChatInterface, setShowChatInterface] = useState(false);
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
      setShowChatInterface(true);
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
      setShowChatInterface(true);
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room. Check console for details.');
    }
  };

  if (showChatInterface) {
    // Tampilkan antarmuka chat
    return (
      <main className="relative min-h-screen overflow-hidden bg-terminal-bg text-gray-300 font-mono">
        <MatrixBackground />
        <div className="scanlines fixed inset-0 z-0 pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 flex-grow flex flex-col justify-center">
          <div className="text-center mb-10">
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
              Connected to room: {roomId.substring(0, 8)}...
            </h2>
          </div>

          {/* Area chat */}
          <div className="bg-card-bg border border-dark-green p-6 mb-6 h-96 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-gray-400 text-sm">Welcome to NullKey. Your connection is secured.</div>
              <div className="flex justify-start">
                <div className="bg-dark-green text-neon-green px-3 py-2 rounded text-sm">System: Connected securely</div>
              </div>
            </div>
          </div>

          {/* Input pesan */}
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Type your encrypted message..."
              className="flex-grow bg-card-bg border border-dark-green text-neon-green p-3 focus:outline-none focus:border-neon-green"
            />
            <button className="px-4 py-3 border border-neon-green text-neon-green hover:bg-neon-green hover:text-black transition">
              SEND
            </button>
          </div>

          <div className="mt-6 text-center">
            <button 
              className="px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
              onClick={() => setShowChatInterface(false)}
            >
              &gt; RETURN TO TERMINAL
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Tampilkan tampilan terminal utama
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

        <div className="text-center mt-6">
          <button 
            className="w-full md:w-auto px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition mb-4"
            onClick={handleCreateRoom}
          >
            &gt; CREATE SECURE ROOM
          </button>
          
          <div className="mb-4">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter room secret to join..."
              className="w-full md:w-64 px-4 py-2 bg-card-bg border border-dark-green text-neon-green focus:outline-none focus:border-neon-green mb-2"
            />
            <button 
              className="w-full md:w-auto px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
              onClick={handleJoinRoom}
            >
              &gt; JOIN SECURE ROOM
            </button>
          </div>
          
          {fingerprint && (
            <div className="mt-4 text-xs text-gray-500">
              Your fingerprint: {fingerprint.substring(0, 16)}...
            </div>
          )}
          
          <p className="mt-3 text-xs text-gray-500">
            By proceeding, you acknowledge that while we secure transmission, endpoint security (your device) is your responsibility.
          </p>
        </div>
      </div>
    </main>
  );
}