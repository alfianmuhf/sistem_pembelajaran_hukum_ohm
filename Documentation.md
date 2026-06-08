---=== [ Smart Learning OHM ] ===---

Role : Admin
[id_admin, email, password]

Role : Guru
[NIP, nama_guru, password]

Role : Siswa
[NIM, nama_siswa, password, id_kelas]




== kelas
[id_kelas, nama_kelas, guru_pengampu]

== sesi soal
[id_sesi, id_kelas, sesi]

== soal
[id_soal, id_sesi, NIM, ohm, volt, ampere]

== jawaban siswa
[id_jawaban, id_soal, jawaban_ampere, tanggal]

== praktikum siswa
[id_praktikum, id_saol, ohm_target, volt_target, ampere_terget, tanggal]

== analisis siswa
[id_analisis, id_sesi, NIM, analisis, tanggal]

== nilai_siswa
[id_nilai, id_sesi, NIM, nilai_soal, nilai_praktikum, nilai_analisis, total_nilai]

== nilai siswa
[id_nilai, id_sesi, NIM, ohm, volt_&_ampere_soal, volt_&_ampere_praktikum, analisis, nilai_soal, niali_paktikum, total nilai, tanggal]






