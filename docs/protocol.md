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
  "room_secret": "rahasia ruangan asli (heksadesimal 256-bit)"
}
```

#### `room:join`
Permintaan untuk bergabung ke ruang obrolan yang sudah ada.

**Payload:**
```json
{
  "room_id": "hash sha256 dari rahasia ruangan",
  "room_secret": "rahasia ruangan asli (heksadesimal 256-bit)"
}
```

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
  "timestamp": 1234567890
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

## Pertimbangan Keamanan

### Kebutaan Server
- Server tidak pernah mendekripsi konten pesan
- Server hanya memproses ciphertext dan metadata routing
- Server tidak dapat mengkorelasikan identitas pengguna dengan konten pesan

### Sifat Sementara
- Ruangan otomatis kedaluwarsa setelah 10 menit tidak aktif
- Pesan otomatis kedaluwarsa setelah 5 menit
- Tidak ada penyimpanan persisten riwayat pesan

### Pembatasan Frekuensi
- Koneksi dibatasi berdasarkan alamat IP
- Frekuensi pesan dibatasi per koneksi
- Pembuatan ruangan dibatasi per jendela waktu

## Catatan Implementasi

### Persyaratan Klien
- Generate pasangan kunci X25519 saat pemuatan awal
- Simpan kunci privat hanya di memori browser
- Hitung sidik jari sebagai hash SHA-256 dari kunci publik
- Enkripsi pesan dengan AES-256-GCM menggunakan rahasia bersama yang diturunkan

### Persyaratan Server
- Validasi format pesan sebelum meneruskan
- Terapkan batas peserta ruangan (maks 10)
- Terapkan pembersihan otomatis ruangan yang kedaluwarsa
- Jaga logging minimal (tanpa konten pengguna)