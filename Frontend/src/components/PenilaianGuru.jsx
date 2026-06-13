import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const PenilaianGuru = () => {
  const [kelasList, setKelasList] = useState([]);
  const [sesiList, setSesiList] = useState([]);
  const [siswaList, setSiswaList] = useState([]);
  const [nilaiList, setNilaiList] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  
  const [nilaiPraktikum, setNilaiPraktikum] = useState('');
  const [nilaiAnalisis, setNilaiAnalisis] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // UI States
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [collapsedClasses, setCollapsedClasses] = useState({});
  const [collapsedSessions, setCollapsedSessions] = useState({});

  // Remidi States
  const [selectedRemidi, setSelectedRemidi] = useState([]);
  const [isRemidiModalOpen, setIsRemidiModalOpen] = useState(false);
  const [remidiDeadline, setRemidiDeadline] = useState('');
  const [isRemidiSubmitting, setIsRemidiSubmitting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };


  // Helper function: Check if session deadline has passed
  const isExpired = (tenggang_waktu) => {
    if (!tenggang_waktu) return true;
    const d = new Date();
    const offset = 7 * 60 * 60 * 1000;
    const localDate = new Date(d.getTime() + offset);
    const now = localDate.toISOString().replace('Z', '');
    return tenggang_waktu < now;
  };

  const fetchRekap = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/penilaian/rekap`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal mengambil rekap nilai');
      
      setKelasList(data.kelas || []);
      setSesiList(data.sesi || []);
      setSiswaList(data.siswa || []);
      setNilaiList(data.nilai || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, []);

  // Handle View Detail
  const handleViewDetail = async (siswa, sesi) => {
    setSelectedSiswa(siswa);
    setSelectedSesi(sesi);
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setNilaiPraktikum('');
    setNilaiAnalisis('');

    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/penilaian/detail/${sesi.id_sesi}/${siswa.id_siswa}`, {
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
          id_sesi: selectedSesi.id_sesi,
          id_siswa: selectedSiswa.id_siswa,
          nilai_praktikum: nilaiPraktikum,
          nilai_analisis: nilaiAnalisis
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan nilai');
      
      // Update local nilai list
      setNilaiList(prev => {
        const pVal = nilaiPraktikum === '' ? null : Number(nilaiPraktikum);
        const aVal = nilaiAnalisis === '' ? null : Number(nilaiAnalisis);
        
        const existingIndex = prev.findIndex(n => n.id_siswa === selectedSiswa.id_siswa && n.id_sesi === selectedSesi.id_sesi);
        if (existingIndex >= 0) {
          const newList = [...prev];
          newList[existingIndex] = { ...newList[existingIndex], nilai_total: data.nilai_total, nilai_praktikum: pVal, nilai_analisis: aVal };
          return newList;
        } else {
          return [...prev, { id_siswa: selectedSiswa.id_siswa, id_sesi: selectedSesi.id_sesi, nilai_total: data.nilai_total, nilai_praktikum: pVal, nilai_analisis: aVal }];
        }
      });

      setIsDetailOpen(false);
      showToast('Nilai berhasil disimpan!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Toggle Remidi Checkbox
  const handleToggleRemidi = (id_sesi, id_siswa) => {
    setSelectedRemidi(prev => {
      const exists = prev.find(item => item.id_sesi === id_sesi && item.id_siswa === id_siswa);
      if (exists) {
        return prev.filter(item => !(item.id_sesi === id_sesi && item.id_siswa === id_siswa));
      } else {
        return [...prev, { id_sesi, id_siswa }];
      }
    });
  };

  // Handle Submit Remidi
  const handleSubmitRemidi = async (e) => {
    e.preventDefault();
    if (!remidiDeadline) return;
    setIsRemidiSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      
      // Group by id_sesi
      const grouped = selectedRemidi.reduce((acc, curr) => {
         if (!acc[curr.id_sesi]) acc[curr.id_sesi] = [];
         acc[curr.id_sesi].push(curr.id_siswa);
         return acc;
      }, {});

      const promises = Object.keys(grouped).map(async (id_sesi) => {
        const res = await fetch(`${API_URL}/sesi/remidi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            id_sesi_sebelum: id_sesi,
            tenggang_waktu: remidiDeadline,
            siswa_ids: grouped[id_sesi]
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal membuat remidi');
        return data;
      });

      await Promise.all(promises);
      
      showToast('Sesi Remidi berhasil dibuat!', 'success');
      setIsRemidiModalOpen(false);
      setSelectedRemidi([]);
      setRemidiDeadline('');
      fetchRekap(); // Refresh data
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsRemidiSubmitting(false);
    }
  };

  const isDeadlinePassedForDetail = selectedSesi ? isExpired(selectedSesi.tenggang_waktu) : false;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Penilaian Hasil Praktikum & Kuis</h2>
          <p>Daftar seluruh siswa berdasarkan kelas dan sesi. Klik "Lihat Detail" untuk memeriksa dan menginput nilai manual.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {selectedRemidi.length > 0 && (
            <button 
              className="btn-primary" 
              onClick={() => setIsRemidiModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent)' }}
            >
              Buat Sesi Remidi ({selectedRemidi.length})
            </button>
          )}
          <button className="btn-secondary" onClick={fetchRekap} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Grouped Table Section */}
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
                <th style={{ textAlign: 'center' }}>Pilih Remidi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
                    {error}
                  </td>
                </tr>
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                    Anda belum mengajar kelas manapun.
                  </td>
                </tr>
              ) : (
                kelasList.map(kelas => {
                  const sesiKelas = sesiList.filter(s => s.id_kelas === kelas.id_kelas);
                  const siswaKelas = siswaList.filter(s => s.id_kelas === kelas.id_kelas);
                  
                  if (siswaKelas.length === 0 && sesiKelas.length === 0) return null;

                  return (
                    <React.Fragment key={kelas.id_kelas}>
                      {/* Kelas Header */}
                      <tr 
                        style={{ background: 'rgba(59, 130, 246, 0.05)', cursor: 'pointer' }}
                        onClick={() => setCollapsedClasses(prev => ({...prev, [kelas.id_kelas]: !prev[kelas.id_kelas]}))}
                      >
                        <td colSpan="6" style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid rgba(59, 130, 246, 0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                              Kelas: {kelas.nama_kelas}
                            </div>
                            <svg 
                              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                              style={{ transform: collapsedClasses[kelas.id_kelas] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                        </td>
                      </tr>

                      {!collapsedClasses[kelas.id_kelas] && (sesiKelas.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            Belum ada sesi di kelas ini.
                          </td>
                        </tr>
                      ) : (
                        sesiKelas.map(sesi => {
                          const isPastDeadline = isExpired(sesi.tenggang_waktu);
                          return (
                            <React.Fragment key={sesi.id_sesi}>
                              {/* Sesi Sub-Header */}
                              <tr 
                                style={{ background: '#f8fafc', cursor: 'pointer' }}
                                onClick={() => setCollapsedSessions(prev => ({...prev, [sesi.id_sesi]: !prev[sesi.id_sesi]}))}
                              >
                                <td colSpan="6" style={{ padding: '10px 20px', paddingLeft: '40px', fontWeight: 700, color: 'var(--text-main)', borderBottom: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      Sesi {sesi.sesi} - {sesi.tipe}
                                      <span style={{ 
                                        fontSize: '11px', 
                                        padding: '2px 8px', 
                                        borderRadius: '10px', 
                                        background: isPastDeadline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: isPastDeadline ? 'var(--success)' : 'var(--warning-dark)'
                                      }}>
                                        {isPastDeadline ? 'Berakhir' : 'Berjalan'}
                                      </span>
                                    </div>
                                    <svg 
                                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                      style={{ transform: collapsedSessions[sesi.id_sesi] ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--text-light)' }}
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* Siswa Rows for this Sesi */}
                              {!collapsedSessions[sesi.id_sesi] && (siswaKelas.length === 0 ? (
                                <tr>
                                  <td colSpan="6" style={{ textAlign: 'center', padding: '16px', paddingLeft: '60px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                    Belum ada siswa terdaftar.
                                  </td>
                                </tr>
                              ) : (
                                siswaKelas.map(siswa => {
                                  const nilai = nilaiList.find(n => n.id_siswa === siswa.id_siswa && n.id_sesi === sesi.id_sesi);
                                  const isDinilai = nilai && (
                                    (nilai.nilai_praktikum !== null && nilai.nilai_praktikum !== undefined) || 
                                    (nilai.nilai_analisis !== null && nilai.nilai_analisis !== undefined)
                                  );
                                  const statusStr = isDinilai ? 'Sudah Dinilai' : 'Belum Dinilai';
                                  
                                  return (
                                    <tr key={`${sesi.id_sesi}-${siswa.id_siswa}`}>
                                      <td style={{ paddingLeft: '40px', fontWeight: 600, color: 'var(--text-medium)' }}>{siswa.nim}</td>
                                      <td>{siswa.nama_siswa}</td>
                                      <td>
                                        <span style={{ 
                                          background: isDinilai ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                          color: isDinilai ? 'var(--success)' : 'var(--danger)', 
                                          padding: '4px 10px', 
                                          borderRadius: '12px', 
                                          fontSize: '12px', 
                                          fontWeight: 600 
                                        }}>
                                          {statusStr}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'center', fontWeight: 800, color: nilai && nilai.nilai_total !== null ? (nilai.nilai_total >= 71 ? 'var(--primary)' : 'var(--danger)') : 'var(--text-light)' }}>
                                        {nilai ? nilai.nilai_total : '-'}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        <button 
                                          className="btn-primary" 
                                          style={{ padding: '6px 14px', fontSize: '13px' }}
                                          onClick={() => handleViewDetail(siswa, sesi)}
                                        >
                                          Lihat Detail
                                        </button>
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        {(nilai && nilai.nilai_total !== null && nilai.nilai_total < 71) ? (
                                          <input 
                                            type="checkbox" 
                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            checked={!!selectedRemidi.find(item => item.id_sesi === sesi.id_sesi && item.id_siswa === siswa.id_siswa)}
                                            onChange={() => handleToggleRemidi(sesi.id_sesi, siswa.id_siswa)}
                                          />
                                        ) : (
                                          <span style={{ color: 'var(--text-light)', fontSize: '12px' }}>-</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })
                              ))}
                            </React.Fragment>
                          );
                        })
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedSiswa && selectedSesi && (
        <div className="modal-overlay" onClick={() => !isSaving && setIsDetailOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <div>
                <h3 style={{ margin: 0 }}>Detail Penilaian - {selectedSiswa.nama_siswa}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-medium)' }}>Sesi {selectedSesi.sesi} ({selectedSesi.tipe})</p>
              </div>
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
                  
                  {/* Status Info in Modal */}
                  <div style={{ 
                    padding: '12px 16px', 
                    borderRadius: 'var(--radius-md)', 
                    background: isDeadlinePassedForDetail ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${isDeadlinePassedForDetail ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {isDeadlinePassedForDetail ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    )}
                    <span style={{ fontSize: '13px', color: isDeadlinePassedForDetail ? 'var(--success)' : 'var(--warning-dark)' }}>
                      {isDeadlinePassedForDetail 
                        ? 'Sesi ini telah berakhir. Anda dapat menyimpan nilai.' 
                        : 'Sesi masih berjalan. Nilai tidak dapat disimpan sebelum tenggang waktu berakhir.'}
                    </span>
                  </div>

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
                                <div><strong>Soal {idx + 1}:</strong> {soal.volt}V / {soal.ohm}Ω = {soal.ampere} mA</div>
                                <div style={{ color: 'var(--text-medium)', marginTop: '4px' }}>
                                  Jawaban Siswa: <strong>{jwb !== undefined && jwb !== null ? `${jwb} mA` : 'Belum Dijawab'}</strong>
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
                              <div style={{ marginBottom: '6px' }}><strong>Target Soal {idx + 1}:</strong> {soal.volt}V, {soal.ohm}Ω, {soal.ampere} mA</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', color: 'var(--text-medium)' }}>
                                <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                  V: {prak?.volt ?? '-'}
                                </div>
                                <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                                  mA: {prak?.ampere ?? '-'}
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
                          disabled={!isDeadlinePassedForDetail || isSaving}
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
                          disabled={!isDeadlinePassedForDetail || isSaving}
                          value={nilaiAnalisis}
                          onChange={(e) => setNilaiAnalisis(e.target.value)}
                        />
                      </div>
                    </div>

                    {!isDeadlinePassedForDetail && (
                      <p style={{ fontSize: '13px', color: 'var(--danger)', margin: '0 0 16px 0' }}>
                        * Anda tidak dapat menyimpan nilai sebelum batas waktu sesi berakhir.
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="button" className="btn-secondary" onClick={() => setIsDetailOpen(false)} disabled={isSaving}>Batal</button>
                      <button type="submit" className="btn-primary" disabled={!isDeadlinePassedForDetail || isSaving}>
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

      {/* Remidi Deadline Modal */}
      {isRemidiModalOpen && (
        <div className="modal-overlay" onClick={() => !isRemidiSubmitting && setIsRemidiModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Buat Sesi Remidi</h3>
              <button className="modal-close" onClick={() => setIsRemidiModalOpen(false)} disabled={isRemidiSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitRemidi}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-medium)', margin: '0 0 16px 0' }}>
                  Sesi Remidi akan di-generate untuk <strong>{selectedRemidi.length}</strong> siswa terpilih. Silakan tentukan tenggang waktu pengerjaannya.
                </p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '8px' }}>
                    Tenggang Waktu (Deadline)
                  </label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    required
                    disabled={isRemidiSubmitting}
                    value={remidiDeadline}
                    onChange={(e) => setRemidiDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsRemidiModalOpen(false)} disabled={isRemidiSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={isRemidiSubmitting}>
                  {isRemidiSubmitting ? 'Memproses...' : 'Buat Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: toast.type === 'success' ? '#10b981' : '#ef4444',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transform: toast.show ? 'translateX(0)' : 'translateX(120%)',
        opacity: toast.show ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999
      }}>
        {toast.type === 'success' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        )}
        <span style={{ fontWeight: 500, fontSize: '14px' }}>{toast.message}</span>
      </div>
    </>
  );
};

export default PenilaianGuru;
