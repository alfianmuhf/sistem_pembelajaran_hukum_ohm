import { useState } from 'react'

function App() {
  // Authentication states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Ohm's Law Simulator states
  const [voltage, setVoltage] = useState(12) // Default 12V
  const [resistance, setResistance] = useState(24) // Default 24 Ohm

  // Calculate current: I = V / R
  const currentAmpere = (voltage / resistance).toFixed(3)

  // Calculate electron animation speed based on current
  // Higher current = faster speed (smaller animation duration)
  const animationDuration = Math.max(0.15, 4 / Math.max(0.01, parseFloat(currentAmpere)))

  const handleLogin = (e) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('Username dan password harus diisi!')
      return
    }

    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true)
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
                  {/* Custom Ohm symbol & circuit theme icon */}
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
                    placeholder="Masukkan username (contoh: admin)"
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
                    placeholder="Masukkan password (contoh: admin)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  
                  {/* Show/Hide password button */}
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

            <div className="login-tip-container">
              <svg className="tip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div className="tip-text">
                <span className="tip-highlight">Tips Praktikum:</span> Masuk dengan username <code style={{background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)'}}>admin</code> dan sandi <code style={{background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)'}}>admin</code> untuk mengakses demo panel dashboard.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN DASHBOARD SCREEN */
        <div className="dashboard-layout">
          {/* Header */}
          <header className="nav-header">
            <div className="nav-brand">
              <div className="nav-logo-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 18c1.5-1.5 2.5-4 2.5-6.5a5.5 5.5 0 1 1 11 0c0 2.5 1 5 2.5 6.5M3 18h4m10 0h4" />
                </svg>
              </div>
              <span className="nav-title">Smart Learning OHM</span>
            </div>
            
            <div className="nav-user">
              <div className="user-badge">
                <span className="user-avatar-dot"></span>
                <span>{username} (Administrator)</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Keluar
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="dashboard-main">
            <div className="welcome-banner">
              <h2 className="welcome-title">Halo, Selamat Datang di Smart Learning OHM!</h2>
              <p className="welcome-desc">
                Portal belajar integrasi Web dan IoT. Di sini, Anda dapat memantau alat praktikum siswa, mengelola sesi kuis/soal secara real-time, dan memantau rekapitulasi nilai kuis serta nilai ketepatan alat praktikum.
              </p>
            </div>

            {/* Content Grid */}
            <div className="dashboard-grid">
              
              {/* Left Column: Interactive Calculator (Wow element) */}
              <div className="ohm-widget">
                <div className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  <h3>Simulator Mandiri Hukum Ohm</h3>
                </div>
                <p className="widget-intro">
                  Gunakan slider di bawah untuk mengatur Tegangan ($V$) dan Hambatan ($R$) dan amati bagaimana Arus listrik ($I$) berubah secara langsung sesuai teori $I = V / R$.
                </p>

                <div className="equation-visual">
                  <div className="equation-display">
                    <span className="val-v">{voltage}V</span>
                    <span style={{ margin: '0 8px', color: 'var(--text-light)' }}>=</span>
                    <span className="val-i">{currentAmpere}A</span>
                    <span style={{ margin: '0 8px', color: 'var(--text-light)' }}>&times;</span>
                    <span className="val-r">{resistance}&Omega;</span>
                  </div>
                  <div className="equation-calculation-detail">
                    Arus Listrik (I) = {voltage} Volt / {resistance} Ohm = <span className="val-i">{currentAmpere} Ampere</span>
                  </div>
                </div>

                <div className="slider-controls">
                  <div className="control-item">
                    <div className="control-label-row lbl-v">
                      <span>Tegangan (V)</span>
                      <span className="control-val-badge">{voltage} Volt</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="24"
                      className="custom-slider slider-v"
                      value={voltage}
                      onChange={(e) => setVoltage(parseInt(e.target.value))}
                    />
                  </div>

                  <div className="control-item">
                    <div className="control-label-row lbl-r">
                      <span>Hambatan (R)</span>
                      <span className="control-val-badge">{resistance} Ohm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      className="custom-slider slider-r"
                      value={resistance}
                      onChange={(e) => setResistance(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* Animated circuit visualization */}
                <div className="circuit-sim">
                  <h4 className="circuit-sim-title">Visualisasi Aliran Elektron (Arus Listrik)</h4>
                  <div className="circuit-sim-container">
                    <div 
                      className="electron-flow" 
                      style={{ animationDuration: `${animationDuration}s` }}
                    ></div>
                    <div className="sim-metric val-v">{voltage} V</div>
                    <div className="sim-metric val-r">{resistance} &Omega;</div>
                    <div className="sim-metric val-i" style={{ fontWeight: 800 }}>{currentAmpere} A</div>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                    *Semakin tinggi arus listrik (Ampere), aliran elektron pada visualisasi di atas akan mengalir semakin cepat.
                  </p>
                </div>
              </div>

              {/* Right Column: Roles Overview */}
              <div>
                <div className="section-title">
                  <svg className="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <h3>Panduan Akses Role</h3>
                </div>
                
                <div className="roles-card-container">
                  {/* Admin Card */}
                  <div className="role-card-item role-admin">
                    <div className="role-badge-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="role-card-content">
                      <h3>Role Admin (Aktif)</h3>
                      <p>Bertugas mendaftarkan & mengelola akun Siswa, Guru, serta memetakan pembagian Kelas.</p>
                    </div>
                  </div>

                  {/* Guru Card */}
                  <div className="role-card-item role-guru">
                    <div className="role-badge-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                    <div className="role-card-content">
                      <h3>Role Guru</h3>
                      <p>Mengatur pembuatan sesi kuis, memasukkan parameter target praktikum IoT, dan menilai esai analisis siswa.</p>
                    </div>
                  </div>

                  {/* Siswa Card */}
                  <div className="role-card-item role-siswa">
                    <div className="role-badge-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                      </svg>
                    </div>
                    <div className="role-card-content">
                      <h3>Role Siswa</h3>
                      <p>Mengerjakan soal teori di web, melakukan kalibrasi nilai Ohm-Volt-Ampere di perangkat IoT fisik, dan menulis analisis.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      )}
    </>
  )
}

export default App
