# Arsitektur NullKey

## Gambaran Umum
NullKey adalah aplikasi chat anonim dengan enkripsi end-to-end yang dirancang dengan prinsip privasi terlebih dahulu. Arsitektur ini mengikuti pendekatan metadata minimal tanpa akun pengguna yang persisten.

## Komponen

### Klien (Frontend)
- **Framework**: Next.js (App Router dengan Rendering Sisi Klien untuk MVP)
- **Perpustakaan Kripto**: WebCrypto API, implementasi @stablelib
- **Penyimpanan**: IndexedDB untuk penyimpanan kunci lokal
- **Komunikasi**: Koneksi WebSocket ke backend

### Server (Backend)
- **Runtime**: Node.js
- **Protokol**: Relay WebSocket
- **Penyimpanan Pesan**: Dalam memori dengan TTL (time-to-live)
- **Tanpa Penyimpanan Persisten**: Tidak ada akun pengguna atau riwayat pesan yang disimpan

## Alur Data

1. Klien menghasilkan pasangan kunci X25519 secara lokal (disimpan di IndexedDB)
2. Ruangan dibuat dengan `room_secret` (salt HKDF) + `invite_token` (untuk server)
3. Hanya `invite_token` yang dikirim ke server; `room_secret` tetap di klien
4. Tautan undangan berisi `room_secret` + `invite_token` + sidik jari pengirim
5. Pesan dienkripsi end-to-end (server tidak pernah melihat teks asli)
6. Semua data bersifat sementara dengan pembersihan otomatis

## Model Keamanan

- Server nol-pengetahuan (tidak dapat membaca pesan, tidak pernah melihat `room_secret`)
- Tidak adanya sistem akun mengurangi permukaan serangan
- Identitas kriptografi dihasilkan dan disimpan di sisi klien
- Otentikasi kunci publik via sidik jari dalam tautan undangan (pencegahan MITM)
- Pembatasan frekuensi per IP dan per sidik jari
- Validasi asal koneksi WebSocket (perbandingan hostname)
- Perlindungan pemutaran ulang (nonce tracking)
- Header keamanan HTTP (CSP, X-Frame-Options, dll)
- Klien abusive diputus setelah pelanggaran berulang
- Kedaluwarsa otomatis ruangan dan pesan