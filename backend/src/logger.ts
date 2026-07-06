/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

export const logger = {
  info(msg: string, meta?: Record<string, unknown>): void {
    const entry: Record<string, unknown> = { level: 'info', msg, ts: Date.now() };
    if (meta) Object.assign(entry, meta);
    console.log(JSON.stringify(entry));
  },
  warn(msg: string, meta?: Record<string, unknown>): void {
    const entry: Record<string, unknown> = { level: 'warn', msg, ts: Date.now() };
    if (meta) Object.assign(entry, meta);
    console.warn(JSON.stringify(entry));
  },
  error(msg: string, meta?: Record<string, unknown>): void {
    const entry: Record<string, unknown> = { level: 'error', msg, ts: Date.now() };
    if (meta) Object.assign(entry, meta);
    console.error(JSON.stringify(entry));
  },
};
