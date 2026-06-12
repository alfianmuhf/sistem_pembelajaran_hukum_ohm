import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

const SiswaAdmin = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states
  const [newSiswaData, setNewSiswaData] = useState({ nama_siswa: '', id_kelas: '' });
  const [editSiswaData, setEditSiswaData] = useState({ id_siswa: null, nama_siswa: '', id_kelas: '', password: '' });
  const [siswaToDelete, setSiswaToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [siswaRes, kelasRes] = await Promise.all([
        fetch(`${API_URL}/siswa`, { headers }),
        fetch(`${API_URL}/kelas`, { headers })
      ]);

      if (!siswaRes.ok) throw new Error('Gagal mengambil data siswa');
      if (!kelasRes.ok) throw new Error('Gagal mengambil data kelas');

      const siswaData = await siswaRes.json();
      const kelasData = await kelasRes.json();

      setSiswaList(siswaData);
      setKelasList(kelasData);
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
  const handleAddSiswa = async (e) => {
    e.preventDefault();
    if (!newSiswaData.nama_siswa.trim()) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/siswa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_siswa: newSiswaData.nama_siswa,
          id_kelas: newSiswaData.id_kelas || null
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menambahkan siswa');
      
      setSiswaList([...siswaList, data.siswa]);
      setNewSiswaData({ nama_siswa: '', id_kelas: '' });
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Edit
  const openEditModal = (siswa) => {
    setEditSiswaData({
      id_siswa: siswa.id_siswa,
      nama_siswa: siswa.nama_siswa,
      id_kelas: siswa.id_kelas || '',
      password: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSiswa = async (e) => {
    e.preventDefault();
    if (!editSiswaData.nama_siswa.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/siswa/${editSiswaData.id_siswa}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nama_siswa: editSiswaData.nama_siswa,
          id_kelas: editSiswaData.id_kelas || null,
          password: editSiswaData.password
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memperbarui siswa');

      setSiswaList(siswaList.map(s => s.id_siswa === editSiswaData.id_siswa ? data.siswa : s));
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers for Delete
  const openDeleteModal = (siswa) => {
    setSiswaToDelete(siswa);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!siswaToDelete) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('ohm_session_token');
      const res = await fetch(`${API_URL}/siswa/${siswaToDelete.id_siswa}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Gagal menghapus siswa');
      }
      
      setSiswaList(siswaList.filter(s => s.id_siswa !== siswaToDelete.id_siswa));
      setIsDeleteModalOpen(false);
      setSiswaToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Grouping logic
  const groupedSiswa = siswaList.reduce((acc, siswa) => {
    const kelasName = siswa.kelas?.nama_kelas || 'Non Kelas (Belum Ada Kelas)';
    if (!acc[kelasName]) acc[kelasName] = [];
    acc[kelasName].push(siswa);
    return acc;
  }, {});

  // Sort groups alphabetically, but ensure 'Non Kelas' is at the bottom
  const sortedGroupKeys = Object.keys(groupedSiswa).sort((a, b) => {
    if (a.startsWith('Non Kelas')) return 1;
    if (b.startsWith('Non Kelas')) return -1;
    return a.localeCompare(b);
  });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Manajemen Akun Murid (Siswa)</h2>
          <p>Kelola data pendaftaran murid, penempatan kelas, dan kata sandi.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Tambah Siswa
        </button>
      </div>

      <div className="data-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama Siswa</th>
                <th>Kelas Saat Ini</th>
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
              ) : sortedGroupKeys.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-light)' }}>
                    Belum ada data siswa.
                  </td>
                </tr>
              ) : (
                sortedGroupKeys.map(groupName => (
                  <React.Fragment key={groupName}>
                    {/* Group Header Row */}
                    <tr style={{ background: 'rgba(241, 245, 249, 0.7)' }}>
                      <td colSpan="4" style={{ padding: '12px 20px', fontWeight: 800, color: groupName.startsWith('Non Kelas') ? 'var(--text-muted)' : 'var(--primary)', borderBottom: '2px solid rgba(226, 232, 240, 1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          {groupName} ({groupedSiswa[groupName].length} Siswa)
                        </div>
                      </td>
                    </tr>
                    
                    {/* Siswa Rows within Group */}
                    {groupedSiswa[groupName].map((siswa) => (
                      <tr key={siswa.id_siswa}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{siswa.nim}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{siswa.nama_siswa}</td>
                        <td>
                          {siswa.kelas?.nama_kelas ? (
                            <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                              {siswa.kelas.nama_kelas}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '13px' }}>Belum masuk kelas</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit" title="Edit Siswa" onClick={() => openEditModal(siswa)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button className="btn-icon btn-delete" title="Hapus Siswa" onClick={() => openDeleteModal(siswa)}>
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
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Siswa */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Akun Siswa Baru</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSiswa}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p className="modal-desc" style={{ marginBottom: 0 }}>NIM (juga sebagai Password awal) akan di-generate otomatis oleh sistem (Format: YY010XXX).</p>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="namaSiswaAdd">Nama Lengkap Siswa</label>
                  <div className="input-wrapper">
                    <input
                      id="namaSiswaAdd"
                      className="form-input"
                      type="text"
                      placeholder="Contoh: Andi Wijaya"
                      value={newSiswaData.nama_siswa}
                      onChange={(e) => setNewSiswaData({...newSiswaData, nama_siswa: e.target.value})}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="kelasAdd">Masukkan ke Kelas</label>
                  <div className="input-wrapper">
                    <select
                      id="kelasAdd"
                      className="form-input"
                      style={{ paddingLeft: '48px', appearance: 'none' }}
                      value={newSiswaData.id_kelas}
                      onChange={(e) => setNewSiswaData({...newSiswaData, id_kelas: e.target.value})}
                      disabled={isSubmitting}
                    >
                      <option value="">Pilih Kelas (Opsional)</option>
                      {kelasList.map(kelas => (
                        <option key={kelas.id_kelas} value={kelas.id_kelas}>
                          {kelas.nama_kelas}
                        </option>
                      ))}
                    </select>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <svg style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: 'var(--text-light)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Batal</button>
                <button type="submit" className="btn-primary" disabled={!newSiswaData.nama_siswa.trim() || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Siswa */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Data Siswa</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSiswa}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="namaSiswaEdit">Nama Lengkap Siswa</label>
                  <div className="input-wrapper">
                    <input
                      id="namaSiswaEdit"
                      className="form-input"
                      type="text"
                      value={editSiswaData.nama_siswa}
                      onChange={(e) => setEditSiswaData({...editSiswaData, nama_siswa: e.target.value})}
                      disabled={isSubmitting}
                    />
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="kelasEdit">Pindah Kelas</label>
                  <div className="input-wrapper">
                    <select
                      id="kelasEdit"
                      className="form-input"
                      style={{ paddingLeft: '48px', appearance: 'none' }}
                      value={editSiswaData.id_kelas}
                      onChange={(e) => setEditSiswaData({...editSiswaData, id_kelas: e.target.value})}
                      disabled={isSubmitting}
                    >
                      <option value="">Pilih Kelas (Opsional)</option>
                      {kelasList.map(kelas => (
                        <option key={kelas.id_kelas} value={kelas.id_kelas}>
                          {kelas.nama_kelas}
                        </option>
                      ))}
                    </select>
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <svg style={{ position: 'absolute', right: '16px', pointerEvents: 'none', color: 'var(--text-light)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
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
                      value={editSiswaData.password}
                      onChange={(e) => setEditSiswaData({...editSiswaData, password: e.target.value})}
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
                <button type="submit" className="btn-primary" disabled={!editSiswaData.nama_siswa.trim() || isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hapus Siswa */}
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
                Apakah Anda yakin ingin menghapus akun siswa <strong>{siswaToDelete?.nama_siswa}</strong> (NIM: {siswaToDelete?.nim})?
              </p>
              <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                Tindakan ini tidak dapat dibatalkan dan semua data kuis atau progres siswa ini akan ikut terpengaruh.
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

export default SiswaAdmin;
