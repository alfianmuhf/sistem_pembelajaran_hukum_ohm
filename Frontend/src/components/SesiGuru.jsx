import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const SesiGuru = () => {
  const [sesiList, setSesiList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddUtamaOpen, setIsAddUtamaOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alertPopup, setAlertPopup] = useState({ isOpen: false, message: '', type: 'success' });

  // Form states
  const [addUtamaData, setAddUtamaData] = useState({ id_kelas: '', tenggang_waktu: '' });
  const [editSesiData, setEditSesiData] = useState({ id_sesi: null, tenggang_waktu: '' });
  const [sesiToDelete, setSesiToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to format Date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Convert DB timestamp to datetime-local input format (YYYY-MM-DDTHH:mm)
  const formatForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Fetch Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [sesiRes, kelasRes] = await Promise.all([
        fetch(`${API_URL}/sesi`, { headers }),
        fetch(`${API_URL}/kelas`, { headers })
      ]);

      if (!sesiRes.ok) throw new Error('Gagal mengambil data sesi');
      if (!kelasRes.ok) throw new Error('Gagal mengambil data kelas');

      const sesiData = await sesiRes.json();
      const allKelasData = await kelasRes.json();

      setSesiList(sesiData);
      
      const userData = JSON.parse(atob(token.split('.')[1]));
      const myClasses = allKelasData.filter(k => k.id_guru === userData.id);
      setKelasList(myClasses);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Add Utama
  const handleAddUtama = async (e) => {
    e.preventDefault();
    if (!addUtamaData.id_kelas || !addUtamaData.tenggang_waktu) return;
    
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/sesi/utama`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addUtamaData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan sesi');
      
      setSesiList([data.sesi, ...sesiList]);
      setAddUtamaData({ id_kelas: '', tenggang_waktu: '' });
      setIsAddUtamaOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit
  const openEditModal = (sesi) => {
    setEditSesiData({
      id_sesi: sesi.id_sesi,
      tenggang_waktu: formatForInput(sesi.tenggang_waktu)
    });
    setIsEditModalOpen(true);
  };

  const handleEditSesi = async (e) => {
    e.preventDefault();
    if (!editSesiData.tenggang_waktu) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/sesi/${editSesiData.id_sesi}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tenggang_waktu: editSesiData.tenggang_waktu })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui sesi');

      setSesiList(sesiList.map(s => s.id_sesi === editSesiData.id_sesi ? data.sesi : s));
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Delete
  const openDeleteModal = (sesi) => {
    setSesiToDelete(sesi);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!sesiToDelete) return;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/sesi/${sesiToDelete.id_sesi}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menghapus sesi');
      }
      
      setSesiList(sesiList.filter(s => s.id_sesi !== sesiToDelete.id_sesi));
      setIsDeleteModalOpen(false);
      setSesiToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Generate Missing Soal
  const handleGenerateMissing = async (sesi) => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/sesi/${sesi.id_sesi}/generate-missing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal meng-generate soal');
      setAlertPopup({ isOpen: true, message: data.message, type: 'success' });
    } catch (err) {
      setAlertPopup({ isOpen: true, message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpired = (tenggang_waktu) => {
    if (!tenggang_waktu) return true;
    const d = new Date();
    const offset = 7 * 60 * 60 * 1000;
    const localDate = new Date(d.getTime() + offset);
    const now = localDate.toISOString().replace('Z', '');
    return tenggang_waktu < now;
  };

  // --- GROUPING LOGIC ---
  const groupedSesi = sesiList.reduce((acc, sesi) => {
    const kelasName = sesi.kelas?.nama_kelas || 'Kelas Tidak Diketahui';
    if (!acc[kelasName]) acc[kelasName] = [];
    acc[kelasName].push(sesi);
    return acc;
  }, {});

  const sortedClassNames = Object.keys(groupedSesi).sort();

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Manajemen Sesi Soal</h2>
          <p>Kelola pembuatan kuis (Sesi Utama) untuk setiap kelas yang Anda ajar.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary" onClick={() => setIsAddUtamaOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Tambah Sesi Utama
          </button>
        </div>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Detail Sesi</th>
                <th>Tipe</th>
                <th>Tanggal Pembuatan</th>
                <th>Tenggang Waktu (Tutup)</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--danger)' }}>
                    {error}
                  </td>
                </tr>
              ) : sortedClassNames.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                    Belum ada sesi yang dibuat untuk kelas Anda.
                  </td>
                </tr>
              ) : (
                sortedClassNames.map(className => (
                  <React.Fragment key={className}>
                    {/* Header Kelas */}
                    <tr style={{ background: 'rgba(241, 245, 249, 0.7)' }}>
                      <td colSpan="5" style={{ padding: '12px 20px', fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid rgba(226, 232, 240, 1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          Kelas: {className}
                        </div>
                      </td>
                    </tr>
                    
                    {groupedSesi[className].map((utama) => {
                      const expired = isExpired(utama.tenggang_waktu);
                      return (
                      <tr key={utama.id_sesi}>
                        <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {utama.tipe?.toLowerCase() === 'remidi' ? `Remidi Sesi ${utama.sesi}` : `Sesi ${utama.sesi}`}
                        </td>
                        <td>
                          <span style={{ 
                            background: utama.tipe?.toLowerCase() === 'remidi' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                            color: utama.tipe?.toLowerCase() === 'remidi' ? 'var(--danger)' : 'var(--primary)', 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '12px', 
                            fontWeight: 600 
                          }}>
                            {utama.tipe}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-medium)' }}>{formatDate(utama.tanggal_pembuatan)}</td>
                        <td style={{ fontWeight: 600 }}>{formatDate(utama.tenggang_waktu)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-icon" 
                              title={expired ? "Sesi Berakhir (Tidak Bisa Generate)" : "Generate Soal untuk Siswa Baru"}
                              onClick={() => handleGenerateMissing(utama)}
                              disabled={expired || isSubmitting}
                              style={{ 
                                background: expired ? 'rgba(156, 163, 175, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                                color: expired ? 'var(--text-light)' : 'var(--success)',
                                borderColor: 'transparent',
                                opacity: expired ? 0.6 : 1,
                                cursor: expired ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 2v6h-6"></path>
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                              </svg>
                            </button>
                            <button className="btn-icon btn-edit" title="Edit Tenggang Waktu" onClick={() => openEditModal(utama)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </button>
                            <button className="btn-icon btn-delete" title="Hapus Sesi" onClick={() => openDeleteModal(utama)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Sesi Utama */}
      {isAddUtamaOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsAddUtamaOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Sesi Utama Baru</h3>
              <button className="modal-close" onClick={() => setIsAddUtamaOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddUtama}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="modal-desc" style={{ marginBottom: 0 }}>Pilih kelas. Nomor sesi akan diisi otomatis sebagai kelanjutan dari sesi terakhir kelas tersebut.</p>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="kelasUtamaAdd">Pilih Kelas</label>
                  <div className="input-wrapper">
                    <select
                      id="kelasUtamaAdd"
                      className="form-input"
                      style={{ appearance: 'none' }}
                      value={addUtamaData.id_kelas}
                      onChange={(e) => setAddUtamaData({...addUtamaData, id_kelas: e.target.value})}
                      disabled={isSubmitting}
                      required
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {kelasList.map(kelas => (
                        <option key={kelas.id_kelas} value={kelas.id_kelas}>
                          {kelas.nama_kelas}
                        </option>
                      ))}
                    </select>
                    <svg style={{ position: 'absolute', right: '16px', top: '14px', pointerEvents: 'none', color: 'var(--text-light)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tenggangUtamaAdd">Batas Waktu Pengerjaan (Tenggang Waktu)</label>
                  <div className="input-wrapper">
                    <input
                      id="tenggangUtamaAdd"
                      className="form-input"
                      type="datetime-local"
                      value={addUtamaData.tenggang_waktu}
                      onChange={(e) => setAddUtamaData({...addUtamaData, tenggang_waktu: e.target.value})}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddUtamaOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!addUtamaData.id_kelas || !addUtamaData.tenggang_waktu || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tenggang Waktu */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Waktu Pengerjaan</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSesi}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="editTenggangWaktu">Batas Waktu Pengerjaan Baru</label>
                  <div className="input-wrapper">
                    <input
                      id="editTenggangWaktu"
                      className="form-input"
                      type="datetime-local"
                      value={editSesiData.tenggang_waktu}
                      onChange={(e) => setEditSesiData({...editSesiData, tenggang_waktu: e.target.value})}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!editSesiData.tenggang_waktu || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Sesi */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsDeleteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Konfirmasi Hapus
              </h3>
              <button className="modal-close" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '15px', color: 'var(--text-medium)', lineHeight: '1.6' }}>
                Apakah Anda yakin ingin menghapus Sesi {sesiToDelete?.sesi} ini?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                Tindakan ini tidak dapat dibatalkan. Menghapus sesi juga akan **MENGHAPUS SELURUH SOAL** dan progres pengerjaan yang terhubung dengannya.
              </p>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '0' }}>
              <button type="button" className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>Batal</button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={confirmDelete} 
                disabled={isSubmitting}
                style={{ background: 'var(--danger)', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Sesi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Popup */}
      {alertPopup.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setAlertPopup({ ...alertPopup, isOpen: false })}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ marginBottom: '15px' }}>
              {alertPopup.type === 'success' ? (
                <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              ) : (
                <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </div>
              )}
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>
              {alertPopup.type === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan'}
            </h3>
            <p style={{ color: 'var(--text-medium)', marginBottom: '20px', lineHeight: '1.5' }}>
              {alertPopup.message}
            </p>
            <button 
              className="btn-primary" 
              onClick={() => setAlertPopup({ ...alertPopup, isOpen: false })}
              style={{ width: '100%', padding: '10px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SesiGuru;
