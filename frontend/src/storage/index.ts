/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 */

/**
 * IndexedDB-backed key persistence.
 * Allows the user's keypair to survive page reloads.
 * Keys are stored as hex strings for portability.
 */

const DB_NAME = 'NullKey';
const DB_VERSION = 1;
const STORE_NAME = 'session';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function bufToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

function hexToBuf(hex: string): Uint8Array {
  const len = hex.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

export interface StoredKeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export async function saveKeyPair(kp: StoredKeyPair): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(bufToHex(kp.privateKey), 'privateKey');
    store.put(bufToHex(kp.publicKey), 'publicKey');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadKeyPair(): Promise<StoredKeyPair | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const privP = new Promise<string | undefined>((resolve, reject) => {
    const req = store.get('privateKey');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const pubP = new Promise<string | undefined>((resolve, reject) => {
    const req = store.get('publicKey');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const [privHex, pubHex] = await Promise.all([privP, pubP]);
  db.close();

  if (!privHex || !pubHex) return null;

  return {
    privateKey: hexToBuf(privHex),
    publicKey: hexToBuf(pubHex),
  };
}

export async function clearKeyPair(): Promise<void> {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('privateKey');
    store.delete('publicKey');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
