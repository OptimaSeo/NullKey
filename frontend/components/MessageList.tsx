/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

import type { ChatMessage } from '../types/protocol';

interface Props {
  messages: ChatMessage[];
  typingPeerNames: string[];
  isFileMessage: (msg: ChatMessage) => boolean;
  onDownloadFile: (msg: ChatMessage) => void;
  messagesEndRef: React.Ref<HTMLDivElement>;
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

export default function MessageList({ messages, typingPeerNames, isFileMessage, onDownloadFile, messagesEndRef }: Props) {
  return (
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
          <FileMessage key={m.id} msg={m} onDownload={onDownloadFile} />
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
      {typingPeerNames.length > 0 && (
        <div className="text-gray-500 text-xs italic">
          {typingPeerNames.join(', ')} {typingPeerNames.length === 1 ? 'is' : 'are'} typing&hellip;
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
