# ⚡ Smart Learning OHM - Sistem Pembelajaran IoT

Sebuah platform aplikasi web interaktif (*web application*) yang didesain secara khusus untuk menyinkronkan data perhitungan teori siswa (berbasis kuis) dengan data hasil pembacaan perangkat keras (modul praktikum IoT) secara *Real-Time*.

![Smart Learning Ohm](https://img.shields.io/badge/Platform-Web%20%2B%20IoT-blue)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20Node.js%20%7C%20ESP32-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

## 🎯 Tujuan Utama
Memberikan pengalaman belajar Hukum Ohm yang komprehensif di mana siswa tidak hanya menghitung arus secara teori (matematis), tetapi juga secara langsung mengontrol perangkat fisik (ESP32) dan mengamati pembacaan sensor arus, tegangan, dan suhu secara *real-time* di layar mereka.

---

## 🌟 Fitur Utama

### 1. Panel Administrator
- Manajemen akun **Guru** (dengan Auto-NIP `YY020XXX`).
- Manajemen **Siswa** (dengan Auto-NIM `YY010XXX`).
- Manajemen **Kelas** dinamis dan terhubung dengan guru pengampu.

### 2. Panel Guru
- **Pembuatan Kuis Otomatis (Sesi Utama)**: Guru mengatur jadwal/deadline, dan sistem otomatis *generate* soal acak untuk semua siswa di kelas (Target Ohm, Target Voltase).
- **Penilaian (Auto-grading & Manual)**:
  - Nilai Perhitungan Teori dinilai otomatis oleh sistem.
  - Guru dapat memberikan nilai tambahan untuk Praktikum dan Laporan Analisis.
- **Sistem Remidi Cerdas**: Jika ada siswa di bawah KKM, tombol "Generate Sesi Remidi" akan muncul otomatis hanya untuk target siswa tersebut.

### 3. Panel Siswa (E-Learning & IoT)
- **Dashboard Kuis Berjalan**: Daftar soal/praktikum yang sedang terbuka batas waktunya.
- **Pengerjaan Soal Split-Screen**:
  - *Kiri (Teori)*: Kotak hitungan manual.
  - *Kanan (Praktikum IoT)*: Tombol **Start/Stop Praktikum**. 
    - Begitu di-Start, koneksi via **WebSocket & MQTT** akan menyalakan transistor pada hardware ESP32.
    - Nilai Tegangan dan Arus dari sensor (INA226) serta suhu (DS18B20) akan muncul dan terus bergerak secara *real-time* di layar web browser siswa.
- **Grafik Analisis Nilai (Recharts)**: Setelah sesi berakhir, siswa bisa melihat detail perbandingan batang grafik (Tegangan & Arus) antara tebakan teori vs pembacaan IoT di riwayat nilai.

---

## 🏗 Arsitektur Sistem

Proyek ini dibangun dengan memisahkan 3 *layer* utama:

1. **Frontend (React + Vite)**: Berkomunikasi dengan Node.js via *REST API* dan *WebSocket* (untuk remote IoT). Menggunakan murni *Vanilla CSS* untuk *styling* antarmuka premium.
2. **Backend (Node.js + Express)**: Menjadi perantara (*bridge*). Menyediakan REST API, terhubung ke *Database* Supabase (PostgreSQL), dan bertindak sebagai MQTT Client ke *Cloud Broker*.
3. **Hardware IoT (ESP32 + C++)**: Menjalankan program mikrokontroler menggunakan *library* WiFi, MQTT (PubSubClient), INA226, dan DallasTemperature. ESP32 secara konstan *publish* data ke *Broker Cloud*.

![IoT Flow](https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/MQTT_protocol_diagram.svg/600px-MQTT_protocol_diagram.svg.png) *(Ilustrasi Protokol MQTT)*

---

## 💻 Tech Stack

- **Frontend**: React (v19), Vite, Recharts
- **Backend**: Node.js, Express.js, ws (WebSocket), MQTT.js
- **Database**: Supabase (PostgreSQL) terenkripsi.
- **Authentication**: JWT (JSON Web Tokens) disimpan di *Session Storage*.
- **Perangkat Keras**:
  - Mikrokontroler: ESP32 DOIT Devkit V1
  - Sensor Arus/Tegangan: INA226 (I2C)
  - Sensor Suhu: DS18B20 (1-Wire)
  - Modul Relai / Transistor untuk Switch Resistor 220Ω, 330Ω, 470Ω, 680Ω.

---

## 🚀 Instalasi & Menjalankan Aplikasi

Jika Anda ingin menjalankan proyek ini secara lokal:

### 1. Kloning Repositori
```bash
git clone https://github.com/alfianmuhf/sistem_pembelajaran_hukum_ohm.git
cd sistem_pembelajaran_hukum_ohm
```

### 2. Konfigurasi Database (Backend)
1. Buka folder `Backend`.
2. Buat file `.env` dan masukkan kredensial Supabase Anda:
   ```env
   PORT=5000
   SUPABASE_URL=https://[PROJECT_ID].supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR...
   JWT_SECRET=rahasia_super_aman
   ```
3. Install modul dan jalankan server:
   ```bash
   npm install
   npm start
   ```

### 3. Konfigurasi Aplikasi Web (Frontend)
1. Buka tab terminal baru, masuk ke folder `Frontend`.
2. Buat file `.env` untuk mengarahkan ke Backend lokal:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Install dependensi dan jalankan *development server*:
   ```bash
   npm install
   npm run dev
   ```

### 4. Flashing ESP32 (Hardware)
1. Gunakan **Arduino IDE**.
2. Pastikan file kode utama (`CODE_ESP.cpp`) dibuka.
3. Ubah nama WiFi (`X1`) dan password (`89898989`) pada file konfigurasinya menjadi milik Anda jika perlu.
4. Sesuaikan sertifikat broker HiveMQ di kode, lalu tekan tombol *Upload* ke ESP32.

---

## 🤝 Lisensi

Hak Cipta (C) 2026. Proyek *Smart Learning Web-IoT Hukum Ohm* ini dikembangkan untuk kebutuhan riset, edukasi, dan evaluasi pembelajaran IoT di Indonesia.
