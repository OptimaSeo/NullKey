# Berkontribusi pada NullKey

Terima kasih atas minat Anda untuk berkontribusi pada NullKey! Dokumen ini menjelaskan pedoman untuk berkontribusi pada aplikasi obrolan anonim yang berfokus pada privasi ini.

## Filosofi Keamanan Terlebih Dahulu

NullKey mengutamakan privasi dan keamanan pengguna di atas segalanya. Saat berkontribusi:

- Jangan pernah menambahkan fitur yang membahayakan anonimitas pengguna
- Ikuti model ancaman yang diuraikan dalam `docs/threat-model.md`
- Pastikan tidak ada data plaintext yang disimpan di server
- Jaga paparan metadata seminimal mungkin
- Ikuti desain kriptografi dalam `docs/crypto-design.md`

## Aturan

- Tidak ada permintaan fitur yang melemahkan privasi
- Tidak ada telemetry, pelacakan, atau analitik
- Tidak ada fitur identifikasi pengguna
- Tidak ada sistem akun persisten
- Tidak ada penyimpanan data plaintext di server
- Ikuti spesifikasi MVP dalam `mvp.md`

## Setup Pengembangan

1. Fork repositori
2. Clone hasil fork Anda: `git clone https://github.com/OptimaSeo/NullKey.git`
3. Navigasi ke direktori proyek: `cd NullKey`
4. Install dependensi:
   - Backend: `cd backend && npm install`
   - Frontend: `cd frontend && npm install`

## Gaya Kode

- Ikuti gaya kode yang sudah ada dalam proyek
- Gunakan format yang konsisten dan nama variabel yang bermakna
- Jaga pemisahan antara kripto sisi klien dan relay sisi server
- Dokumentasikan keputusan yang relevan dengan keamanan

## Pengujian

Pastikan untuk menguji perubahan Anda secara menyeluruh sebelum mengirimkan pull request. Perhatikan khususnya:
- Fungsi enkripsi end-to-end
- Pengiriman dan penerimaan pesan
- Pembuatan dan bergabung ruangan
- Batas keamanan antara server dan klien

## Pull Request

- Satu fitur per PR
- Penjelasan yang jelas diperlukan
- Dampak keamanan harus didokumentasikan
- Ikuti arsitektur yang dijelaskan dalam `docs/architecture.md`
- Referensikan bagian-bagian relevan dari spesifikasi MVP jika diperlukan
- Pastikan tidak ada data plaintext yang terekspos ke server

## Cakupan MVP

Proyek ini saat ini mengimplementasikan fitur-fitur MVP yang didefinisikan dalam `mvp.md`. Harap pastikan kontribusi Anda selaras dengan cakupan saat ini dan jangan menambahkan fitur di luar persyaratan MVP yang ditentukan kecuali secara eksplisit dibahas dalam sebuah isu terlebih dahulu.

Dengan berkontribusi, Anda setuju bahwa kode Anda dilisensikan di bawah AGPL‑3.0.