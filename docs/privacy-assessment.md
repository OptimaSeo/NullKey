# NullKey Privacy Assessment & Roadmap

> Catatan audit privasi internal — snapshot perbaikan Agustus 2026.
> Dipakai sebagai dasar roadmap pengembangan selanjutnya.

## Level Privasi: Penilaian Jujur

| Dimensi | Nilai | Alasan |
|---|---|---|
| Kerahasiaan konten | Tinggi (8/10) | AEAD modern; kelemahan: tanpa forward secrecy — private key bocor = semua pesan lama bisa dibuka |
| Privasi metadata | Sedang (5/10) | Nama file kini aman (envelope terenkripsi), tapi pola ukuran/waktu/frequency tetap terbaca |
| Anonimitas | Rendah (3/10) | Tanpa TOR; IP telanjang; fingerprint = pseudonim permanen |
| Autentikasi peer | Sedang (5/10) | Anti-MITM hanya satu arah (joiner→creator); username tak terautentikasi |
| Retensi data | Tinggi (9/10) | Benar-benar zero-storage; log IP di-hash |

**Kesimpulan: ~6/10** — kuat sebagai *confidential chat*, lemah sebagai *anonymous messenger*.

## ⚠️ Vektor Belum Didokumentasikan: Fingerprint Lintas Room

Keypair dipersistenkan di IndexedDB dan **dipakai ulang lintas room**, sehingga
fingerprint yang sama muncul di banyak room. Server yang mengamati dua room
dapat mengorelasikan bahwa pengguna yang sama hadir di keduanya.

Mitigasi kandidat:
- Derive subkey per-room untuk identitas (fingerprint berbeda tiap room), atau
- Regenerasi keypair saat bergabung ke room baru (keypair persisten hanya untuk reconnect room yang sama)

## Roadmap Privasi (prioritas menurun)

1. **Rotasi kunci per-room** — tutup vektor korelasi lintas room di atas.
2. **Forward secrecy** — rotasi kunci sesi berkala atau Double Ratchet ringan;
   minimal re-key saat peer reconnect.
3. **Verifikasi MITM dua arah** — kanal OOB untuk fingerprint invitee
   (mis. QR dua arah), agar inviter juga bisa memverifikasi invitee.
4. **Username terautentikasi** — tanda tangani username dengan private key
   dan verifikasi di penerima, cegah spoofing display name.
5. **Padding ukuran pesan / cover traffic** — kurangi kebocoran pola ukuran
   dan timing (bagian dari threat-model "Not Yet Implemented").
6. **Opsi transport anonim** — dukungan SOCKS5/TOR proxy untuk koneksi WS.
