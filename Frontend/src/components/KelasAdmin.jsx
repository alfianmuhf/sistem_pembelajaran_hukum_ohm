import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const KelasAdmin = () => {
  const [kelasList, setKelasList] = useState([]);
  const [activeGurus, setActiveGurus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [newKelasData, setNewKelasData] = useState({ nama_kelas: '', id_guru: '' });
  const [editKelasData, setEditKelasData] = useState({ id_kelas: null, nama_kelas: '', id_guru: '' });
  const [kelasToDelete, setKelasToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [kelasRes, guruRes] = await Promise.all([
        fetch(`${API_URL}/kelas`, { headers }),
        fetch(`${API_URL}/guru`, { headers })
      ]);

      if (!kelasRes.ok) throw new Error('Gagal mengambil data kelas');
      if (!guruRes.ok) throw new Error('Gagal mengambil data guru');

      const kelasData = await kelasRes.json();
      const guruData = await guruRes.json();

      setKelasList(kelasData);
      setActiveGurus(guruData.filter(g => g.is_active));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers for Add
  const handleAddKelas = async (e) => {
    e.preventDefault();
    if (!newKelasData.nama_kelas.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/kelas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_kelas: newKelasData.nama_kelas,
          id_guru: newKelasData.id_guru || null
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan kelas');
      
      setKelasList([...kelasList, data.kelas]);
      setNewKelasData({ nama_kelas: '', id_guru: '' });
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit
  const openEditModal = (kelas) => {
    setEditKelasData({
      id_kelas: kelas.id_kelas,
      nama_kelas: kelas.nama_kelas,
      id_guru: kelas.id_guru || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditKelas = async (e) => {
    e.preventDefault();
    if (!editKelasData.nama_kelas.trim()) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/kelas/${editKelasData.id_kelas}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_kelas: editKelasData.nama_kelas,
          id_guru: editKelasData.id_guru || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui kelas');

      setKelasList(kelasList.map(k => k.id_kelas === editKelasData.id_kelas ? data.kelas : k));
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Delete
  const openDeleteModal = (kelas) => {
    setKelasToDelete(kelas);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!kelasToDelete) return;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/kelas/${kelasToDelete.id_kelas}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menghapus kelas');
      }
      
      setKelasList(kelasList.filter(k => k.id_kelas !== kelasToDelete.id_kelas));
      setIsDeleteModalOpen(false);
      setKelasToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Manajemen Rombongan Belajar (Kelas)</h2>
          <p>Buat kelompok kelas baru dan hubungkan kelas dengan guru penanggung jawab.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Kelas
        </button>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Kelas</th>
                <th>Guru Pengampu</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                    Memuat data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--danger)' }}>
                    {error}
                  </td>
                </tr>
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                    Belum ada data kelas.
                  </td>
                </tr>
              ) : (
                kelasList.map((kelas, index) => (
                  <tr key={kelas.id_kelas}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{kelas.nama_kelas}</td>
                    <td>
                      {kelas.guru?.nama_guru ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                            {kelas.guru.nama_guru.charAt(0)}
                          </div>
                          <span>{kelas.guru.nama_guru}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Belum ada guru</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon btn-edit" title="Edit Kelas" onClick={() => openEditModal(kelas)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button className="btn-icon btn-delete" title="Hapus Kelas" onClick={() => openDeleteModal(kelas)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Kelas */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Kelas Baru</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddKelas}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="namaKelasAdd">Nama Kelas (Unik)</label>
                  <div className="input-wrapper">
                    <input
                      id="namaKelasAdd"
                      className="form-input"
                      type="text"
                      placeholder="Contoh: XII IPA 1"
                      value={newKelasData.nama_kelas}
                      onChange={(e) => setNewKelasData({...newKelasData, nama_kelas: e.target.value})}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="guruAdd">Guru Pengampu</label>
                  <div className="input-wrapper">
                    <select
                      id="guruAdd"
                      className="form-input"
                      style={{ paddingLeft: '48px', appearance: 'none' }}
                      value={newKelasData.id_guru}
                      onChange={(e) => setNewKelasData({...newKelasData, id_guru: e.target.value})}
                      disabled={isSubmitting}
                    >
                      <option value="">Pilih Guru (Opsional)</option>
                      {activeGurus.map(guru => (
                        <option key={guru.id_guru} value={guru.id_guru}>
                          {guru.nama_guru}
                        </option>
                      ))}
                    </select>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {/* Custom Dropdown Arrow */}
                    <svg style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: 'var(--text-light)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!newKelasData.nama_kelas.trim() || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Kelas */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Data Kelas</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditKelas}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="namaKelasEdit">Nama Kelas</label>
                  <div className="input-wrapper">
                    <input
                      id="namaKelasEdit"
                      className="form-input"
                      type="text"
                      value={editKelasData.nama_kelas}
                      onChange={(e) => setEditKelasData({...editKelasData, nama_kelas: e.target.value})}
                      disabled={isSubmitting}
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="guruEdit">Guru Pengampu</label>
                  <div className="input-wrapper">
                    <select
                      id="guruEdit"
                      className="form-input"
                      style={{ paddingLeft: '48px', appearance: 'none' }}
                      value={editKelasData.id_guru}
                      onChange={(e) => setEditKelasData({...editKelasData, id_guru: e.target.value})}
                      disabled={isSubmitting}
                    >
                      <option value="">Pilih Guru (Opsional)</option>
                      {activeGurus.map(guru => (
                        <option key={guru.id_guru} value={guru.id_guru}>
                          {guru.nama_guru}
                        </option>
                      ))}
                    </select>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <svg style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: 'var(--text-light)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!editKelasData.nama_kelas.trim() || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Kelas */}
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
                Apakah Anda yakin ingin menghapus kelas <strong>{kelasToDelete?.nama_kelas}</strong>?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                Tindakan ini tidak dapat dibatalkan. Murid yang berada di dalam kelas ini mungkin akan kehilangan referensi kelas.
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
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Kelas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KelasAdmin;
