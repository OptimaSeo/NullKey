# NullKey - Chat Terenkripsi End-to-End Anonim

NullKey adalah aplikasi chat anonim dengan enkripsi end-to-end (E2EE) berbasis web. Aplikasi ini dirancang untuk menjaga privasi pengguna dengan meminimalkan metadata dan tidak menyimpan informasi identitas pengguna.

## Fitur Utama (MVP)

- Chat 1-ke-1 dan grup kecil (maksimal 10 peserta per ruangan)
- Tanpa email atau nomor HP
- Enkripsi End-to-End (E2EE) menggunakan X25519 dan AES-256-GCM
- Ruangan berbasis rahasia
- Pesan otomatis terhapus (sementara)
- Server tidak bisa membaca isi chat
- Nama pengguna tanpa identifikasi untuk kejelasan percakapan

## Arsitektur

### Klien (Browser)
- Generate pasangan kunci secara lokal
- Enkripsi & dekripsi sepenuhnya di klien
- Tidak mengirim data identitas nyata
- Nama pengguna hanya untuk UI, bukan identitas kriptografi

### Server
- Relay WebSocket
- Tidak menyimpan plaintext
- Antrian pesan berbasis TTL
- Tanpa autentikasi tradisional
- Tanpa akun dan basis data pengguna

## Teknologi yang Digunakan

### Frontend
- Next.js (CSR saja untuk MVP)
- WebCrypto API
- IndexedDB (penyimpanan kunci lokal)

### Backend
- Node.js
- WebSocket (ws)
- Redis (antrian pesan TTL)

### Kriptografi
- X25519 (pertukaran kunci)
- AES-256-GCM (enkripsi pesan)
- HKDF (derivasi kunci)

## Instalasi

1. Clone repositori
2. Install dependensi:
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```
3. Jalankan server:
   ```bash
   cd backend
   npm run dev
   ```
4. Jalankan klien:
   ```bash
   cd frontend
   npm run dev
   ```

## Cara Kerja

1. Pengguna membuka aplikasi dan memilih nama pengguna
2. Klien mengenerate pasangan kunci X25519 secara lokal
3. Untuk membuat ruangan:
   - Klien generate room_secret (acak 256-bit)
   - room_id = hash(room_secret)
   - Hanya room_id dikirim ke server
4. Untuk bergabung ruangan:
   - Pengguna lain menggunakan room_secret yang dibagikan
   - Server hanya mengetahui room_id, bukan room_secret
5. Proses tangan E2EE:
   - Klien saling bertukar kunci publik (melalui server)
   - Mendapatkan rahasia bersama menggunakan X25519
   - Mendapatkan kunci sesi menggunakan HKDF
6. Semua pesan:
   - Dienkripsi dengan AES-256-GCM
   - Menggunakan nonce acak unik per pesan

## Perlindungan & Batasan

### Dilindungi dari
- Admin server yang penasaran
- Kebocoran basis data
- Pemantauan jaringan pasif
- Pengguna anonim satu sama lain di luar ruangan

### Tidak dilindungi dari
- Perangkat klien yang dikompromikan
- Korrelasi lalu lintas tingkat ISP
- Rekayasa sosial
- Perekaman layar / pengintaian meja

## Kontribusi

Kontribusi sangat dipersilakan. Silakan buat issue atau pull request untuk perbaikan fitur atau keamanan.

## Lisensi

Lisensi terlampir dalam file LICENSE.