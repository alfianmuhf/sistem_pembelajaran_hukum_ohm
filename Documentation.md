# Dokumentasi Sistem: Smart Learning OHM

## 1. Deskripsi Sistem
**Smart Learning OHM** adalah sebuah platform berbasis web (*web application*) yang didesain untuk menyinkronkan data kuis siswa dengan data pembacaan fisik pada modul praktikum IoT (Hukum Ohm). Sistem ini memfasilitasi peran Admin, Guru, dan Siswa untuk berinteraksi dalam satu lingkungan pembelajaran yang terstruktur. 

## 2. Fitur yang Sudah Diimplementasikan (Fase 1: Admin Panel)
Hingga saat ini, sistem telah menyelesaikan pondasi awal untuk panel Administrator, meliputi:
- **Autentikasi Admin**: Sistem login mandiri dengan JWT (JSON Web Token) dan proteksi *middleware* di *backend*.
- **Dashboard Interaktif**: Menampilkan metrik data *real-time* (Total Murid, Guru, dan Kelas). Statistik pada *dashboard* dapat diklik untuk navigasi cepat.
- **Manajemen Guru (CRUD)**: 
  - Penambahan akun guru dengan **NIP Otomatis** (Format: `YY020XXX`).
  - *Password* default *auto-hash* menggunakan NIP.
  - Opsi aktivasi/nonaktivasi guru.
- **Manajemen Kelas (CRUD)**: 
  - Pembuatan Rombongan Belajar (Kelas) dengan nama unik.
  - Relasi *Dropdown* dinamis untuk menetapkan guru pengampu dari daftar Guru yang berstatus *Aktif*.
- **Manajemen Siswa/Murid (CRUD)**: 
  - Pembuatan akun siswa dengan **NIM Otomatis** (Format: `YY010XXX`).
  - Relasi penempatan kelas.
  - Tabel menggunakan sistem **Grouping** berdasarkan kelas asal, sehingga data ditampilkan secara hierarkis (urut per nama kelas).

## 2.5. Fitur yang Sudah Diimplementasikan (Fase 2: Guru Panel)
- **Manajemen Sesi Soal & Praktikum (CRUD)**:
  - Pembuatan kuis sesi **Utama** (Nomor sesi digenerate otomatis berdasarkan kelas).
  - List sesi otomatis melakukan *Grouping* per kelas.
  - Form dilengkapi *Dropdown* kelas dinamis (hanya menampilkan kelas yang diajar oleh guru tersebut) dan input Tanggal beserta Jam batas akhir pengerjaan.
  - **Generate Soal Susulan (Siswa Baru)**: Tombol aksi cerdas di daftar sesi yang mengecek dan men-generate otomatis soal baru *hanya* untuk siswa yang baru dimasukkan ke kelas, tanpa memengaruhi siswa yang sudah memiliki soal.
- **Halaman Penilaian (Guru)**:
  - **Tampilan Hierarkis (Accordion)**: Daftar penilaian dikelompokkan secara rapi berdasarkan **Kelas** dan **Sesi**. Setiap Kelas dapat di-klik (di-expand/collapse) untuk melihat daftar Sesi di dalamnya, dan Sesi dapat di-klik untuk melihat daftar Siswa.
  - **Auto-Grading & Manual Grading**: Siswa yang mengerjakan kuis akan mendapatkan `nilai_soal` secara otomatis (±0.01 toleransi jawaban Ampere). Guru dapat memberikan `nilai_praktikum` dan `nilai_analisis` secara manual via tombol "Lihat Detail". `total_nilai` kemudian dihitung otomatis dengan formula `(Teori + Praktikum + Analisis) / 3`.
  - **Status Penilaian Otomatis**: Label "Sudah Dinilai" (hijau) hanya akan muncul ketika guru sudah memasukkan *Nilai Praktikum* atau *Nilai Analisis*. Jika belum ada intervensi manual dari guru (meskipun siswa sudah mendapat nilai kuis otomatis), statusnya akan tetap "Belum Dinilai" (merah).
  - **Notifikasi Toast**: Setiap aksi simpan nilai akan memunculkan *Pop-up Toast Notification* modern dari pojok kanan bawah yang hilang secara otomatis.
  - **Sistem Remidi (Checklist & Generate Ulang)**:
    - **Visualisasi Total Nilai**: Tampilan `nilai_total` diwarnai **biru** (primary) jika sudah tuntas (>= 71) dan **merah** (danger) jika masih di bawah batas tuntas (< 71).
    - Jika terdapat siswa dengan `total_nilai < 71` dalam sebuah sesi utama, tombol cerdas **"Buat Sesi Remidi (N Siswa)"** akan otomatis muncul sejajar dengan judul sesi tersebut. Tidak perlu mencentang siswa satu per satu.
    - Sistem kemudian secara otomatis membuat Sesi Baru ber-tipe `remidi` yang terhubung ke sesi aslinya (`id_sesi_sebelum`), dan meng-generate 4 soal (Volt, Ohm, Ampere) **secara eksklusif** hanya untuk siswa yang memenuhi syarat remidi tersebut. Sesi remidi ini akan muncul sebagai sub-kategori baru di bawah kelas yang sama.
    - **Limitasi 1x Remidi**: Tiap sesi utama hanya diizinkan untuk dibuatkan 1 sesi remidi. Jika sesi remidi sudah pernah dibuat untuk sesi tersebut, tombol "Buat Sesi Remidi" akan berubah menjadi tombol **"Generate Susulan Remidi"**. Tombol ini berfungsi untuk memastikan apakah ada siswa remidi yang belum ter-*generate* soalnya akibat kendala koneksi atau sejenisnya.
    - Pada Sesi Remidi, tombol "Buat Sesi Remidi" akan disembunyikan untuk mencegah remidi berlapis.
    - **Generate Susulan pada Remidi**: Fitur _Generate_ ulang soal pada sesi Remidi kini didesain spesifik, hanya membuat soal susulan bagi siswa target remidi yang secara sistem belum mendapatkan soal, tanpa mempengaruhi siswa yang tuntas.

## 2.6. Fitur yang Sudah Diimplementasikan (Fase 3: Siswa Panel)
- **Auto-Generate Soal Kuis (Backend)**:
  - Setiap Sesi Utama dibuat oleh guru, backend akan otomatis membuat 4 soal berurutan (dengan Ohm: 220, 330, 470, 680) untuk *setiap siswa* di kelas tersebut. Voltase diacak dari 3 hingga 11 Volt.
- **Halaman Daftar Kuis Aktif**:
  - Validasi *Tenggang Waktu* secara akurat dengan sinkronisasi zona waktu (WIB / Asia/Jakarta) antara *database* dengan pengecekan waktu di *server backend*.
  - **Filter Partisipan Remidi**: Sesi remidi yang sedang berjalan hanya akan muncul (terlihat) di daftar kuis *eksklusif* bagi siswa yang memang menjadi peserta remidi (siswa yang nilainya < 71 di sesi utamanya). Siswa yang tidak remidi tidak akan melihat sesi tersebut meskipun tenggang waktunya masih aktif.
  - Menampilkan sesi yang masih berjalan dalam bentuk kotak (Card) berisi informasi: Tipe Sesi, Tanggal Dibuat, dan Tenggang Waktu (Tutup). Sesi yang sudah melewati batas waktu akan otomatis hilang.
- **Halaman Pengerjaan Soal (Split-Screen)**:
  - **Kiri (Teori)**: Menampilkan 4 kotak soal perhitungan arus (Ampere) beserta input jawaban dan tombol "Simpan Jawaban" per nomor.
  - **Kanan (Praktikum IoT)**: Menampilkan 4 kotak soal pembacaan aktual sensor, lengkap dengan tombol "Start/Stop Praktikum" per nomor, dan tombol simpan data. Dilengkapi *Dropdown Selector* Ohm (220, 330, 470, 680) untuk mengatur status ESP secara spesifik per soal. 
  - **Monitoring Sensor Suhu Real-time**: Pada area pengisian praktikum (sebelah tombol Simpan), ditambahkan indikator pembacaan Sensor Suhu Praktikum (dalam °C) yang secara langsung melakukan simulasi pembaruan angka tiap beberapa detik ketika mode "Start Praktikum" sedang aktif/dinyalakan. Tombol simpan pada bagian ini dikunci (disabled) jika koneksi IoT terputus atau mode pembacaan praktikum belum dijalankan.
  - **Bawah (Analisis)**: Area *textarea* untuk mengetik laporan praktikum dan kesimpulan.
- **Sistem Penyimpanan Terintegrasi (Upsert)**:
  - Seluruh fitur penyimpanan (Teori, Praktikum, Analisis) mendukung penyimpanan berulang. Sistem akan secara otomatis memperbarui (*update*) jawaban sebelumnya jika sudah pernah disimpan, tanpa menduplikasi data.
- **Notifikasi Modern (Toast)**:
  - *Pop-up alert* bawaan browser telah digantikan dengan notifikasi *toast* elegan di pojok kanan bawah (muncul di atas indikator status IoT) untuk setiap keberhasilan atau kegagalan penyimpanan.

## 3. Keamanan & Autentikasi (JWT)
- **Otomatis Logout (Browser Close)**: Penyimpanan JWT menggunakan `sessionStorage` di sisi klien. Hal ini memastikan sesi login akan langsung terhapus dan pengguna ter-logout seketika saat jendela/tab *browser* ditutup.
- **Batas Waktu (Token Expiry)**: Masa kedaluwarsa JWT di-set maksimal 3 Jam (`3h`) pada *backend*, mencegah penyalahgunaan token yang disalin walau *browser* belum ditutup.

## 4. Database dan Relasi (Supabase PostgreSQL)
Sistem ini menggunakan Supabase sebagai layanan *Database as a Service* (DBaaS). Tabel yang sudah terintegrasi sejauh ini:
1. **`admin`**: Mengatur akses masuk untuk administrator utama.
2. **`guru`**: 
   - Kolom: `id_guru` (PK), `nip` (Unique), `nama_guru`, `password`, `is_active`.
3. **`kelas`**: 
   - Kolom: `id_kelas` (PK), `nama_kelas` (Unique), `id_guru` (FK ke `guru`, opsi *Cascade/Set NULL*).
4. **`siswa`**: 
   - Kolom: `id_siswa` (PK), `nim` (Unique), `nama_siswa`, `password`, `id_kelas` (FK ke `kelas`).
5. **`sesi`**:
   - Kolom: `id_sesi` (PK), `id_kelas` (FK), `id_sesi_sebelum` (FK *Self-referencing* untuk Remidi), `sesi` (Auto-numbering Sesi 1, 2, dst), `tipe` (Utama / Remidi), `tanggal_pembuatan`, `tenggang_waktu` (Timestamp).
6. **`soal`**:
   - Kolom: `id_soal` (PK), `id_sesi` (FK), `id_siswa` (FK), `ohm`, `volt`, `ampere`.
7. **`jawaban_soal_siswa`**:
   - Kolom: `id_jawaban_soal_siswa` (PK), `id_soal` (FK), `jawaban_soal`. (Hanya terisi jika siswa menyimpan perhitungan Teori).
8. **`jawaban_praktikum_siswa`**:
   - Kolom: `id_jawaban_praktikum_siswa` (PK), `id_soal` (FK), `ohm_sensor`, `volt_sensor`, `ampere_sensor`. (Hanya terisi jika siswa menyimpan data Praktikum).
9. **`jawaban_analisis_siswa`**:
   - Kolom: `id_jawaban_analisis_siswa` (PK), `id_sesi` (FK), `id_siswa` (FK), `analisis_siswa`. (Laporan teks kesimpulan).
10. **`nilai_siswa`**:
   - Kolom: `id_nilai_siswa` (PK), `id_sesi` (FK), `id_siswa` (FK), `nilai_soal` (Auto-graded), `nilai_praktikum` (Manual dari Guru), `nilai_analisis` (Manual dari Guru), `nilai_total` (Kalkulasi rata-rata).

## 4. Tema Desain Frontend (UI/UX)
Antarmuka pengguna (UI) dibangun dengan orientasi **Premium Design**:
- **Pendekatan Styling**: Murni menggunakan *Vanilla CSS* (`index.css`) agar kontrol desain maksimal tanpa batasan *framework* eksternal.
- **Palet Warna**: Menggunakan kombinasi warna dinamis `var(--primary)` (biru/ungu elegan), warna latar belakang (*background*) keabuan cerah (`#f4f7fb`), dan aksen indikator (*success/danger*) yang modern.
- **Elemen Interaktif**: 
  - *Hover effects* yang halus pada tombol dan baris tabel.
  - Kustomisasi popup (*Modal*) yang berada di tengah layar dengan latar belakang *overlay* gelap transparan (*glassmorphism hints*).
- **Tipografi**: Pemilihan *font-family* modern (`Inter` atau *system-ui* default) untuk meningkatkan keterbacaan dan nuansa profesional.
- **Struktur Tabel**: Desain tabel tidak kaku; menggunakan padding luas, sudut membulat (*border-radius*), dan modifikasi *header grup* khusus untuk pemisahan kelas di tabel Siswa.

## 5. Library / Tech Stack yang Digunakan
Sistem ini dipisah menjadi dua repositori internal dalam satu *workspace* (Frontend dan Backend) dengan stack teknologi berikut:

### Backend (Node.js)
- `express`: Framework server HTTP utama.
- `@supabase/supabase-js`: Client SDK untuk manipulasi dan koneksi ke PostgreSQL Supabase (sudah mencakup *SQL Injection protection* bawaan karena berbasis PostgREST).
- `bcrypt`: Untuk enkripsi dan *hashing* password.
- `jsonwebtoken` (JWT): Manajemen *session*, autentikasi, dan perlindungan *endpoint* API.
- `cors` & `dotenv`: Pengaturan keamanan CORS lintas domain dan variabel lingkungan lokal/produksi.

### Frontend (React + Vite)
- `react` & `react-dom`: Inti *library* pembangunan antarmuka.
- `react-router-dom`: (Dipersiapkan jika aplikasi di-skala menjadi arsitektur halaman majemuk yang lebih besar).
- `vite`: Build tool pengembangan generasi baru yang sangat cepat dan ringan.

### 🔌 Arsitektur IoT Terintegrasi (ESP32 - Backend - Frontend)

Sistem Web IoT ini dilengkapi dengan arsitektur **End-to-End Real-Time IoT**.

1. **Hardware (ESP32)**:
   - Terhubung secara aman ke internet menggunakan jaringan WiFi (konfigurasi nama WiFi `X1` dan *password* `89898989`).
   - Berkomunikasi menggunakan protokol **MQTT** dengan *port* **TLS 8883** ke *Broker Cloud* pihak ketiga (HiveMQ).
   - ESP32 mem-*publish* paket data sensor (Suhu dari DS18B20, Tegangan dari ESP32 ADC, dan Arus/Shunt dari INA226) secara periodik setiap 1 detik dalam format JSON ke topik `ohm/sensor/data`.
   - Menggunakan fitur **Last Will and Testament (LWT)** MQTT untuk mendeteksi apabila perangkat mati atau terputus secara mendadak.
   
2. **Backend (Node.js/Express)**:
   - Bertindak sebagai penghubung dan otak komunikasi.
   - Terhubung sebagai *Client MQTT* ke Broker HiveMQ yang sama.
   - Menginisiasi koneksi **WebSocket Server** secara native (modul `ws`) yang dipasang pada satu *port* yang sama dengan HTTP Express.
   - Mem-*bridge* alias meneruskan pesan dari topik MQTT secara langsung (*real-time*) ke seluruh WebSocket *Client* (Siswa/Frontend) yang sedang terkoneksi.
   
3. **Frontend (SiswaSoal.jsx)**:
   - Terhubung melalui WebSocket (*Native*) menuju *Backend*.
   - **Kontrol 2-Arah**: Siswa dapat mengontrol *Hardware* (relai/resistor) langsung dari *dropdown* resistor di layar. *Frontend* mengirim pesan via *WebSocket*, yang kemudian diteruskan oleh *Backend* ke topik MQTT `ohm/control/resistor`, dan dieksekusi secara instan oleh ESP32.
   - Menampilkan status *"Online"* / *"Offline"* dari alat secara *real-time* berdasarkan status LWT perangkat.
   - Mengisi data Praktikum secara otomatis (Volt, Ampere, Suhu) mengikuti bacaan MQTT saat tombol "Start Praktikum" dinyalakan.

---

*Dokumen ini dibuat sebagai referensi pusat untuk menjamin proses serah terima (handoff) pengembangan ke tahap selanjutnya, asisten AI lain, maupun perangkat kerja yang berbeda dapat berjalan dengan transisi yang mulus.*
