import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const GuruAdmin = () => {
  const [gurus, setGurus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [newGuruName, setNewGuruName] = useState('');
  const [editGuruData, setEditGuruData] = useState({ id_guru: null, nama_guru: '', is_active: false, password: '' });
  const [guruToDelete, setGuruToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial data
  const fetchGurus = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/guru`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Gagal mengambil data guru');
      const data = await res.json();
      setGurus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGurus();
  }, []);

  const handleAddGuru = async (e) => {
    e.preventDefault();
    if (!newGuruName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/guru`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nama_guru: newGuruName })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan guru');
      
      setGurus([...gurus, data.guru]);
      setNewGuruName('');
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (guru) => {
    setEditGuruData({
      id_guru: guru.id_guru,
      nama_guru: guru.nama_guru,
      is_active: guru.is_active,
      password: '' // Kosong karena password lama tidak dikembalikan
    });
    setIsEditModalOpen(true);
  };

  const handleEditGuru = async (e) => {
    e.preventDefault();
    if (!editGuruData.nama_guru.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/guru/${editGuruData.id_guru}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editGuruData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui guru');

      setGurus(gurus.map(g => g.id_guru === editGuruData.id_guru ? data.guru : g));
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (guru) => {
    setGuruToDelete(guru);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!guruToDelete) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/guru/${guruToDelete.id_guru}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menghapus guru');
      }
      
      setGurus(gurus.filter(g => g.id_guru !== guruToDelete.id_guru));
      setIsDeleteModalOpen(false);
      setGuruToDelete(null);
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
          <h2>Manajemen Akun Guru</h2>
          <p>Kelola data guru pengampu mata pelajaran fisika beserta status keaktifannya.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Guru
        </button>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>No</th>
                <th>NIP</th>
                <th>Nama Guru</th>
                <th>Status</th>
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
              ) : gurus.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                    Belum ada data guru.
                  </td>
                </tr>
              ) : (
                gurus.map((guru, index) => (
                  <tr key={guru.id_guru}>
                    <td>{index + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{guru.nip}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{guru.nama_guru}</td>
                    <td>
                      <div className={`status-badge ${guru.is_active ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot"></span>
                        {guru.is_active ? 'Aktif' : 'Nonaktif'}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon btn-edit" title="Edit Guru" onClick={() => openEditModal(guru)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button className="btn-icon btn-delete" title="Hapus Guru" onClick={() => openDeleteModal(guru)}>
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

      {/* Modal Tambah Guru */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Akun Guru Baru</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddGuru}>
              <div className="modal-body">
                <p className="modal-desc">Masukkan nama lengkap guru. NIP (juga sebagai Password awal) akan di-generate otomatis oleh sistem (Format: YY020XXX).</p>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="namaGuruAdd">Nama Guru</label>
                  <div className="input-wrapper">
                    <input
                      id="namaGuruAdd"
                      className="form-input"
                      type="text"
                      placeholder="Contoh: Budi Santoso, S.Pd"
                      value={newGuruName}
                      onChange={(e) => setNewGuruName(e.target.value)}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!newGuruName.trim() || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Guru */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Akun Guru</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditGuru}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="namaGuruEdit">Nama Guru</label>
                  <div className="input-wrapper">
                    <input
                      id="namaGuruEdit"
                      className="form-input"
                      type="text"
                      value={editGuruData.nama_guru}
                      onChange={(e) => setEditGuruData({...editGuruData, nama_guru: e.target.value})}
                      disabled={isSubmitting}
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Status Akun</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEditGuruData({...editGuruData, is_active: true})}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                        border: editGuruData.is_active ? '2px solid var(--success)' : '1px solid rgba(148, 163, 184, 0.4)',
                        background: editGuruData.is_active ? 'rgba(16, 185, 129, 0.1)' : 'white',
                        color: editGuruData.is_active ? 'var(--success)' : 'var(--text-medium)',
                        cursor: 'pointer', transition: 'var(--transition-smooth)'
                      }}
                    >
                      Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditGuruData({...editGuruData, is_active: false})}
                      style={{
                        flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', fontWeight: 600,
                        border: !editGuruData.is_active ? '2px solid var(--danger)' : '1px solid rgba(148, 163, 184, 0.4)',
                        background: !editGuruData.is_active ? 'rgba(239, 68, 68, 0.1)' : 'white',
                        color: !editGuruData.is_active ? 'var(--danger)' : 'var(--text-medium)',
                        cursor: 'pointer', transition: 'var(--transition-smooth)'
                      }}
                    >
                      Nonaktif
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="passwordEdit">Password Baru (Opsional)</label>
                  <div className="input-wrapper">
                    <input
                      id="passwordEdit"
                      className="form-input"
                      type="text"
                      placeholder="Kosongkan jika tidak ingin mengubah"
                      value={editGuruData.password}
                      onChange={(e) => setEditGuruData({...editGuruData, password: e.target.value})}
                      disabled={isSubmitting}
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!editGuruData.nama_guru.trim() || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Guru */}
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
                Apakah Anda yakin ingin menghapus akun guru <strong>{guruToDelete?.nama_guru}</strong> (NIP: {guruToDelete?.nip})?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                Tindakan ini tidak dapat dibatalkan dan semua data kelas yang terhubung dengan guru ini akan terpengaruh.
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
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuruAdmin;
