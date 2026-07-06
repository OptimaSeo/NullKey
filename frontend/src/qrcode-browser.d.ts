/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

declare module 'qrcode/lib/browser' {
  import { QRCodeToDataURLOptions } from 'qrcode';
  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
}
