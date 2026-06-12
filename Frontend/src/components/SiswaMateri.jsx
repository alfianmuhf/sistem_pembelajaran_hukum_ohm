import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const SiswaMateri = () => {
  const [kuisData, setKuisData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States (Local Mockup for now)
  const [teoriAnswers, setTeoriAnswers] = useState({});
  const [praktikumAnswers, setPraktikumAnswers] = useState({});
  const [analisisText, setAnalisisText] = useState('');
  
  // IoT Simulation States
  const [isIotConnected, setIsIotConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchKuis = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('ohm_session_token');
        const res = await fetch(`${API_URL}/kuis/aktif`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && data) {
          setKuisData(data);
          // Initialize empty answers
          const initialTeori = {};
          const initialPraktikum = {};
          data.soal.forEach(s => {
            initialTeori[s.id_soal] = '';
            initialPraktikum[s.id_soal] = { volt: '', ampere: '' };
          });
          setTeoriAnswers(initialTeori);
          setPraktikumAnswers(initialPraktikum);
        } else {
          setKuisData(null); // No active session
        }
      } catch (err) {
        setError('Gagal memuat kuis. Silakan coba lagi.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKuis();
  }, []);

  // Format date helper
  const formatDeadline = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Mock IoT toggle
  const toggleIot = () => {
    setIsIotConnected(!isIotConnected);
    if (isSimulating) setIsSimulating(false);
  };

  // Mock Start Praktikum
  const toggleSimulasi = () => {
    if (!isIotConnected) {
      alert("Hubungkan ke IoT Broker terlebih dahulu!");
      return;
    }
    setIsSimulating(!isSimulating);
  };

  // Handle Save (Mock)
  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Tersimpan secara lokal (Mockup UI). Integrasi database untuk jawaban akan dilakukan di tahap selanjutnya.');
    }, 1000);
  };

  const handleTeoriChange = (id_soal, value) => {
    setTeoriAnswers({ ...teoriAnswers, [id_soal]: value });
  };

  const handlePraktikumChange = (id_soal, field, value) => {
    setPraktikumAnswers({
      ...praktikumAnswers,
      [id_soal]: { ...praktikumAnswers[id_soal], [field]: value }
    });
  };

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>Memuat sesi aktif...</div>;
  }

  if (error) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;
  }

  if (!kuisData || !kuisData.soal || kuisData.soal.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="1.5" style={{ marginBottom: '20px' }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8" />
        </svg>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Belum Ada Sesi Aktif</h2>
        <p style={{ color: 'var(--text-medium)', maxWidth: '400px' }}>
          Saat ini tidak ada penugasan atau kuis yang sedang berjalan untuk kelas Anda. Silakan hubungi guru Anda atau kembali lagi nanti.
        </p>
      </div>
    );
  }

  const { sesi, soal } = kuisData;

  return (
    <div style={{ position: 'relative', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: sesi.tipe === 'Utama' ? 'var(--primary)' : 'var(--warning)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '14px' }}>
              {sesi.tipe}
            </span>
            Tugas Sesi {sesi.sesi}
          </h2>
          <p style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--danger)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Tutup: {formatDeadline(sesi.tenggang_waktu)}
          </p>
        </div>
        <div>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={isSaving}
            style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', padding: '12px 24px' }}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan & Kumpulkan'}
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Left Column: Teori */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--background)', paddingBottom: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '8px', color: 'var(--primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Perhitungan Teori</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-medium)' }}>Hitung nilai Arus (Ampere) berdasarkan Hukum Ohm (I = V / R)</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {soal.map((item, index) => (
              <div key={`teori-${item.id_soal}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--background)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)' }}>Soal {index + 1}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Hambatan (R)</span>
                    <strong style={{ fontSize: '16px' }}>{item.ohm} <span style={{ color: 'var(--text-medium)', fontSize: '14px' }}>Ω</span></strong>
                  </div>
                  <div style={{ background: '#fff', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Tegangan (V)</span>
                    <strong style={{ fontSize: '16px' }}>{item.volt} <span style={{ color: 'var(--text-medium)', fontSize: '14px' }}>V</span></strong>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', display: 'block', marginBottom: '8px' }}>Jawaban Arus (I) Teoritis:</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      step="0.0001"
                      placeholder="Contoh: 0.054"
                      className="form-input" 
                      style={{ paddingRight: '40px', background: '#fff' }}
                      value={teoriAnswers[item.id_soal] || ''}
                      onChange={(e) => handleTeoriChange(item.id_soal, e.target.value)}
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)', fontWeight: 600 }}>A</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Praktikum */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid var(--background)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', color: 'var(--success)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Praktikum IoT</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-medium)' }}>Baca data asli dari sensor</p>
              </div>
            </div>
            <button 
              className={isSimulating ? "btn-secondary" : "btn-primary"} 
              style={isSimulating ? { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'transparent' } : { background: 'var(--success)' }}
              onClick={toggleSimulasi}
            >
              {isSimulating ? 'Stop Pembacaan' : 'Start Praktikum'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {soal.map((item, index) => (
              <div key={`praktikum-${item.id_soal}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                {isSimulating && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--success)', animation: 'pulse 1.5s infinite' }}></div>
                )}
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
                  Target Soal {index + 1}
                  <span style={{ fontSize: '12px', background: 'var(--background)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-medium)' }}>
                    R: {item.ohm}Ω | V: {item.volt}V
                  </span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)', display: 'block', marginBottom: '8px' }}>Volt (Bacaan Sensor)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="Contoh: 5.12"
                        className="form-input" 
                        style={{ paddingRight: '35px' }}
                        value={praktikumAnswers[item.id_soal]?.volt || ''}
                        onChange={(e) => handlePraktikumChange(item.id_soal, 'volt', e.target.value)}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '14px' }}>V</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)', display: 'block', marginBottom: '8px' }}>Ampere (Bacaan Sensor)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        step="0.0001"
                        placeholder="Contoh: 0.052"
                        className="form-input" 
                        style={{ paddingRight: '35px' }}
                        value={praktikumAnswers[item.id_soal]?.ampere || ''}
                        onChange={(e) => handlePraktikumChange(item.id_soal, 'ampere', e.target.value)}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '14px' }}>A</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Analisis */}
      <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          Laporan Analisis & Kesimpulan
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-medium)' }}>
          Jelaskan perbandingan antara hasil perhitungan teori dengan hasil pengukuran sensor secara praktikum. Sebutkan faktor apa saja yang mempengaruhi adanya selisih nilai (jika ada).
        </p>
        <textarea 
          className="form-input" 
          rows="6" 
          placeholder="Ketik analisis Anda di sini..."
          value={analisisText}
          onChange={(e) => setAnalisisText(e.target.value)}
          style={{ resize: 'vertical' }}
        ></textarea>
      </div>

      {/* Floating IoT Indicator */}
      <div 
        onClick={toggleIot}
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          background: '#fff', 
          padding: '12px 20px', 
          borderRadius: '30px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          cursor: 'pointer',
          border: `1px solid ${isIotConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          zIndex: 100
        }}
      >
        <div style={{ position: 'relative', width: '12px', height: '12px' }}>
          {isIotConnected && <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--success)', borderRadius: '50%', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.7 }}></span>}
          <span style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: isIotConnected ? 'var(--success)' : 'var(--danger)', borderRadius: '50%' }}></span>
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
          {isIotConnected ? 'IoT Terhubung' : 'IoT Terputus'}
        </span>
      </div>

      {/* Inject some simple CSS animations */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
};

export default SiswaMateri;
