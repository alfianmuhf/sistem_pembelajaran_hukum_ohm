import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const SiswaSoal = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Session States
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [isLoadingSoal, setIsLoadingSoal] = useState(false);

  // Form States (Local Mockup for now)
  const [teoriAnswers, setTeoriAnswers] = useState({});
  const [praktikumAnswers, setPraktikumAnswers] = useState({});
  const [analisisText, setAnalisisText] = useState('');
  const [selectedOhmESP, setSelectedOhmESP] = useState({});
  
  // IoT Simulation States
  const [isIotConnected, setIsIotConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState({}); // { [id_soal]: boolean }
  const [suhuSensor, setSuhuSensor] = useState('--');
  
  // Saving states
  const [isSavingTeori, setIsSavingTeori] = useState({});
  const [isSavingPraktikum, setIsSavingPraktikum] = useState({});
  const [isSavingAnalisis, setIsSavingAnalisis] = useState(false);

  // Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    let interval;
    const isAnySimulating = Object.values(isSimulating).some(val => val === true);
    if (isAnySimulating) {
      interval = setInterval(() => {
        const randomSuhu = (30 + Math.random() * 5).toFixed(1);
        setSuhuSensor(randomSuhu);
      }, 2000);
    } else {
      setSuhuSensor('--');
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        const token = sessionStorage.getItem('ohm_session_token');
        const res = await fetch(`${API_URL}/kuis/aktif`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          setActiveSessions(data);
        } else {
          setActiveSessions([]);
        }
      } catch (err) {
        setError('Gagal memuat daftar kuis aktif. Silakan coba lagi.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleSelectSesi = async (sesi) => {
    setSelectedSesi(sesi);
    setIsLoadingSoal(true);
    setSoalList([]);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const [soalRes, jawabanRes] = await Promise.all([
        fetch(`${API_URL}/kuis/${sesi.id_sesi}/soal`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/kuis/${sesi.id_sesi}/jawaban`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const data = await soalRes.json();
      const jawabanData = jawabanRes.ok ? await jawabanRes.json() : { teori: [], praktikum: [], analisis: null };
      
      if (soalRes.ok && Array.isArray(data)) {
        setSoalList(data);
        // Initialize answers
        const initialTeori = {};
        const initialPraktikum = {};
        const initialOhm = {};
        
        data.forEach(s => {
          const tAns = jawabanData.teori.find(t => t.id_soal === s.id_soal);
          initialTeori[s.id_soal] = tAns && tAns.jawaban_soal !== null ? tAns.jawaban_soal.toString() : '';
          
          const pAns = jawabanData.praktikum.find(p => p.id_soal === s.id_soal);
          initialPraktikum[s.id_soal] = { 
            volt: pAns && pAns.volt_sensor !== null ? pAns.volt_sensor.toString() : '', 
            ampere: pAns && pAns.ampere_sensor !== null ? pAns.ampere_sensor.toString() : '' 
          };
          initialOhm[s.id_soal] = s.ohm.toString();
        });
        
        setTeoriAnswers(initialTeori);
        setPraktikumAnswers(initialPraktikum);
        setSelectedOhmESP(initialOhm);
        setAnalisisText(jawabanData.analisis?.analisis_siswa || '');
        setIsSimulating({});
      }
    } catch (err) {
      alert('Gagal memuat soal untuk sesi ini.');
      setSelectedSesi(null);
    } finally {
      setIsLoadingSoal(false);
    }
  };

  const handleBackToList = () => {
    setSelectedSesi(null);
  };

  // Format date helper
  const formatDeadline = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Format creation date
  const formatCreation = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Mock IoT toggle
  const toggleIot = () => {
    setIsIotConnected(!isIotConnected);
    // If disconnected, stop all simulations
    if (isIotConnected) {
      setIsSimulating({});
    }
  };

  // Mock Start/Stop Praktikum per question
  const toggleSimulasi = (id_soal) => {
    if (!isIotConnected) {
      showToast("Hubungkan ke IoT Broker terlebih dahulu!", "warning");
      return;
    }
    setIsSimulating(prev => ({
      ...prev,
      [id_soal]: !prev[id_soal]
    }));
  };

  // API Save Handlers
  const handleSaveTeori = async (id_soal) => {
    const jawaban = teoriAnswers[id_soal];
    if (!jawaban) {
      showToast('Silakan isi jawaban terlebih dahulu.', 'warning');
      return;
    }
    setIsSavingTeori(prev => ({ ...prev, [id_soal]: true }));
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/jawaban/teori`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_soal, jawaban_soal: parseFloat(jawaban) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('Jawaban teori berhasil disimpan/diperbarui!');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan jawaban teori.', 'danger');
    } finally {
      setIsSavingTeori(prev => ({ ...prev, [id_soal]: false }));
    }
  };

  const handleSavePraktikum = async (id_soal) => {
    const pData = praktikumAnswers[id_soal];
    const targetOhm = selectedOhmESP[id_soal];
    if (!pData.volt || !pData.ampere || !targetOhm) {
      showToast('Silakan lengkapi data volt, ampere, dan ohm terlebih dahulu.', 'warning');
      return;
    }
    setIsSavingPraktikum(prev => ({ ...prev, [id_soal]: true }));
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/jawaban/praktikum`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_soal, volt_sensor: parseFloat(pData.volt), ohm_sensor: parseFloat(targetOhm), ampere_sensor: parseFloat(pData.ampere)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('Data praktikum berhasil disimpan/diperbarui!');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan data praktikum.', 'danger');
    } finally {
      setIsSavingPraktikum(prev => ({ ...prev, [id_soal]: false }));
    }
  };

  const handleSaveAnalisis = async () => {
    if (!analisisText) {
      showToast('Silakan isi analisis terlebih dahulu.', 'warning');
      return;
    }
    setIsSavingAnalisis(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/jawaban/analisis`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sesi: selectedSesi.id_sesi, analisis_siswa: analisisText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('Laporan analisis berhasil disimpan/diperbarui!');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan analisis.', 'danger');
    } finally {
      setIsSavingAnalisis(false);
    }
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

  if (!selectedSesi) {
    // RENDER LIST OF ACTIVE SESSIONS
    if (activeSessions.length === 0) {
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

    return (
      <div>
        <div className="page-header">
          <h2>Daftar Kuis Aktif</h2>
          <p>Pilih sesi soal di bawah ini untuk mulai mengerjakan kuis dan praktikum.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {activeSessions.map((sesi) => (
            <div 
              key={sesi.id_sesi} 
              onClick={() => handleSelectSesi(sesi)}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  background: sesi.tipe === 'Utama' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                  color: sesi.tipe === 'Utama' ? 'var(--primary)' : 'var(--warning)', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {sesi.tipe === 'Utama' ? `Sesi Utama (Sesi ${sesi.sesi})` : `Remidi - Sesi ${sesi.sesi}`}
                </span>
              </div>
              
              <div style={{ marginTop: '8px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-light)' }}>Tanggal Dibuat:</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{formatCreation(sesi.tanggal_pembuatan)}</p>
              </div>
              
              <div style={{ marginTop: '4px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--text-light)' }}>Tenggang Waktu (Tutup):</p>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {formatDeadline(sesi.tenggang_waktu)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // RENDER SOAL SPLIT SCREEN
  return (
    <div style={{ position: 'relative', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <button 
            onClick={handleBackToList}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-medium)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              padding: 0,
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Kembali ke Daftar Sesi
          </button>
          
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: selectedSesi.tipe === 'Utama' ? 'var(--primary)' : 'var(--warning)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '14px' }}>
              {selectedSesi.tipe === 'Utama' ? 'Utama' : 'Remidi'}
            </span>
            Tugas {selectedSesi.tipe?.toLowerCase() === 'remidi' ? 'Remidi' : 'Sesi'} {selectedSesi.sesi}
          </h2>
          <p style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--danger)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Tutup: {formatDeadline(selectedSesi.tenggang_waktu)}
          </p>
        </div>
      </div>

      {isLoadingSoal ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>Memuat soal...</div>
      ) : soalList.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Tidak ada data soal untuk sesi ini.</div>
      ) : (
        <>
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
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-medium)' }}>Hitung nilai Arus (miliAmpere / mA) berdasarkan Hukum Ohm (I = V / R)</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {soalList.map((item, index) => (
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
                      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', display: 'block', marginBottom: '8px' }}>Jawaban Arus (I) Teoritis (mA):</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="Contoh: 22.73"
                            className="form-input" 
                            style={{ paddingRight: '40px', background: '#fff' }}
                            value={teoriAnswers[item.id_soal] || ''}
                            onChange={(e) => handleTeoriChange(item.id_soal, e.target.value)}
                          />
                          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-medium)', fontWeight: 600 }}>mA</span>
                        </div>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleSaveTeori(item.id_soal)}
                          disabled={isSavingTeori[item.id_soal]}
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          {isSavingTeori[item.id_soal] ? 'Loading...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Praktikum */}
            <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--background)', paddingBottom: '16px' }}>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {soalList.map((item, index) => {
                  const simulating = isSimulating[item.id_soal];
                  return (
                    <div key={`praktikum-${item.id_soal}`} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                      {simulating && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--success)', animation: 'pulse 1.5s infinite' }}></div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Target Soal {index + 1}
                          <span style={{ fontSize: '12px', background: 'var(--background)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-medium)', fontWeight: 'normal' }}>
                            R: {item.ohm}Ω | V: {item.volt}V
                          </span>
                        </h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select 
                            className="form-input" 
                            style={{ padding: '6px 24px 6px 10px', fontSize: '12px', height: 'auto', backgroundPosition: 'right 6px center', width: 'auto' }}
                            value={selectedOhmESP[item.id_soal] || ''}
                            onChange={(e) => setSelectedOhmESP({...selectedOhmESP, [item.id_soal]: e.target.value})}
                            disabled={simulating}
                          >
                            <option value="220">220 Ω</option>
                            <option value="330">330 Ω</option>
                            <option value="470">470 Ω</option>
                            <option value="680">680 Ω</option>
                          </select>
                          <button 
                            className={simulating ? "btn-secondary" : "btn-primary"} 
                            style={simulating ? { background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderColor: 'transparent', padding: '6px 12px', fontSize: '12px' } : { background: 'var(--success)', padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => toggleSimulasi(item.id_soal)}
                          >
                            {simulating ? 'Stop Pembacaan' : 'Start Praktikum'}
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)', display: 'block', marginBottom: '8px' }}>Volt (Sensor)</label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="5.12"
                              className="form-input" 
                              style={{ paddingRight: '30px' }}
                              value={praktikumAnswers[item.id_soal]?.volt || ''}
                              onChange={(e) => handlePraktikumChange(item.id_soal, 'volt', e.target.value)}
                            />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '14px' }}>V</span>
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)', display: 'block', marginBottom: '8px' }}>miliAmpere (Sensor)</label>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="22.73"
                              className="form-input" 
                              style={{ paddingRight: '30px' }}
                              value={praktikumAnswers[item.id_soal]?.ampere || ''}
                              onChange={(e) => handlePraktikumChange(item.id_soal, 'ampere', e.target.value)}
                            />
                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '14px' }}>mA</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning-dark)" strokeWidth="2">
                            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
                          </svg>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                            Suhu Praktikum: <span style={{ color: 'var(--primary)' }}>{simulating ? suhuSensor : '--'} °C</span>
                          </span>
                        </div>
                        <button 
                          className="btn-primary" 
                          onClick={() => handleSavePraktikum(item.id_soal)}
                          disabled={isSavingPraktikum[item.id_soal] || !isIotConnected || !simulating}
                          style={{ padding: '8px 16px', fontSize: '13px', opacity: (!isIotConnected || !simulating) ? 0.5 : 1, cursor: (!isIotConnected || !simulating) ? 'not-allowed' : 'pointer' }}
                        >
                          {isSavingPraktikum[item.id_soal] ? 'Loading...' : 'Simpan Jawaban'}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
              style={{ resize: 'vertical', marginBottom: '16px' }}
            ></textarea>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                onClick={handleSaveAnalisis}
                disabled={isSavingAnalisis}
                style={{ padding: '10px 20px' }}
              >
                {isSavingAnalisis ? 'Menyimpan...' : 'Simpan Analisis'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          background: toast.type === 'danger' ? 'var(--danger)' : toast.type === 'warning' ? 'var(--warning)' : 'var(--success)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

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

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SiswaSoal;
