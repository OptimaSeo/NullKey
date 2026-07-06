/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

import { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import type { ChatMessage } from '../types/protocol';

interface Props {
  activeRoomId: string;
  username: string;
  fingerprint: string;
  connected: boolean;
  peersCount: number;
  messages: ChatMessage[];
  selectedFile: { file: File; data: Uint8Array } | null;
  typingPeerNames: string[];
  isFileMessage: (msg: ChatMessage) => boolean;
  messagesEndRef: React.Ref<HTMLDivElement>;
  fileInputRef: React.Ref<HTMLInputElement>;
  onLeaveRoom: () => void;
  onInvite: () => void;
  onSendMessage: (draft: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendFile: () => void;
  onDownloadFile: (msg: ChatMessage) => void;
  onDraftChange: (value: string) => void;
  onFinishTyping: () => void;
  onClearFile: () => void;
}

export default function ChatPanel({
  activeRoomId,
  username,
  fingerprint,
  connected,
  peersCount,
  messages,
  selectedFile,
  typingPeerNames,
  isFileMessage,
  messagesEndRef,
  fileInputRef,
  onLeaveRoom,
  onInvite,
  onSendMessage,
  onFileSelect,
  onSendFile,
  onDownloadFile,
  onDraftChange,
  onFinishTyping,
  onClearFile,
}: Props) {
  const [draft, setDraft] = useState('');

  const handleDraftChange = (value: string) => {
    setDraft(value);
    onDraftChange(value);
  };

  const handleSend = () => {
    onSendMessage(draft);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onFinishTyping();
      handleSend();
    }
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-10 flex-grow flex flex-col justify-center min-h-screen">
      <div className="text-center mb-4 md:mb-6">
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
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neon-green tracking-[0.35em] mb-3 uppercase">NULLKEY</h1>
        <h2 className="text-lg md:text-xl text-gray-200 mb-6 font-light tracking-wide">
          Connected to room: {activeRoomId.substring(0, 8)}&hellip;
        </h2>
      </div>

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
          <span className="text-gray-500">{peersCount} peer(s)</span>
          <button
            className="px-3 py-1 border border-dark-green text-xs text-neon-green hover:bg-neon-green hover:text-black transition"
            onClick={onInvite}
          >
            invite
          </button>
        </div>
      </div>

      <div className="bg-card-bg border border-dark-green p-6 mb-3 h-96 overflow-y-auto">
        <MessageList
          messages={messages}
          typingPeerNames={typingPeerNames}
          isFileMessage={isFileMessage}
          onDownloadFile={onDownloadFile}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {selectedFile && (
        <div className="bg-card-bg border border-dark-green p-2 mb-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-neon-green truncate">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{selectedFile.file.name}</span>
            <span className="text-gray-500 shrink-0">{(selectedFile.file.size / 1024).toFixed(1)} KB</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              className="border border-neon-green text-neon-green px-2 py-0.5 hover:bg-neon-green hover:text-black transition"
              onClick={onSendFile}
            >
              SEND FILE
            </button>
            <button
              className="border border-dark-green text-gray-400 px-2 py-0.5 hover:border-neon-green hover:text-neon-green transition"
              onClick={onClearFile}
            >
              X
            </button>
          </div>
        </div>
      )}

      <MessageInput
        draft={draft}
        onDraftChange={handleDraftChange}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        onBlur={onFinishTyping}
        onFileButtonClick={() => {
      if (fileInputRef && 'current' in fileInputRef) fileInputRef.current?.click();
    }}
        fileInputRef={fileInputRef}
        onFileSelect={onFileSelect}
      />

      <div className="mt-4 text-center">
        <button
          className="px-8 py-3 border border-neon-green text-neon-green text-sm tracking-[0.3em] hover:bg-neon-green hover:text-black transition"
          onClick={onLeaveRoom}
        >
          {'>'} LEAVE ROOM
        </button>
      </div>
    </div>
  );
}
