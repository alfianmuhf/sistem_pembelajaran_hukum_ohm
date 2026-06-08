# Rencana Desain Database & Relasi - Smart Learning OHM

Dokumen ini merangkum arsitektur sistem pembelajaran Hukum Ohm berbasis IoT dan Web, serta rancangan skema basis data PostgreSQL (Supabase) yang dioptimalkan berdasarkan [Documentation.md](file:///d:/Programming/WEB_IOT/Documentation.md).

---

## 1. Rangkuman Sistem

Sistem **Smart Learning OHM** adalah platform pembelajaran interaktif yang menggabungkan aplikasi Web (React JS + Node JS) dan perangkat keras IoT untuk membantu siswa memahami Hukum Ohm ($V = I \times R$).

### Aktor & Hak Akses (Roles)
1. **Admin**: Mengelola data dasar sistem, meliputi akun Siswa, Guru, dan Kelas.
2. **Guru**: Mengelola sesi soal (kuis/tugas) dan melakukan manajemen nilai siswa.
3. **Siswa**: Mengerjakan kuis berbasis web, melakukan praktikum dengan modul IoT (menyesuaikan tegangan/Volt, hambatan/Ohm, dan arus/Ampere), serta melihat hasil nilai mereka.

### Alur Komunikasi IoT & Web
```
[Perangkat IoT Siswa] 
       │ (Mengatur Volt, Ohm, Ampere secara Fisik)
       ▼ (Protokol MQTT via HiveMQ)
[Backend Node.js] 
       │ (Menerima data sensor IoT, memvalidasi terhadap target soal)
       ▼ (Websocket / Rest API)
[Frontend React.js] 
       │ (Menampilkan data real-time ke Siswa/Guru)
```

---

## 2. Rancangan Skema & Relasi Database (PostgreSQL)

Untuk menghindari redundansi data (duplikasi nilai) dan menjaga integritas data, skema basis data dinormalisasi dengan memisahkan data transaksi (jawaban, praktikum, analisis) dari tabel rekapitulasi nilai (`nilai_siswa`).

### Diagram Relasi Database (ERD - Mermaid)

```mermaid
erDiagram
    ADMIN {
        serial id_admin PK
        varchar email UNIQUE
        varchar password
    }

    GURU {
        varchar nip PK "Nomor Induk Pegawai"
        varchar nama_guru
        varchar password
    }

    KELAS {
        serial id_kelas PK
        varchar nama_kelas
        varchar nip_guru FK "Referensi ke GURU(nip)"
    }

    SISWA {
        varchar nim PK "Nomor Induk Mahasiswa/Siswa"
        varchar nama_siswa
        varchar password
        int id_kelas FK "Referensi ke KELAS(id_kelas)"
    }

    SESI_SOAL {
        serial id_sesi PK
        int id_kelas FK "Referensi ke KELAS(id_kelas)"
        varchar sesi "Nama/Deskripsi Sesi"
    }

    SOAL {
        serial id_soal PK
        int id_sesi FK "Referensi ke SESI_SOAL(id_sesi)"
        varchar nim FK "Referensi ke SISWA(nim)"
        float ohm "Target Hambatan"
        float volt "Target Tegangan"
        float ampere "Target Arus (V/R)"
    }

    JAWABAN_SISWA {
        serial id_jawaban PK
        int id_soal FK "Referensi ke SOAL(id_soal)"
        float jawaban_ampere
        timestamp tanggal
    }

    PRAKTIKUM_SISWA {
        serial id_praktikum PK
        int id_soal FK "Referensi ke SOAL(id_soal)"
        float ohm_target "Pembacaan Sensor Ohm"
        float volt_target "Pembacaan Sensor Volt"
        float ampere_target "Pembacaan Sensor Ampere"
        timestamp tanggal
    }

    ANALISIS_SISWA {
        serial id_analisis PK
        int id_sesi FK "Referensi ke SESI_SOAL(id_sesi)"
        varchar nim FK "Referensi ke SISWA(nim)"
        text analisis
        timestamp tanggal
    }

    NILAI_SISWA {
        serial id_nilai PK
        int id_sesi FK "Referensi ke SESI_SOAL(id_sesi)"
        varchar nim FK "Referensi ke SISWA(nim)"
        float nilai_soal "Nilai Kuis Teori"
        float nilai_praktikum "Nilai Kesesuaian IoT"
        float nilai_analisis "Nilai Kualitas Analisis"
        float total_nilai "Rata-rata/Bobot Nilai"
        timestamp tanggal
    }

    GURU ||--o{ KELAS : "mengajar"
    KELAS ||--o{ SISWA : "memiliki"
    KELAS ||--o{ SESI_SOAL : "memiliki"
    SISWA ||--o{ SOAL : "diberikan"
    SESI_SOAL ||--o{ SOAL : "berisi"
    SOAL ||--o| JAWABAN_SISWA : "dijawab"
    SOAL ||--o| PRAKTIKUM_SISWA : "dipraktikkan"
    SISWA ||--o{ ANALISIS_SISWA : "menulis"
    SESI_SOAL ||--o{ ANALISIS_SISWA : "memiliki"
    SISWA ||--o{ NILAI_SISWA : "memperoleh"
    SESI_SOAL ||--o{ NILAI_SISWA : "memiliki"
```

---

## 3. Penjelasan Struktur Tabel

### A. Tabel Utama Pengguna (Users)
1. **`admins`**: Menyimpan kredensial admin sistem.
2. **`guru`**: Menyimpan kredensial guru pengampu. Menggunakan `nip` sebagai Primary Key karena bersifat unik dan permanen.
3. **`siswa`**: Menyimpan data siswa beserta kelas tempat siswa terdaftar (`id_kelas` sebagai Foreign Key). Menggunakan `nim` sebagai Primary Key.

### B. Tabel Akademik & Soal
1. **`kelas`**: Menghubungkan kelas dengan guru pengampu (`nip_guru` sebagai Foreign Key).
2. **`sesi_soal`**: Mewakili suatu modul ujian/praktikum (misalnya "Modul Ujian Hukum Ohm 1") yang ditugaskan ke kelas tertentu.
3. **`soal`**: Menyimpan data parameter Hukum Ohm yang ditugaskan kepada siswa tertentu (`nim`) pada sesi tertentu (`id_sesi`). 
   > **Catatan Desain**: Dengan menyertakan `nim` di tabel `soal`, setiap siswa akan mendapatkan parameter angka ($V, I, R$) yang unik/berbeda untuk menghindari kecurangan antar siswa.

### C. Tabel Transaksi & Umpan Balik Siswa
1. **`jawaban_siswa`**: Menyimpan jawaban teori yang dimasukkan siswa melalui web untuk soal tertentu.
2. **`praktikum_siswa`**: Menyimpan data hasil praktikum fisik yang dikirim oleh modul IoT siswa (nilai resistor, tegangan, dan arus sesungguhnya saat siswa melakukan perakitan alat).
3. **`analisis_siswa`**: Tempat siswa menulis kesimpulan atau analisis kualitatif mengenai hubungan antara Volt, Ohm, dan Ampere dari praktikum yang telah dilakukan.

### D. Tabel Rekapitulasi Nilai (`nilai_siswa`)
Untuk merepresentasikan gabungan dari **Option 1** dan **Option 2** pada `Documentation.md`, kita membuat tabel `nilai_siswa` yang menampung skor akhir per kategori (`nilai_soal`, `nilai_praktikum`, `nilai_analisis`, `total_nilai`). 

Adapun rincian detail parameter ($V, I, R$ target vs hasil praktikum) tidak perlu disimpan ulang di tabel ini karena dapat diambil secara dinamis melalui SQL Query **`JOIN`** antara tabel `nilai_siswa`, `soal`, `jawaban_siswa`, dan `praktikum_siswa`. Hal ini menjamin basis data tetap efisien dan konsisten.

---

## 4. SQL DDL Script (PostgreSQL / Supabase Ready)

Berikut adalah script DDL untuk menginisialisasi tabel-tabel di atas:

```sql
-- 1. Tabel Admin
CREATE TABLE admins (
    id_admin SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Tabel Guru
CREATE TABLE guru (
    nip VARCHAR(50) PRIMARY KEY,
    nama_guru VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 3. Tabel Kelas
CREATE TABLE kelas (
    id_kelas SERIAL PRIMARY KEY,
    nama_kelas VARCHAR(100) NOT NULL,
    nip_guru VARCHAR(50) REFERENCES guru(nip) ON DELETE SET NULL
);

-- 4. Tabel Siswa
CREATE TABLE siswa (
    nim VARCHAR(50) PRIMARY KEY,
    nama_siswa VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    id_kelas INT REFERENCES kelas(id_kelas) ON DELETE SET NULL
);

-- 5. Tabel Sesi Soal
CREATE TABLE sesi_soal (
    id_sesi SERIAL PRIMARY KEY,
    id_kelas INT REFERENCES kelas(id_kelas) ON DELETE CASCADE,
    sesi VARCHAR(100) NOT NULL
);

-- 6. Tabel Soal
CREATE TABLE soal (
    id_soal SERIAL PRIMARY KEY,
    id_sesi INT REFERENCES sesi_soal(id_sesi) ON DELETE CASCADE,
    nim VARCHAR(50) REFERENCES siswa(nim) ON DELETE CASCADE,
    ohm DOUBLE PRECISION NOT NULL,
    volt DOUBLE PRECISION NOT NULL,
    ampere DOUBLE PRECISION NOT NULL
);

-- 7. Tabel Jawaban Siswa
CREATE TABLE jawaban_siswa (
    id_jawaban SERIAL PRIMARY KEY,
    id_soal INT UNIQUE REFERENCES soal(id_soal) ON DELETE CASCADE,
    jawaban_ampere DOUBLE PRECISION NOT NULL,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Praktikum Siswa
CREATE TABLE praktikum_siswa (
    id_praktikum SERIAL PRIMARY KEY,
    id_soal INT UNIQUE REFERENCES soal(id_soal) ON DELETE CASCADE,
    ohm_target DOUBLE PRECISION NOT NULL,
    volt_target DOUBLE PRECISION NOT NULL,
    ampere_target DOUBLE PRECISION NOT NULL,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabel Analisis Siswa
CREATE TABLE analisis_siswa (
    id_analisis SERIAL PRIMARY KEY,
    id_sesi INT REFERENCES sesi_soal(id_sesi) ON DELETE CASCADE,
    nim VARCHAR(50) REFERENCES siswa(nim) ON DELETE CASCADE,
    analisis TEXT NOT NULL,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Tabel Nilai Siswa
CREATE TABLE nilai_siswa (
    id_nilai SERIAL PRIMARY KEY,
    id_sesi INT REFERENCES sesi_soal(id_sesi) ON DELETE CASCADE,
    nim VARCHAR(50) REFERENCES siswa(nim) ON DELETE CASCADE,
    nilai_soal DOUBLE PRECISION DEFAULT 0.0,
    nilai_praktikum DOUBLE PRECISION DEFAULT 0.0,
    nilai_analisis DOUBLE PRECISION DEFAULT 0.0,
    total_nilai DOUBLE PRECISION DEFAULT 0.0,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_siswa_sesi UNIQUE (nim, id_sesi)
);
```
