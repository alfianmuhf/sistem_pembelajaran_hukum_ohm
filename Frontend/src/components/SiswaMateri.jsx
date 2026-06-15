function SiswaMateri() {
  return (
    <div className="materi-page">
      <section className="materi-hero">
        <div className="materi-hero-text">
          <span className="materi-badge">⚡ Materi Dasar Kelistrikan</span>
          <h2>Materi Hukum Ohm</h2>
          <p>
            Hubungan antara <strong>tegangan</strong>, <strong>arus</strong>,
            dan <strong>hambatan</strong> dalam rangkaian listrik sederhana.
          </p>
        </div>

        <div className="ohm-illustration">
          <div className="battery-icon">🔋</div>
          <div className="wire-line"></div>
          <div className="resistor-icon">Ω</div>
          <div className="wire-line"></div>
          <div className="lamp-icon">💡</div>
        </div>
      </section>

      <section className="materi-grid">
        <div className="materi-card">
          <div className="materi-icon">👨‍🔬</div>
          <h3>Sejarah Singkat Hukum Ohm</h3>
          <ul>
            <li>
              Hukum Ohm ditemukan oleh <strong>Georg Simon Ohm</strong>,
              ilmuwan fisika dan matematika dari Jerman.
            </li>
            <li>
              Georg Simon Ohm lahir pada tahun <strong>1789</strong> dan wafat
              pada tahun <strong>1854</strong>.
            </li>
            <li>
              Pada tahun <strong>1827</strong>, ia mempublikasikan penelitian
              tentang hubungan tegangan, arus listrik, dan hambatan.
            </li>
            <li>
              Satuan hambatan listrik, yaitu <strong>Ohm</strong> dengan simbol
              <strong> Ω</strong>, diambil dari namanya.
            </li>
          </ul>
          <div className="materi-note">
            Hukum Ohm menjadi dasar penting dalam mempelajari listrik,
            elektronika, dan rangkaian sederhana.
          </div>
        </div>

        <div className="materi-card">
          <div className="materi-icon">📘</div>
          <h3>Pengertian Hukum Ohm</h3>
          <p>
            Hukum Ohm menjelaskan hubungan antara tegangan listrik, arus
            listrik, dan hambatan listrik.
          </p>
          <ul>
            <li>
              Jika <strong>tegangan semakin besar</strong>, maka arus listrik
              juga cenderung semakin besar.
            </li>
            <li>
              Jika <strong>hambatan semakin besar</strong>, maka arus listrik
              menjadi semakin kecil.
            </li>
            <li>
              Hukum Ohm berlaku pada rangkaian sederhana yang memiliki komponen
              hambatan, misalnya resistor.
            </li>
          </ul>
        </div>
      </section>

      <section className="formula-section">
        <div className="formula-card">
          <h3>Rumus Dasar Hukum Ohm</h3>
          <div className="formula-main">V = I × R</div>
          <p>Tegangan = Arus × Hambatan</p>
        </div>

        <div className="triangle-formula">
          <div className="triangle-top">V</div>
          <div className="triangle-bottom">
            <span>I</span>
            <span>R</span>
          </div>
        </div>

        <div className="formula-list">
          <h3>Rumus Turunan</h3>
          <div className="formula-chip">V = I × R</div>
          <div className="formula-chip">I = V / R</div>
          <div className="formula-chip">R = V / I</div>
          <p className="formula-help">
            Cara mengingat: tutup simbol yang ingin dicari, lalu gunakan rumus
            yang tersisa.
          </p>
        </div>
      </section>

      <section className="materi-card">
        <h3>Simbol dan Satuan</h3>
        <div className="table-wrapper">
          <table className="materi-table">
            <thead>
              <tr>
                <th>Simbol</th>
                <th>Arti</th>
                <th>Satuan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>V</td>
                <td>Tegangan listrik</td>
                <td>Volt (V)</td>
              </tr>
              <tr>
                <td>I</td>
                <td>Arus listrik</td>
                <td>Ampere (A)</td>
              </tr>
              <tr>
                <td>R</td>
                <td>Hambatan listrik</td>
                <td>Ohm (Ω)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="materi-grid three-columns">
        <div className="materi-card small-card">
          <div className="materi-icon">🔌</div>
          <h3>Tegangan Listrik</h3>
          <p>
            Tegangan adalah gaya dorong listrik agar arus dapat mengalir.
            Satuannya adalah <strong>Volt</strong>.
          </p>
          <p>Contoh: baterai, aki, adaptor, dan power supply.</p>
        </div>

        <div className="materi-card small-card">
          <div className="materi-icon">⚡</div>
          <h3>Arus Listrik</h3>
          <p>
            Arus listrik adalah aliran muatan listrik dalam rangkaian.
            Satuannya adalah <strong>Ampere</strong>.
          </p>
          <p>Arus dapat mengalir jika rangkaian tertutup.</p>
        </div>

        <div className="materi-card small-card">
          <div className="materi-icon">Ω</div>
          <h3>Hambatan Listrik</h3>
          <p>
            Hambatan adalah penghalang atau pembatas arus listrik. Satuannya
            adalah <strong>Ohm</strong>.
          </p>
          <p>Komponen yang sering digunakan adalah resistor.</p>
        </div>
      </section>

      <section className="example-section">
        <div className="materi-card">
          <h3>Contoh Perhitungan</h3>
          <p>
            Diketahui sebuah rangkaian memiliki tegangan <strong>12 Volt</strong>
            dan hambatan <strong>6 Ohm</strong>. Berapakah arus listrik yang
            mengalir?
          </p>

          <div className="calculation-box">
            I = V / R = 12 / 6 = 2 A
          </div>

          <p>
            Jadi, arus listrik yang mengalir adalah
            <strong> 2 Ampere</strong>.
          </p>
        </div>

        <div className="materi-card">
          <h3>Diketahui Nilai</h3>
          <div className="value-list">
            <div>
              <span>Tegangan</span>
              <strong>12 Volt</strong>
            </div>
            <div>
              <span>Hambatan</span>
              <strong>6 Ohm</strong>
            </div>
            <div>
              <span>Arus</span>
              <strong>2 Ampere</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="materi-card">
        <h3>Hubungan Tegangan, Arus, dan Hambatan</h3>
        <ul>
          <li>Tegangan naik, maka arus cenderung naik jika hambatan tetap.</li>
          <li>Hambatan naik, maka arus cenderung turun jika tegangan tetap.</li>
          <li>
            Tegangan tetap dan hambatan kecil menghasilkan arus yang lebih
            besar.
          </li>
          <li>
            Tegangan tetap dan hambatan besar menghasilkan arus yang lebih
            kecil.
          </li>
        </ul>

        <div className="table-wrapper">
          <table className="materi-table">
            <thead>
              <tr>
                <th>Tegangan</th>
                <th>Hambatan</th>
                <th>Arus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>12 V</td>
                <td>4 Ω</td>
                <td>3 A</td>
              </tr>
              <tr>
                <td>12 V</td>
                <td>6 Ω</td>
                <td>2 A</td>
              </tr>
              <tr>
                <td>12 V</td>
                <td>12 Ω</td>
                <td>1 A</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="materi-note">
          Kesimpulan: dengan tegangan yang sama, semakin besar hambatan maka
          arus listrik yang mengalir semakin kecil.
        </div>
      </section>

      <section className="materi-grid">
        <div className="materi-card">
          <div className="materi-icon">🧪</div>
          <h3>Contoh Penerapan Hukum Ohm</h3>
          <ul>
            <li>Menghitung kebutuhan resistor untuk melindungi LED.</li>
            <li>Mengukur arus pada rangkaian elektronik sederhana.</li>
            <li>Merancang rangkaian agar komponen tidak mudah rusak.</li>
            <li>Menghitung beban listrik pada alat elektronik.</li>
            <li>Menganalisis voltase dan arus pada kegiatan praktikum.</li>
            <li>Memahami kerja sensor listrik pada proyek IoT.</li>
          </ul>
        </div>

        <div className="materi-card">
          <div className="materi-icon">🏠</div>
          <h3>Contoh dalam Kehidupan Sehari-hari</h3>
          <ul>
            <li>Charger HP menggunakan tegangan tertentu agar aman.</li>
            <li>LED membutuhkan resistor agar tidak rusak.</li>
            <li>Aki kendaraan digunakan untuk sistem listrik kendaraan.</li>
            <li>Kabel listrik memiliki hambatan.</li>
            <li>Sekring memutus arus jika terjadi kelebihan arus.</li>
          </ul>
        </div>
      </section>

      <section className="summary-card">
        <div className="summary-icon">✅</div>
        <div>
          <h3>Ringkasan Akhir</h3>
          <p>
            Hukum Ohm menjelaskan hubungan antara tegangan, arus, dan hambatan.
            Rumus utamanya adalah <strong>V = I × R</strong>. Materi ini penting
            sebagai dasar untuk memahami listrik, elektronika, dan proyek IoT.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SiswaMateri;