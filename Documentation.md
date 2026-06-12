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
  - Pembuatan kuis sesi **Remidi** (Langsung terikat dengan ID sesi utamanya).
  - List sesi otomatis melakukan *Grouping* per kelas.
  - Sesi Remidi ditampilkan terstruktur (indentasi khusus) tepat di bawah Sesi Utama induknya.
  - Form dilengkapi *Dropdown* kelas dinamis (hanya menampilkan kelas yang diajar oleh guru tersebut) dan input Tanggal beserta Jam batas akhir pengerjaan.

## 3. Database dan Relasi (Supabase PostgreSQL)
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

---
*Dokumen ini dibuat sebagai referensi pusat untuk menjamin proses serah terima (handoff) pengembangan ke tahap selanjutnya, asisten AI lain, maupun perangkat kerja yang berbeda dapat berjalan dengan transisi yang mulus.*
