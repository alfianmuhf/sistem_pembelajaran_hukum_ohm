import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

export default function SiswaNilai() {
  const [sesiList, setSesiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Popup detail states
  const [selectedSesi, setSelectedSesi] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchSesiList();
  }, []);

  const fetchSesiList = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/siswa/nilai`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data nilai');
      const data = await res.json();
      setSesiList(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (sesi) => {
    setSelectedSesi(sesi);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/siswa/nilai/${sesi.id_sesi}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil detail nilai');
      const data = await res.json();
      setDetailData(data);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedSesi(null);
    setDetailData(null);
  };

  const renderStatus = (nilai) => {
    const isDinilai = nilai && nilai.nilai_total !== null && nilai.nilai_total !== undefined;
    return (
      <div className={`status-badge ${isDinilai ? 'status-active' : 'status-inactive'}`}>
        <span className="status-dot"></span>
        {isDinilai ? 'Sudah Dinilai' : 'Belum Dinilai'}
      </div>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h2>Laporan Nilai Anda</h2>
        <p>Pantau rekapitulasi nilai kuis teori, nilai ketepatan praktikum IoT, nilai analisis, dan umpan balik dari guru pengampu.</p>
      </div>

      <div className="data-card">
        {error && <div className="alert-error">{error}</div>}
        
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Memuat data nilai...</div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Sesi</th>
                  <th>Tanggal</th>
                  <th>Nilai Soal</th>
                  <th>Nilai Praktikum</th>
                  <th>Nilai Analisis</th>
                  <th>Nilai Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const d = new Date();
                  const offset = 7 * 60 * 60 * 1000;
                  const now = new Date(d.getTime() + offset).toISOString().slice(0, 16);
                  const finishedSesiList = sesiList.filter(s => s.tenggang_waktu && s.tenggang_waktu < now);
                  
                  if (finishedSesiList.length === 0) {
                    return (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>Belum ada data nilai dari sesi yang sudah selesai.</td>
                      </tr>
                    );
                  }
                  
                  return finishedSesiList.map(sesi => (
                    <tr key={sesi.id_sesi}>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>Sesi {sesi.sesi}</strong>
                        {sesi.tipe?.toLowerCase() === 'remidi' && (
                          <span style={{ marginLeft: '8px', fontSize: '11px', padding: '3px 8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', fontWeight: 600 }}>Remidi</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-medium)' }}>{formatDate(sesi.tanggal_pembuatan)}</td>
                      <td style={{ fontWeight: 600 }}>{sesi.nilai?.nilai_soal ?? '-'}</td>
                      <td style={{ fontWeight: 600 }}>{sesi.nilai?.nilai_praktikum ?? '-'}</td>
                      <td style={{ fontWeight: 600 }}>{sesi.nilai?.nilai_analisis ?? '-'}</td>
                      <td>
                        {sesi.nilai?.nilai_total !== undefined && sesi.nilai?.nilai_total !== null ? (
                           <span style={{ fontWeight: 700, color: sesi.nilai.nilai_total >= 71 ? 'var(--success)' : 'var(--danger)' }}>
                             {sesi.nilai.nilai_total}
                           </span>
                        ) : <span style={{ color: 'var(--text-light)' }}>-</span>}
                      </td>
                      <td>{renderStatus(sesi.nilai)}</td>
                      <td>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <button 
                            className="btn-icon" 
                            title="Lihat Detail Soal" 
                            onClick={() => openDetail(sesi)}
                            style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP DETAIL JAWABAN */}
      {selectedSesi && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>Detail Jawaban - Sesi {selectedSesi.sesi} {selectedSesi.tipe?.toLowerCase() === 'remidi' ? '(Remidi)' : ''}</h3>
              <button className="modal-close" onClick={closeDetail}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="modal-body">
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Memuat detail...</div>
              ) : detailData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* RINGKASAN NILAI */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Nilai Soal (Otomatis)</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{detailData.nilai?.nilai_soal ?? '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Nilai Praktikum</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {detailData.nilai?.nilai_praktikum !== null && detailData.nilai?.nilai_praktikum !== undefined ? detailData.nilai.nilai_praktikum : <span style={{fontSize: '12px', color: '#ef4444', fontWeight: 'normal'}}>Belum Dinilai</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Nilai Analisis</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {detailData.nilai?.nilai_analisis !== null && detailData.nilai?.nilai_analisis !== undefined ? detailData.nilai.nilai_analisis : <span style={{fontSize: '12px', color: '#ef4444', fontWeight: 'normal'}}>Belum Dinilai</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Total Nilai</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: detailData.nilai?.nilai_total >= 71 ? 'var(--primary)' : (detailData.nilai?.nilai_total ? 'var(--danger)' : 'inherit') }}>
                        {detailData.nilai?.nilai_total !== null && detailData.nilai?.nilai_total !== undefined ? detailData.nilai.nilai_total : <span style={{fontSize: '12px', color: '#ef4444', fontWeight: 'normal'}}>Belum Dinilai</span>}
                      </div>
                    </div>
                  </div>

                  {/* DAFTAR SOAL DAN JAWABAN */}
                  <div>
                    <h4 style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Rincian Pengerjaan Kuis</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {detailData.soal && detailData.soal.map((soal, index) => {
                        const j_teori = detailData.teori.find(t => t.id_soal === soal.id_soal);
                        const j_praktikum = detailData.praktikum.find(p => p.id_soal === soal.id_soal);
                        
                        return (
                          <div key={soal.id_soal} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Soal {index + 1}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              
                              {/* Kolom Teori */}
                              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--primary)' }}>Perhitungan Teori</div>
                                <div style={{ fontSize: '13px', marginBottom: '4px' }}>Target: <strong>{soal.volt} V</strong> / <strong>{soal.ohm} Ω</strong></div>
                                <div style={{ fontSize: '13px' }}>Jawaban Anda: <strong>{j_teori?.jawaban_soal ?? '-'} A</strong></div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Kunci: {soal.ampere} A (Toleransi ±0.01)</div>
                              </div>

                              {/* Kolom Praktikum */}
                              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent)' }}>Pembacaan Praktikum IoT</div>
                                <div style={{ fontSize: '13px', marginBottom: '4px' }}>Volt Sensor: <strong>{j_praktikum?.volt_sensor ?? '-'} V</strong></div>
                                <div style={{ fontSize: '13px', marginBottom: '4px' }}>Ohm Target: <strong>{j_praktikum?.ohm_sensor ?? '-'} Ω</strong></div>
                                <div style={{ fontSize: '13px' }}>Ampere Sensor: <strong>{j_praktikum?.ampere_sensor ?? '-'} A</strong></div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ANALISIS */}
                  <div>
                    <h4 style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Laporan Analisis & Kesimpulan</h4>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                      {detailData.analisis?.analisis_siswa || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Tidak ada laporan analisis yang dikirimkan.</span>}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
