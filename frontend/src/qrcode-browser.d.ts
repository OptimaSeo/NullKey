declare module 'qrcode/lib/browser' {
  import { QRCodeToDataURLOptions } from 'qrcode';
  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
}
