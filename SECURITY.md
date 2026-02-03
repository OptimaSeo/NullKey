# Kebijakan Keamanan NullKey

## Perlindungan Data Pengguna

NullKey dirancang dengan prinsip privasi dan keamanan sebagai prioritas utama. Kami menerapkan berbagai langkah untuk melindungi data pengguna dan menjaga anonimitas komunikasi.

## Fitur Keamanan Utama

### Enkripsi End-to-End
- Semua pesan dienkripsi secara end-to-end menggunakan X25519 dan AES-256-GCM
- Server tidak pernah memiliki akses ke teks asli pesan
- Kunci privat hanya disimpan di sisi klien

### Anonimitas
- Tidak ada persyaratan akun atau identitas permanen
- Nama pengguna tidak unik dan tidak digunakan untuk otentikasi
- Sidik jari kriptografi digunakan sebagai identitas sementara

### Sifat Sementara
- Pesan otomatis dihapus setelah jangka waktu tertentu
- Ruangan otomatis ditutup setelah periode ketidaktahuan
- Tidak ada riwayat pesan yang disimpan secara persisten

## Praktik Keamanan Terbaik untuk Pengguna

### Saat Menggunakan Aplikasi
- Gunakan koneksi jaringan yang aman
- Jangan bagikan rahasia ruangan ke pihak yang tidak dipercaya
- Periksa sidik jari kriptografi untuk memverifikasi identitas peserta
- Gunakan nama pengguna yang tidak dapat diidentifikasi

### Perlindungan Perangkat
- Pastikan perangkat Anda tidak terinfeksi malware
- Gunakan perangkat lunak keamanan yang terbaru
- Lindungi perangkat Anda dengan kata sandi atau metode otentikasi lainnya

## Laporan Kerentanan

Jika Anda menemukan kerentanan keamanan dalam NullKey, silakan laporkan secara bertanggung jawab:

- Kirim detail kerentanan ke [alamat email keamanan]
- Berikan waktu bagi kami untuk menanggapi dan memperbaiki masalah sebelum mengungkapkan publik
- Jangan mengeksploitasi kerentanan yang ditemukan

## Lisensi dan Hak Cipta

NullKey dilisensikan di bawah GNU Affero General Public License v3 (AGPL-3.0).
Hak cipta © 2026 OptimaSeo. Seluruh hak dilindungi.
Untuk lisensi komersial, silakan hubungi: <nullkey@optimaseo.id>

## Batasan Keamanan

Meskipun kami berusaha keras untuk menjaga keamanan, perlu dicatat bahwa NullKey memiliki beberapa batasan:

- Tidak melindungi dari kompromi perangkat klien
- Tidak melindungi dari analisis lalu lintas tingkat ISP
- Tidak melindungi dari rekayasa sosial atau paksaan

## Audit Keamanan

Kode NullKey tersedia untuk audit publik. Kami mendorong komunitas keamanan untuk meninjau implementasi kami dan memberikan umpan balik konstruktif.