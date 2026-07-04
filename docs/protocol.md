# Spesifikasi Protokol NullKey

## Gambaran Umum
Dokumen ini menentukan protokol komunikasi antara klien dan server NullKey. Protokol ini dirancang untuk pesan terenkripsi end-to-end anonim dengan paparan metadata minimal.

## Lapisan Transportasi
- **Protokol**: WebSocket (ws:// atau wss://)
- **Format Pesan**: JSON melalui frame WebSocket

## Struktur Pesan
Semua pesan mengikuti struktur ini:
```json
{
  "event": "nama_peristiwa",
  "payload": { /* data spesifik peristiwa */ }
}
```

## Peristiwa

### Peristiwa Klien-ke-Server

#### `room:create`
Permintaan untuk membuat ruang obrolan baru.

**Payload:**
```json
{
  "room_id": "hash sha256 dari rahasia ruangan",
  "invite_token": "token undangan satu kali (heksadesimal 256-bit)"
}
```

Catatan: `room_secret` tidak pernah dikirim ke server. Hanya `invite_token` yang dikirim; `room_secret` tetap di klien dan digunakan sebagai salt HKDF.

#### `room:join`
Permintaan untuk bergabung ke ruang obrolan yang sudah ada.

**Payload:**
```json
{
  "room_id": "hash sha256 dari rahasia ruangan",
  "invite_token": "token undangan satu kali (heksadesimal 256-bit)"
}
```

Catatan: Token undangan diverifikasi dan dikonsumsi (satu kali pakai) oleh server. Server tidak pernah mengetahui `room_secret`.

#### `key:exchange`
Menukar kunci publik dengan peserta lain di ruangan.

**Payload:**
```json
{
  "room_id": "identifier ruangan",
  "sender_fingerprint": "hash sha256 dari kunci publik pengirim",
  "sender_public_key": "kunci publik untuk pertukaran kunci (terenkoding base64)",
  "sender_username": "nama tampilan yang dipilih pengguna"
}
```

#### `message:send`
Mengirim pesan terenkripsi ke ruangan.

**Payload:**
```json
{
  "room_id": "identifier ruangan",
  "sender_fingerprint": "hash sha256 dari kunci publik pengirim",
  "sender_username": "nama tampilan pengirim",
  "ciphertext": "konten pesan terenkripsi (terenkoding heksadesimal)",
  "nonce": "nonce yang digunakan untuk enkripsi (terenkoding heksadesimal)",
  "timestamp": 1234567890,
  "message_type": "text|file (opsional)",
  "file_size": 12345 (opsional, wajib jika message_type=file)
}
```

#### `typing:start`
Mengirim indikator bahwa pengirim sedang mengetik.

**Payload:**
```json
{
  "room_id": "identifier ruangan"
}
```

#### `typing:stop`
Mengirim indikator bahwa pengirim berhenti mengetik.

**Payload:**
```json
{
  "room_id": "identifier ruangan"
}
```

### Peristiwa Server-ke-Klien

#### `success`
Menunjukkan pemrosesan permintaan berhasil.

**Payload:**
```json
{
  "message": "deskripsi operasi yang berhasil"
}
```

#### `error`
Menunjukkan kesalahan terjadi saat pemrosesan permintaan.

**Payload:**
```json
{
  "message": "deskripsi kesalahan"
}
```

#### `key:exchange`
Kunci publik yang diteruskan dari peserta lain.

**Payload:**
```json
{
  "room_id": "identifier ruangan",
  "sender_fingerprint": "hash sha256 dari kunci publik pengirim",
  "sender_public_key": "kunci publik untuk pertukaran kunci (terenkoding base64)",
  "sender_username": "nama tampilan pengirim"
}
```

#### `message:receive`
Pesan terenkripsi yang diteruskan dari peserta lain.

**Payload:**
```json
{
  "room_id": "identifier ruangan",
  "sender_fingerprint": "hash sha256 dari kunci publik pengirim",
  "sender_username": "nama tampilan pengirim",
  "ciphertext": "konten pesan terenkripsi (terenkoding heksadesimal)",
  "nonce": "nonce yang digunakan untuk enkripsi (terenkoding heksadesimal)",
  "timestamp": 1234567890
}
```

#### `client:joined`
Notifikasi bahwa klien telah bergabung ke ruangan.

**Payload:**
```json
{
  "fingerprint": "sidik jari dari klien yang bergabung",
  "username": "nama pengguna dari klien yang bergabung"
}
```

#### `client:left`
Notifikasi bahwa klien telah meninggalkan ruangan.

**Payload:**
```json
{
  "fingerprint": "sidik jari dari klien yang pergi",
  "username": "nama pengguna dari klien yang pergi"
}
```

#### `typing:start`
Diteruskan dari pengirim ke peserta lain di ruangan.

**Payload:**
```json
{
  "fingerprint": "sidik jari pengirim",
  "username": "nama pengguna pengirim"
}
```

#### `typing:stop`
Diteruskan dari pengirim ke peserta lain di ruangan.

**Payload:**
```json
{
  "fingerprint": "sidik jari pengirim",
  "username": "nama pengguna pengirim"
}
```

## Pertimbangan Keamanan

### Kebutaan Server
- Server tidak pernah mendekripsi konten pesan
- Server hanya memproses ciphertext dan metadata routing
- Server tidak pernah menerima `room_secret` — hanya `invite_token` sekali pakai
- Server tidak dapat mengkorelasikan identitas pengguna dengan konten pesan

### Otentikasi Kunci Publik (Pencegahan MITM)
- Sidik jari SHA-256 dari kunci publik disematkan dalam tautan undangan
- Setelah pertukaran kunci, klien memverifikasi sidik jari yang diterima dengan yang ada di tautan
- Jika tidak cocok, koneksi ditolak dengan peringatan keamanan
- Keamanan bergantung pada kerahasiaan saluran undangan (di luar jalur)

### Sifat Sementara
- Ruangan otomatis kedaluwarsa setelah 10 menit tidak aktif
- Pesan otomatis kedaluwarsa setelah 5 menit
- Tidak ada penyimpanan persisten riwayat pesan

### Pembatasan Frekuensi
- Koneksi dibatasi berdasarkan alamat IP (`RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MS`)
- Maksimum koneksi per IP: `RATE_LIMIT_MAX_CONNECTIONS_PER_IP`
- Pesan dibatasi per sidik jari: `RATE_LIMIT_MESSAGES_PER_WINDOW` per `RATE_LIMIT_MESSAGES_WINDOW_MS`
- Klien yang melanggar berulang kali akan diputus (setelah `MAX_VIOLATIONS_BEFORE_DISCONNECT`)
- Validasi ukuran file server: `MAX_FILE_SIZE_BYTES`

### Validasi Asal
- Koneksi WebSocket divalidasi terhadap `ALLOWED_ORIGINS` menggunakan perbandingan hostname yang tepat
- Mencegah pembajakan WebSocket lintas situs

### Perlindungan Pemutaran Ulang
- Nonce pesan dilacak per sidik jari dalam jendela TTL
- Pesan duplikat (nonce yang sama, sidik jari yang sama) ditolak

## Catatan Implementasi

### Persyaratan Klien
- Generate pasangan kunci X25519 saat pemuatan awal
- Kunci privat disimpan di IndexedDB untuk bertahan dari penyegaran halaman
- Hitung sidik jari sebagai hash SHA-256 dari kunci publik
- Enkripsi pesan dengan AES-256-GCM menggunakan rahasia bersama yang diturunkan

### Persyaratan Server
- Validasi format pesan sebelum meneruskan
- Validasi asal (origin) koneksi WebSocket
- Pembatasan frekuensi per IP dan per sidik jari
- Validasi ukuran payload dan file
- Perlindungan pemutaran ulang (nonce tracking)
- Putuskan klien yang melanggar aturan secara berulang
- Terapkan batas peserta ruangan (maks 10)
- Terapkan pembersihan otomatis ruangan yang kedaluwarsa
- Header keamanan HTTP (CSP, X-Frame-Options, dll)
- Jaga logging minimal (tanpa konten pengguna)