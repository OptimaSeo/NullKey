# Model Ancaman NullKey

## Gambaran Umum
Dokumen ini menguraikan model ancaman untuk NullKey, merinci asumsi keamanan, ancaman yang dicegah, dan ancaman yang diakui tetapi tidak dipertahankan.

## Tujuan Keamanan

### Tujuan Utama
- **Anonimitas**: Mencegah korelasi identitas pengguna dengan konten obrolan
- **Kerahasiaan**: Memastikan hanya penerima yang dimaksud yang dapat membaca pesan
- **Integritas**: Mencegah peretasan pesan selama transit
- **Sementara**: Secara otomatis menghapus data setelah periode tertentu

## Asumsi

### Batas Kepercayaan
- **Perangkat Klien**: Sepenuhnya dipercaya - diasumsikan tidak dikompromikan
- **Server**: Semi-dipercaya - mungkin dikompromikan tetapi tidak boleh mengungkapkan konten pesan
- **Jaringan**: Tidak dipercaya - rentan terhadap serangan pasif dan aktif

### Kemampuan Lawan
- Dapat mengamati lalu lintas jaringan
- Dapat mengkompromikan server
- Dapat melakukan analisis lalu lintas
- Memiliki sumber daya komputasi yang signifikan

## Ancaman yang Dicegah

### Terhadap Operator Server
- **Administrator yang Penasaran**: Server tidak dapat mengakses konten pesan karena enkripsi end-to-end
- **Kompromi Basis Data**: Tidak ada data pengguna persisten atau riwayat pesan yang disimpan di server
- **Analisis Metadata**: Metadata minimal yang disimpan di server

### Terhadap Pengamat Jaringan
- **Pemantauan Pasif**: Semua pesan dienkripsi end-to-end, mencegah inspeksi konten
- **Korelasi Lalu Lintas**: Perlindungan terbatas terhadap analisis korelasi yang canggih
- **Analisis Waktu**: Perlindungan dasar melalui kemungkinan pengelompokan pesan

### Terhadap Pengguna Lain
- **Peserta Jahat**: Tidak dapat menyamar sebagai pengguna lain karena verifikasi kunci publik
- **Peretasan Pesan**: Integritas dilindungi oleh enkripsi terotentikasi
- **Pengungkapan Metadata**: Terbatas pada keanggotaan ruangan dan waktu

## Keterbatasan yang Diakui

### Terhadap Kompromi Klien
- **Kompromi Perangkat**: Jika perangkat klien dikompromikan, semua kunci dan data lokal dapat diakses
- **Perangkat Lunak Berbahaya**: Malware lokal dapat menangkap teks asli sebelum enkripsi atau setelah dekripsi
- **Akses Fisik**: Akses fisik tidak sah ke perangkat mengungkapkan semua data

### Terhadap Analisis Lalu Lintas
- **Korelasi Tingkat ISP**: Lawan yang canggih mungkin mengkorelasikan koneksi berdasarkan waktu/pola
- **Waktu Koneksi**: Metadata tentang kapan pengguna terhubung/terputus mungkin dapat diamati
- **Analisis Volume**: Pola volume pesan mungkin mengungkapkan informasi

### Terhadap Rekayasa Sosial
- **Serangan Phising**: Pengguna mungkin ditipu untuk mengungkapkan rahasia ruangan
- **Penyamaran**: Lawan mungkin menyamar sebagai kontak terpercaya di luar platform
- **Paksaan**: Pengguna mungkin dipaksa untuk mengungkapkan informasi di bawah tekanan

## Upaya Pencegahan

### Diimplementasikan
- Enkripsi end-to-end dengan X25519/AES-256-GCM
- Retensi data sisi-server minimal
- Kedaluwarsa otomatis ruangan dan pesan
- Pembatasan frekuensi dan tindakan pencegahan penyalahgunaan
- Generasi dan penyimpanan kunci aman di klien

### Belum Diimplementasikan (Masa Depan)
- Obfuskasi lalu lintas canggih
- Tindakan keamanan pasca-kompromi
- Protokol anonimitas canggih (seperti jaringan campuran)

## Penilaian Risiko

### Risiko Tinggi
- Kompromi perangkat klien (pencegahan: edukasi pengguna, praktik perangkat aman)
- Serangan rekayasa sosial (pencegahan: kesadaran pengguna, mekanisme verifikasi)

### Risiko Sedang
- Korelasi lalu lintas oleh lawan yang canggih (pencegahan: pelapisan pesan, lalu lintas palsu)
- Serangan saluran-samping pada perangkat klien (pencegahan: praktik implementasi aman)

### Risiko Rendah
- Rasa ingin tahu operator server (dicegah oleh E2EE)
- Pelanggaran basis data (dicegah oleh kurangnya data yang disimpan)
- Pemantauan jaringan pasif (dicegah oleh E2EE)

## Kepatuhan dan Etika

### Transparansi
- Komunikasi yang jelas tentang keterbatasan keamanan kepada pengguna
- Representasi jujur tentang kemampuan anonimitas
- Pengungkapan praktik penanganan data

### Penggunaan Bertanggung Jawab
- Penolakan eksplisit terhadap aktivitas ilegal
- Ketentuan layanan yang jelas
- Akuntabilitas pengguna atas penyalahgunaan