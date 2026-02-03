# Arsitektur NullKey

## Gambaran Umum
NullKey adalah aplikasi chat anonim dengan enkripsi end-to-end yang dirancang dengan prinsip privasi terlebih dahulu. Arsitektur ini mengikuti pendekatan metadata minimal tanpa akun pengguna yang persisten.

## Komponen

### Klien (Frontend)
- **Framework**: Next.js (Rendering Sisi Klien untuk MVP)
- **Perpustakaan Kripto**: WebCrypto API, implementasi @stablelib
- **Penyimpanan**: IndexedDB untuk penyimpanan kunci lokal
- **Komunikasi**: Koneksi WebSocket ke backend

### Server (Backend)
- **Runtime**: Node.js
- **Protokol**: Relay WebSocket
- **Penyimpanan Pesan**: Dalam memori dengan TTL (time-to-live)
- **Tanpa Penyimpanan Persisten**: Tidak ada akun pengguna atau riwayat pesan yang disimpan

## Alur Data

1. Klien menghasilkan pasangan kunci X25519 secara lokal
2. Ruangan dibuat menggunakan akses berbasis rahasia (tidak disimpan di server)
3. Pesan dienkripsi end-to-end (server tidak pernah melihat teks asli)
4. Semua data bersifat sementara dengan pembersihan otomatis

## Model Keamanan

- Server nol-pengetahuan (tidak dapat membaca pesan)
- Tidak adanya sistem akun mengurangi permukaan serangan
- Identitas kriptografi dihasilkan di sisi klien
- Kedaluwarsa otomatis ruangan dan pesan