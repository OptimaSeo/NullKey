/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

import { fromHex, fromBase64 } from '../utils/encoding';
import type { ChatMessage } from '../types/protocol';
import type { CryptoService } from './crypto.service';

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export interface SelectedFile {
  file: File;
  data: Uint8Array;
}

export class FileService {
  static validate(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) return 'File too large — maximum 100 MB';
    return null;
  }

  static readFile(file: File): Promise<SelectedFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ file, data: new Uint8Array(reader.result as ArrayBuffer) });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  static async downloadFile(
    msg: ChatMessage,
    activeRoomId: string,
    crypto: CryptoService,
  ): Promise<void> {
    const meta = JSON.parse(msg.plaintext);
    const sharedSecret = crypto.getSharedSecret(msg.fingerprint);
    if (!sharedSecret) throw new Error('No shared secret for this peer');

    const salt = fromHex(activeRoomId);
    const ciphertext = fromBase64(meta.ciphertext);
    const nonce = fromHex(meta.nonce);

    const decrypted = await crypto.decryptFile(ciphertext, nonce, msg.fingerprint, salt);

    if (meta.file_hash) {
      const actualHash = await crypto.computeFileHash(decrypted);
      if (actualHash !== meta.file_hash) {
        throw new Error('File integrity check failed — hash mismatch');
      }
    }

    const blob = new Blob([decrypted.buffer as ArrayBuffer], { type: meta.file_type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
