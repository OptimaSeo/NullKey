# Desain Kripto NullKey

## Gambaran Umum
NullKey mengimplementasikan enkripsi end-to-end (E2EE) menggunakan primitif kriptografi modern. Semua proses enkripsi/dekripsi terjadi di sisi klien dengan server hanya berfungsi sebagai relay pesan.

## Primitif Kriptografi

### Pertukaran Kunci
- **Algoritma**: X25519 (Diffie-Hellman Kurva Eliptik atas Curve25519)
- **Tujuan**: Membentuk rahasia bersama antar peer
- **Implementasi**: @stablelib/x25519

### Enkripsi Simetris
- **Algoritma**: AES-256-GCM (Standar Enkripsi Lanjutan dengan Mode Galois/Counter)
- **Tujuan**: Mengenkripsi konten pesan
- **Properti**: Enkripsi terotentikasi dengan data terkait (AEAD)
- **Implementasi**: @stablelib/aes-gcm

### Derivasi Kunci
- **Algoritma**: HKDF (Fungsi Derivasi Kunci Ekstraksi-Ekspansi Berbasis HMAC)
- **Tujuan**: Menurunkan kunci sesi dari rahasia bersama
- **Implementasi**: WebCrypto API

### Hashing
- **Algoritma**: SHA-256
- **Tujuan**: Menghasilkan sidik jari dari kunci publik dan ID ruangan dari rahasia
- **Implementasi**: WebCrypto API

## Alur Protokol

### Pembuatan Identitas
1. Klien menghasilkan pasangan kunci X25519 secara lokal
2. Kunci publik di-hash dengan SHA-256 untuk membuat sidik jari
3. Sidik jari berfungsi sebagai identitas kriptografi untuk sesi

### Pembuatan Ruangan
1. Klien menghasilkan rahasia ruangan acak 256-bit
2. ID ruangan dihitung sebagai hash SHA-256 dari rahasia ruangan
3. Hanya ID ruangan (bukan rahasia) yang dikirim ke server
4. Tautan undangan berisi rahasia ruangan (untuk dibagikan di luar jalur)

### Proses Pertukaran Kunci
1. Peer terhubung ke ruangan yang sama menggunakan rahasia ruangan
2. Setiap peer menyiarkan kunci publik mereka ke ruangan melalui server
3. Peer menghitung rahasia bersama menggunakan X25519 dengan kunci privat mereka dan kunci publik peer
4. Rahasia bersama digunakan untuk menurunkan kunci sesi dengan HKDF

### Enkripsi Pesan
1. Setiap pesan mendapatkan nonce acak unik (96 bit untuk AES-GCM)
2. Konten pesan dienkripsi dengan AES-256-GCM menggunakan kunci sesi yang diturunkan
3. Server hanya meneruskan ciphertext, nonce, dan metadata

### Dekripsi Pesan
1. Penerima mengidentifikasi pengirim melalui sidik jari dalam metadata
2. Mengambil rahasia bersama yang sesuai dari sesi
3. Mendekripsi pesan menggunakan AES-256-GCM dengan rahasia bersama dan nonce yang diterima

## Properti Keamanan

### Forward Secrecy
- Kunci sesi diturunkan dari rahasia bersama yang hanya diketahui oleh pihak yang berkomunikasi
- Kompromi salah satu kunci sesi tidak mempengaruhi komunikasi masa lalu atau masa depan

### Minimasi Metadata
- Server tidak pernah melihat pesan teks asli
- Server tidak menyimpan identitas pengguna atau data historis
- Hanya informasi keanggotaan ruangan sementara yang dipelihara

### Otentikasi
- Partisipan mengotentikasi satu sama lain melalui sidik jari kunci publik
- Integritas pesan diverifikasi melalui tag otentikasi AES-GCM