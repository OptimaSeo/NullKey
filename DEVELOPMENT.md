# Panduan Pengembangan NullKey

## Prasyarat

- Node.js (v16 atau lebih tinggi)
- npm atau yarn
- Redis (opsional, untuk fitur lanjutan)

## Setup

1. Clone repositori:
   ```bash
   git clone https://github.com/OptimaSeo/NullKey.git
   cd NullKey
   ```

2. Install dependensi untuk backend:
   ```bash
   cd backend
   npm install
   ```

3. Install dependensi untuk frontend:
   ```bash
   cd ../frontend
   npm install
   ```

## Menjalankan Aplikasi

### Server Backend

1. Navigasi ke direktori backend:
   ```bash
   cd backend
   ```

2. Jalankan dalam mode pengembangan:
   ```bash
   npm run dev
   ```

   Atau build dan jalankan:
   ```bash
   npm run build
   npm start
   ```

Server akan berjalan pada `http://localhost:8080` secara default.

### Klien Frontend

1. Navigasi ke direktori frontend:
   ```bash
   cd frontend
   ```

2. Jalankan dalam mode pengembangan:
   ```bash
   npm run dev
   ```

Klien akan berjalan pada `http://localhost:3000` secara default.

## Konfigurasi

Salin template variabel lingkungan:
```bash
cp .env.example .env
```

Kemudian ubah nilai-nilai sesuai kebutuhan.

## Gambaran Arsitektur

### Frontend (Next.js)
- Halaman-halaman di `app/` (App Router)
- Fungsi kripto di `src/crypto/`
- Klien WebSocket di `src/socket/`
- Komponen UI di `components/`

### Backend (Node.js + WebSocket)
- Server utama di `src/server.ts`
- Penanganan WebSocket di `src/ws/`
- Manajemen ruangan di `src/rooms/`
- Relay pesan di `src/relay/`
- Pembersihan TTL di `src/ttl/`

## Implementasi Fitur Utama

### Enkripsi End-to-End
Diimplementasikan di `frontend/src/crypto/` menggunakan:
- X25519 untuk pertukaran kunci
- AES-256-GCM untuk enkripsi pesan
- Generasi dan penyimpanan kunci di sisi klien

### Manajemen Ruangan
Ditangani di `backend/src/rooms/` dengan:
- Pembuatan/bergabung ruangan berbasis rahasia
- Batas peserta (maks 10 per ruangan)
- Pembersihan otomatis setelah tidak aktif

### Relay Pesan
Dikelola di `backend/src/relay/` dengan:
- Server hanya berfungsi sebagai penerus pesan
- Tidak ada penyimpanan plaintext di server
- Komunikasi real-time berbasis WebSocket

## Pertimbangan Keamanan

- Kunci privat dihasilkan dan disimpan hanya di sisi klien
- Server tidak pernah memiliki akses ke pesan plaintext
- Rahasia ruangan tidak disimpan di server
- Kedaluwarsa otomatis ruangan dan pesan
- Pembatasan frekuensi untuk mencegah penyalahgunaan

## Pengujian

Jalankan tes backend:
```bash
cd backend
npm test
```

Jalankan tes frontend:
```bash
cd frontend
npm test
```

## Pembuatan untuk Produksi

### Backend
```bash
cd backend
npm run build
```

### Frontend
```bash
cd frontend
npm run build
```

## Deployment

1. Build frontend dan backend
2. Deploy backend ke layanan hosting Node.js
3. Sajikan file-file build frontend melalui server file statis atau CDN
4. Konfigurasikan proxy WebSocket jika menggunakan reverse proxy

## Pemecahan Masalah

### Masalah Umum
- Pastikan klien dan server berjalan saat pengujian
- Periksa URL koneksi WebSocket jika klien tidak bisa terhubung ke server
- Verifikasi pembatasan frekuensi jika mengalami masalah koneksi

### Tips Debugging
- Aktifkan logging verbose dalam pengembangan
- Periksa konsol browser untuk kesalahan sisi klien
- Pantau log server untuk masalah koneksi