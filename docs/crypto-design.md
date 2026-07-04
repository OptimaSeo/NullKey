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
- **Implementasi**: WebCrypto API (crypto.subtle.encrypt/decrypt)

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
3. Klien juga menghasilkan token undangan satu kali yang acak
4. Hanya ID ruangan + token undangan yang dikirim ke server (rahasia ruangan tidak pernah dikirim)
5. Server menyimpan token undangan per ruangan untuk validasi join
6. Tautan undangan berisi rahasia ruangan + token undangan + sidik jari pengirim (dibagikan di luar jalur)

### Proses Pertukaran Kunci
1. Peer menerima tautan undangan yang berisi rahasia ruangan + token + sidik jari yang diharapkan
2. Peer terhubung ke ruangan menggunakan token undangan (bukan rahasia ruangan)
3. Setiap peer menyiarkan kunci publik mereka ke ruangan melalui server
4. Peer menghitung rahasia bersama menggunakan X25519 dengan kunci privat mereka dan kunci publik peer
5. Peer menerima notifikasi server: `key:exchange` berisi kunci publik + sidik jari peer lain
6. Sidik jari yang diterima dari server dicocokkan dengan sidik jari dari tautan undangan
7. Jika sidik jari tidak cocok, koneksi ditolak — ini adalah satu-satunya perlindungan terhadap MITM
8. Rahasia bersama digunakan untuk menurunkan kunci sesi dengan HKDF

### Enkripsi Pesan
1. Setiap pesan mendapatkan nonce acak unik (96 bit untuk AES-GCM)
2. Konten pesan dienkripsi dengan AES-256-GCM menggunakan kunci sesi yang diturunkan
3. Server hanya meneruskan ciphertext, nonce, dan metadata

### Dekripsi Pesan
1. Penerima mengidentifikasi pengirim melalui sidik jari dalam metadata
2. Mengambil rahasia bersama yang sesuai dari sesi
3. Mendekripsi pesan menggunakan AES-256-GCM dengan rahasia bersama dan nonce yang diterima

## Properti Keamanan

### Keterbatasan: Tidak Ada Forward Secrecy
- Kunci sesi diturunkan langsung dari rahasia bersama X25519 menggunakan HKDF
- Tidak ada mekanisme rotasi kunci atau ratchet (seperti Signal Protocol)
- Jika kunci privat jangka panjang salah satu pihak disusupi, semua pesan masa lalu dapat didekripsi
- Ini adalah batasan desain yang disadari — NullKey mengutamakan kesederhanaan dibanding FS

### Minimasi Metadata
- Server tidak pernah melihat pesan teks asli atau rahasia ruangan
- Server hanya menyimpan ID ruangan, token undangan satu kali, dan keanggotaan sementara
- Server tidak menyimpan identitas pengguna atau data historis

### Otentikasi dan Pencegahan MITM
- Sidik jari kunci publik disematkan dalam tautan undangan bersama rahasia ruangan
- Partisipan memverifikasi sidik jari peer setelah pertukaran kunci
- Jika sidik jari tidak cocok, koneksi ditolak dan peringatan ditampilkan ke pengguna
- Keamanan bergantung pada kerahasiaan jalur undangan (dibagikan di luar jalur)
- Integritas pesan diverifikasi melalui tag otentikasi AES-GCM