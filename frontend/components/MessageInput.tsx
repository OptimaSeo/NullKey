/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

'use client';

interface Props {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onFileButtonClick: () => void;
  fileInputRef: React.Ref<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function MessageInput({
  draft,
  onDraftChange,
  onSend,
  onKeyDown,
  onBlur,
  onFileButtonClick,
  fileInputRef,
  onFileSelect,
}: Props) {
  return (
    <div className="flex gap-2">
      <input type="file" ref={fileInputRef} onChange={onFileSelect} className="hidden" />
      <input
        type="text"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder="Type your encrypted message&hellip;"
        className="flex-grow bg-card-bg border border-dark-green text-neon-green p-3 focus:outline-none focus:border-neon-green"
      />
      <button
        className="px-3 py-3 border border-dark-green text-gray-400 hover:border-neon-green hover:text-neon-green transition"
        onClick={onFileButtonClick}
        title="Send a file"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
      <button
        className="px-4 py-3 border border-neon-green text-neon-green hover:bg-neon-green hover:text-black transition"
        onClick={onSend}
      >
        SEND
      </button>
    </div>
  );
}
