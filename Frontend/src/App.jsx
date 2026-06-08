import { useState } from 'react'
import Sidebar from './components/Sidebar'

function App() {
  // Authentication states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // Navigation State
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [userRole, setUserRole] = useState('admin') // Default to admin for this test

  // Mock Database for Admin Dashboard Counts
  const [muridList, setMuridList] = useState([
    { nim: 'S001', nama_siswa: 'Alfian Muhaimin', id_kelas: 1 },
    { nim: 'S002', nama_siswa: 'Budi Santoso', id_kelas: 1 },
    { nim: 'S003', nama_siswa: 'Citra Kirana', id_kelas: 2 },
    { nim: 'S004', nama_siswa: 'Dodi Hermawan', id_kelas: 2 },
    { nim: 'S005', nama_siswa: 'Elsa Putri', id_kelas: 3 },
  ])

  const [guruList, setGuruList] = useState([
    { nip: 'G001', nama_guru: 'Drs. Supriyadi' },
    { nip: 'G002', nama_guru: 'Indah Lestari, S.Pd' },
    { nip: 'G003', nama_guru: 'Rahmat Hidayat, M.T' },
  ])

  const [kelasList, setKelasList] = useState([
    { id_kelas: 1, nama_kelas: 'Kelas X - IPA 1', nip_guru: 'G001' },
    { id_kelas: 2, nama_kelas: 'Kelas X - IPA 2', nip_guru: 'G002' },
    { id_kelas: 3, nama_kelas: 'Kelas XI - IPA 1', nip_guru: 'G003' },
    { id_kelas: 4, nama_kelas: 'Kelas XI - IPA 2', nip_guru: 'G001' },
  ])

  const handleLogin = (e) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi!')
      return
    }

    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true)
      setUserRole('admin')
      setActiveMenu('dashboard') // Reset to default menu on login
      setError('')
    } else {
      setError('Username atau password salah!')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('')
    setPassword('')
    setError('')
  }

  // Render content based on active menu item
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            <div className="welcome-banner">
              <h2 className="welcome-title">Selamat Datang, Admin!</h2>
              <p className="welcome-desc">
                Portal Manajemen Smart Learning OHM. Gunakan menu sidebar untuk mengelola akun murid, guru, dan rombongan belajar (kelas) secara terstruktur.
              </p>
            </div>

            {/* Statistics Row */}
            <div className="stats-grid">
              {/* Stat Murid */}
              <div className="stat-card stat-card-murid">
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Murid</span>
                  <span className="stat-card-number">{muridList.length}</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
              </div>

              {/* Stat Guru */}
              <div className="stat-card stat-card-guru">
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Guru</span>
                  <span className="stat-card-number">{guruList.length}</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>

              {/* Stat Kelas */}
              <div className="stat-card stat-card-kelas">
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Kelas</span>
                  <span className="stat-card-number">{kelasList.length}</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel / System Information */}
            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: 'var(--radius-md)',
              padding: '32px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                Tentang Sistem Smart Learning OHM
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '160%' }}>
                Platform ini didesain untuk menyinkronkan data kuis siswa pada aplikasi web dengan data pembacaan fisik pada modul praktikum IoT. Sebagai administrator, Anda memegang hak akses penuh untuk mendaftarkan akun murid baru yang ingin berpartisipasi dalam praktikum, menetapkan guru pendamping pada masing-masing kelas, dan memastikan kelancaran database sebelum praktikum dimulai.
              </p>
            </div>
          </>
        )

      case 'murid':
        return (
          <>
            <div className="page-header">
              <h2>Manajemen Akun Murid</h2>
              <p>Kelola data pendaftaran murid, pencarian NIM, dan penempatan kelas mereka.</p>
            </div>
            <div className="placeholder-card">
              <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
              <h3>Halaman Murid</h3>
              <p>Fitur CRUD (Tambah, Edit, Hapus) untuk data Murid akan dihubungkan ke database PostgreSQL Supabase pada langkah pengerjaan berikutnya.</p>
            </div>
          </>
        )

      case 'guru':
        return (
          <>
            <div className="page-header">
              <h2>Manajemen Akun Guru</h2>
              <p>Kelola data guru pengampu mata pelajaran fisika beserta NIP untuk pemberian wewenang sesi soal.</p>
            </div>
            <div className="placeholder-card">
              <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <h3>Halaman Guru</h3>
              <p>Fitur CRUD (Tambah, Edit, Hapus) untuk data Guru pengampu kelas akan dikembangkan pada langkah berikutnya.</p>
            </div>
          </>
        )

      case 'kelas':
        return (
          <>
            <div className="page-header">
              <h2>Manajemen Rombongan Belajar (Kelas)</h2>
              <p>Buat kelompok kelas baru dan hubungkan kelas dengan guru penanggung jawab.</p>
            </div>
            <div className="placeholder-card">
              <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>Halaman Kelas</h3>
              <p>Fitur pembuatan dan pemetaan Kelas baru untuk praktikum Hukum Ohm akan ditambahkan pada tahap pengerjaan berikutnya.</p>
            </div>
          </>
        )

      default:
        return <div>Halaman tidak ditemukan.</div>
    }
  }

  return (
    <>
      {/* Background decoration elements */}
      <div className="bg-decorations">
        <div className="decor-circle decor-circle-1"></div>
        <div className="decor-circle decor-circle-2"></div>
        <div className="decor-circle decor-circle-3"></div>
      </div>

      {!isLoggedIn ? (
        /* LOGIN SCREEN */
        <div className="login-wrapper">
          <div className="login-card">
            <div className="brand-section">
              <div className="brand-logo-container">
                <div className="spark"></div>
                <svg className="brand-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 18c1.5-1.5 2.5-4 2.5-6.5a5.5 5.5 0 1 1 11 0c0 2.5 1 5 2.5 6.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 18h4m10 0h4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2v2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="3" r="1" fill="currentColor"/>
                </svg>
              </div>
              <h1 className="brand-title">Smart Learning OHM</h1>
              <p className="brand-subtitle">Web & IoT Integration untuk Praktikum Mandiri</p>
            </div>

            <form onSubmit={handleLogin}>
              {error && (
                <div className="alert-error" role="alert">
                  <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="username-input">Username</label>
                <div className="input-wrapper">
                  <input
                    id="username-input"
                    className="form-input"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-input">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password-input"
                    className="form-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  
                  {/* Show/Hide password toggle */}
                  {password && (
                    <button
                      type="button"
                      tabIndex="-1"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <button className="submit-btn" type="submit">
                <span>Masuk Ke Sistem</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* ADMIN PANEL VIEW (WITH REUSABLE SIDEBAR) */
        <div className="admin-layout-wrapper">
          <Sidebar
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            role={userRole}
            userName={username}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="main-content-area">
            {renderContent()}
          </main>
        </div>
      )}
    </>
  )
}

export default App
