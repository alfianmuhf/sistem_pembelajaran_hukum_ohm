import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const PenilaianGuru = () => {
  const [kelasList, setKelasList] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSesi, setSelectedSesi] = useState('');
  
  const [siswaList, setSiswaList] = useState([]);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  
  const [nilaiPraktikum, setNilaiPraktikum] = useState('');
  const [nilaiAnalisis, setNilaiAnalisis] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch classes and sessions on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = sessionStorage.getItem('ohm_session_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [kelasRes, sesiRes] = await Promise.all([
          fetch(`${API_URL}/kelas`, { headers }),
          fetch(`${API_URL}/sesi`, { headers })
        ]);

        if (kelasRes.ok && sesiRes.ok) {
          const allKelasData = await kelasRes.json();
          const allSesiData = await sesiRes.json();
          
          const userData = JSON.parse(atob(token.split('.')[1]));
          const myClasses = allKelasData.filter(k => k.id_guru === userData.id);
          setKelasList(myClasses);
          
          // Filter sessions that belong to my classes
          const myClassIds = myClasses.map(c => c.id_kelas);
          const mySessions = allSesiData.filter(s => myClassIds.includes(s.id_kelas));
          setSesiList(mySessions);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch students when a session is selected
  useEffect(() => {
    if (!selectedSesi) {
      setSiswaList([]);
      setIsDeadlinePassed(false);
      return;
    }

    const fetchSiswa = async () => {
      setIsLoading(true);
      setError('');
      try {
        const token = sessionStorage.getItem('ohm_session_token');
        const res = await fetch(`${API_URL}/penilaian/sesi/${selectedSesi}/siswa`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal mengambil data siswa');
        
        setSiswaList(data.siswa);
        setIsDeadlinePassed(data.isDeadlinePassed);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiswa();
  }, [selectedSesi]);

  // Handle View Detail
  const handleViewDetail = async (siswa) => {
    setSelectedSiswa(siswa);
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setNilaiPraktikum('');
    setNilaiAnalisis('');

    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/penilaian/detail/${selectedSesi}/${siswa.id_siswa}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengambil detail');
      
      setDetailData(data);
      if (data.nilai) {
        setNilaiPraktikum(data.nilai.nilai_praktikum?.toString() || '0');
        setNilaiAnalisis(data.nilai.nilai_analisis?.toString() || '0');
      } else {
        setNilaiPraktikum('0');
        setNilaiAnalisis('0');
      }
    } catch (err) {
      alert(err.message);
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle Save Nilai
  const handleSaveNilai = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/penilaian/simpan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_sesi: selectedSesi,
          id_siswa: selectedSiswa.id_siswa,
          nilai_praktikum: nilaiPraktikum,
          nilai_analisis: nilaiAnalisis
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan nilai');
      
      // Update local list
      setSiswaList(prev => prev.map(s => {
        if (s.id_siswa === selectedSiswa.id_siswa) {
          return { ...s, total_nilai: data.total_nilai, status: 'Sudah Dinilai' };
        }
        return s;
      }));

      setIsDetailOpen(false);
      alert('Nilai berhasil disimpan!');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter sessions dropdown based on selected class
  const availableSesi = sesiList.filter(s => s.id_kelas === parseInt(selectedKelas));

  return (
    <>
      <div className="page-header">
        <h2>Penilaian Hasil Praktikum & Kuis</h2>
        <p>Periksa dan beri nilai hasil pengerjaan siswa secara manual untuk laporan praktikum dan analisis.</p>
      </div>

      {/* Filter Section */}
      <div style={{
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px',
        border: '1px solid var(--border)',
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Pilih Kelas
          </label>
          <select 
            className="form-input" 
            value={selectedKelas} 
            onChange={e => {
              setSelectedKelas(e.target.value);
              setSelectedSesi('');
            }}
          >
            <option value="">-- Pilih Kelas --</option>
            {kelasList.map(k => (
              <option key={k.id_kelas} value={k.id_kelas}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
            Pilih Sesi
          </label>
          <select 
            className="form-input" 
            value={selectedSesi} 
            onChange={e => setSelectedSesi(e.target.value)}
            disabled={!selectedKelas}
          >
            <option value="">-- Pilih Sesi --</option>
            {availableSesi.map(s => (
              <option key={s.id_sesi} value={s.id_sesi}>Sesi {s.sesi} - {s.tipe}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Info */}
      {selectedSesi && !isLoading && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '16px', 
          borderRadius: 'var(--radius-md)', 
          background: isDeadlinePassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${isDeadlinePassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          {isDeadlinePassed ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          )}
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: isDeadlinePassed ? 'var(--success)' : 'var(--warning-dark)', fontSize: '15px' }}>
              {isDeadlinePassed ? 'Sesi Telah Berakhir' : 'Sesi Masih Berjalan'}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-medium)' }}>
              {isDeadlinePassed 
                ? 'Tenggang waktu sesi ini sudah berakhir. Anda dapat memberikan dan menyimpan nilai untuk seluruh siswa.' 
                : 'Tenggang waktu pengerjaan sesi ini belum berakhir. Nilai tidak dapat disimpan hingga sesi ditutup.'}
            </p>
          </div>
        </div>
      )}

      {/* Table Section */}
      {selectedSesi && (
        <div className="data-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>NIM</th>
                  <th>Nama Siswa</th>
                  <th>Status Penilaian</th>
                  <th style={{ textAlign: 'center' }}>Total Nilai</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                      Memuat daftar siswa...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--danger)' }}>
                      {error}
                    </td>
                  </tr>
                ) : siswaList.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                      Belum ada siswa di kelas ini.
                    </td>
                  </tr>
                ) : (
                  siswaList.map(siswa => (
                    <tr key={siswa.id_siswa}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{siswa.nim}</td>
                      <td>{siswa.nama_siswa}</td>
                      <td>
                        <span style={{ 
                          background: siswa.status === 'Sudah Dinilai' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: siswa.status === 'Sudah Dinilai' ? 'var(--success)' : 'var(--danger)', 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          fontWeight: 600 
                        }}>
                          {siswa.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: siswa.total_nilai !== null ? 'var(--primary)' : 'var(--text-light)' }}>
                        {siswa.total_nilai !== null ? siswa.total_nilai : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '6px 14px', fontSize: '13px' }}
                          onClick={() => handleViewDetail(siswa)}
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && (
        <div className="modal-overlay" onClick={() => !isSaving && setIsDetailOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <h3>Detail Penilaian - {selectedSiswa?.nama_siswa}</h3>
              <button className="modal-close" onClick={() => setIsDetailOpen(false)} disabled={isSaving}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                  Memuat detail jawaban...
                </div>
              ) : !detailData ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
                  Gagal memuat detail jawaban.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Bagian Teori & Praktikum (Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    
                    {/* Hasil Teori */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        Jawaban Teori (Auto-graded)
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {detailData.soal && detailData.soal.length > 0 ? detailData.soal.map((soal, idx) => {
                          const jwb = detailData.teori.find(t => t.id_soal === soal.id_soal)?.jawaban_soal;
                          const isCorrect = jwb !== undefined && jwb !== null && Math.abs(jwb - soal.ampere) <= 0.01;
                          return (
                            <div key={soal.id_soal} style={{ fontSize: '13px', background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div><strong>Soal {idx + 1}:</strong> {soal.volt}V / {soal.ohm}Ω = {soal.ampere}A</div>
                                <div style={{ color: 'var(--text-medium)', marginTop: '4px' }}>
                                  Jawaban Siswa: <strong>{jwb !== undefined && jwb !== null ? `${jwb} A` : 'Belum Dijawab'}</strong>
                                </div>
                              </div>
                              {isCorrect ? (
                                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '14px' }}>+25</span>
                              ) : (
                                <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '14px' }}>0</span>
                              )}
                            </div>
                          );
                        }) : (
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Tidak ada soal teori.</div>
                        )}
                      </div>
                    </div>

                    {/* Hasil Praktikum */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M4.93 4.93l2.83 2.83"></path><path d="M16.24 16.24l2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="M4.93 19.07l2.83-2.83"></path><path d="M16.24 7.76l2.83-2.83"></path></svg>
                        Hasil Praktikum IoT
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {detailData.soal && detailData.soal.length > 0 ? detailData.soal.map((soal, idx) => {
                          const prak = detailData.praktikum.find(p => p.id_soal === soal.id_soal);
                          return (
                            <div key={soal.id_soal} style={{ fontSize: '13px', background: '#fff', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                              <div style={{ marginBottom: '6px' }}><strong>Target Soal {idx + 1}:</strong> {soal.volt}V, {soal.ohm}Ω, {soal.ampere}A</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-medium)' }}>
                                <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                  V: {prak?.volt ?? '-'}
                                </div>
                                <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                  A: {prak?.ampere ?? '-'}
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>Tidak ada data praktikum.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Laporan Analisis */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                      Laporan Analisis & Kesimpulan
                    </h4>
                    <div style={{ 
                      fontSize: '14px', 
                      background: '#fff', 
                      padding: '16px', 
                      borderRadius: 'var(--radius-sm)', 
                      border: '1px solid #e2e8f0',
                      minHeight: '100px',
                      whiteSpace: 'pre-wrap',
                      color: detailData.analisis?.analisis_siswa ? 'var(--text-main)' : 'var(--text-light)'
                    }}>
                      {detailData.analisis?.analisis_siswa || 'Siswa belum mengisi laporan analisis.'}
                    </div>
                  </div>

                  {/* Form Penilaian Manual */}
                  <form onSubmit={handleSaveNilai} style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-main)' }}>Input Nilai Guru (Skala 0 - 100)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '8px' }}>Nilai Praktikum IoT</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0" 
                          max="100" 
                          required
                          disabled={!isDeadlinePassed || isSaving}
                          value={nilaiPraktikum}
                          onChange={(e) => setNilaiPraktikum(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '8px' }}>Nilai Analisis / Kesimpulan</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min="0" 
                          max="100" 
                          required
                          disabled={!isDeadlinePassed || isSaving}
                          value={nilaiAnalisis}
                          onChange={(e) => setNilaiAnalisis(e.target.value)}
                        />
                      </div>
                    </div>

                    {!isDeadlinePassed && (
                      <p style={{ fontSize: '13px', color: 'var(--danger)', margin: '0 0 16px 0' }}>
                        * Anda tidak dapat menyimpan nilai sebelum batas waktu sesi berakhir.
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" className="btn-secondary" onClick={() => setIsDetailOpen(false)} disabled={isSaving}>Batal</button>
                      <button type="submit" className="btn-primary" disabled={!isDeadlinePassed || isSaving}>
                        {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PenilaianGuru;
