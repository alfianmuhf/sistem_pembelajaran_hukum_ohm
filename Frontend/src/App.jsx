import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import GuruAdmin from './components/GuruAdmin'
import KelasAdmin from './components/KelasAdmin'
import SiswaAdmin from './components/SiswaAdmin'
import SesiGuru from './components/SesiGuru'
import SiswaSoal from './components/SiswaSoal'
import PenilaianGuru from './components/PenilaianGuru'
import SiswaNilai from './components/SiswaNilai'
import SiswaMateri from './components/SiswaMateri'
const API_URL = import.meta.env.VITE_API_URL || 'https://sistempembelajaranhukumohm-production.up.railway.app/api';

function App() {
  // Authentication states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // User Session detail states
  const [userRole, setUserRole] = useState('') // 'admin' | 'guru' | 'siswa'
  const [displayName, setDisplayName] = useState('')
  const [token, setToken] = useState('')

  // Navigation State
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // Dashboard Stats
  const [muridCount, setMuridCount] = useState(0)
  const [guruCount, setGuruCount] = useState(0)
  const [guruActiveCount, setGuruActiveCount] = useState(0)
  const [guruInactiveCount, setGuruInactiveCount] = useState(0)
  const [kelasCount, setKelasCount] = useState(0)

  // Siswa Dashboard Stats
  const [siswaActiveSesiCount, setSiswaActiveSesiCount] = useState(0)
  const [siswaTotalNilaiCount, setSiswaTotalNilaiCount] = useState(0)
  const [siswaLulusCount, setSiswaLulusCount] = useState(0)
  const [siswaRemidiCount, setSiswaRemidiCount] = useState(0)

  // User Profile states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    nama: '',
    password_lama: '',
    password_baru: ''
  });

  // Verify token on load to support session persistence
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = sessionStorage.getItem('ohm_session_token');
      if (savedToken) {
        try {
          const res = await fetch(`${API_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });
          const data = await res.json();
          if (res.ok && data.user) {
            setToken(savedToken);
            setIsLoggedIn(true);
            setUserRole(data.user.role);
            setDisplayName(data.user.name);
            setUsername(data.user.username);
          } else {
            // Token is invalid/expired
            sessionStorage.removeItem('ohm_session_token');
          }
        } catch (err) {
          console.error('Session check failed:', err);
        }
      }
      setIsLoading(false);
    };
    verifySession();
  }, []);

  // Fetch Admin Dashboard Stats
  useEffect(() => {
    if (isLoggedIn && userRole === 'admin' && activeMenu === 'dashboard') {
      const fetchStats = async () => {
        try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const [guruRes, kelasRes, siswaRes] = await Promise.all([
            fetch(`${API_URL}/guru`, { headers }),
            fetch(`${API_URL}/kelas`, { headers }),
            fetch(`${API_URL}/siswa`, { headers })
          ]);
          
          if (guruRes.ok) {
            const data = await guruRes.json();
            setGuruCount(data.length);
            setGuruActiveCount(data.filter(g => g.is_active).length);
            setGuruInactiveCount(data.filter(g => !g.is_active).length);
          }
          if (kelasRes.ok) {
            const data = await kelasRes.json();
            setKelasCount(data.length);
          }
          if (siswaRes.ok) {
            const data = await siswaRes.json();
            setMuridCount(data.length);
          }
        } catch (err) {
          console.error('Failed to fetch stats:', err);
        }
      };
      fetchStats();
    }
  }, [isLoggedIn, userRole, activeMenu, token]);

  // Fetch Siswa Dashboard Stats
  useEffect(() => {
    if (isLoggedIn && userRole === 'siswa' && activeMenu === 'dashboard') {
      const fetchSiswaStats = async () => {
        try {
          const headers = { 'Authorization': `Bearer ${token}` };
          const [aktifRes, nilaiRes] = await Promise.all([
            fetch(`${API_URL}/kuis/aktif`, { headers }),
            fetch(`${API_URL}/siswa/nilai`, { headers })
          ]);
          
          if (aktifRes.ok) {
            const data = await aktifRes.json();
            setSiswaActiveSesiCount(data.length);
          }
          if (nilaiRes.ok) {
            const data = await nilaiRes.json();
            const graded = data.filter(s => s.nilai && s.nilai.nilai_total !== null && s.nilai.nilai_total !== undefined);
            setSiswaTotalNilaiCount(graded.length);
            setSiswaLulusCount(graded.filter(s => s.nilai.nilai_total >= 71).length);
            setSiswaRemidiCount(graded.filter(s => s.nilai.nilai_total < 71).length);
          }
        } catch (err) {
          console.error('Failed to fetch siswa stats:', err);
        }
      };
      fetchSiswaStats();
    }
  }, [isLoggedIn, userRole, activeMenu, token]);

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username.trim() || !password.trim()) {
      setError('Username/NIP/NIM dan password harus diisi!')
      return
    }

    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Login gagal!');
      }

      // Save token in sessionStorage
      sessionStorage.setItem('ohm_session_token', data.token);
      
      // Update session states
      setToken(data.token);
      setIsLoggedIn(true);
      setUserRole(data.user.role);
      setDisplayName(data.user.name);
      setUsername(data.user.username);
      setActiveMenu('dashboard');
      setError('');
    } catch (err) {
      setError(err.message || 'Koneksi ke server gagal!');
    } finally {
      setIsLoggingIn(false);
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('ohm_session_token');
    setIsLoggedIn(false);
    setToken('');
    setUserRole('');
    setDisplayName('');
    setUsername('');
    setPassword('');
    setError('');
  }

  const openProfileModal = () => {
    if (userRole !== 'guru' && userRole !== 'siswa') return;

    setProfileForm({
      nama: displayName,
      password_lama: '',
      password_baru: ''
    });

    setProfileError('');
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    if (isSavingProfile) return;

    setIsProfileModalOpen(false);
    setProfileError('');
    setProfileForm({
      nama: '',
      password_lama: '',
      password_baru: ''
    });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');

    if (!profileForm.nama.trim()) {
      setProfileError('Nama wajib diisi.');
      return;
    }

    setIsSavingProfile(true);

    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nama: profileForm.nama,
          password_lama: profileForm.password_lama,
          password_baru: profileForm.password_baru
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memperbarui profil.');
      }

      localStorage.setItem('ohm_session_token', data.token);
      setToken(data.token);
      setDisplayName(data.user.name);
      setUsername(data.user.username);

      closeProfileModal();
      alert('Profil berhasil diperbarui.');
    } catch (err) {
      setProfileError(err.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Render Admin Dashboard and Pages
  const renderAdminContent = () => {
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
              <div className="stat-card stat-card-murid" onClick={() => setActiveMenu('murid')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Murid</span>
                  <span className="stat-card-number">{muridCount}</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
              </div>

              <div className="stat-card stat-card-guru" onClick={() => setActiveMenu('guru')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Guru</span>
                  <span className="stat-card-number">{guruCount}</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--success)' }}>{guruActiveCount} Aktif</span>
                    <span style={{ color: 'var(--danger)' }}>{guruInactiveCount} Nonaktif</span>
                  </div>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
              </div>

              <div className="stat-card stat-card-kelas" onClick={() => setActiveMenu('kelas')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Kelas</span>
                  <span className="stat-card-number">{kelasCount}</span>
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
          </>
        )

      case 'murid':
        return <SiswaAdmin />;

      case 'guru':
        return <GuruAdmin />;

      case 'kelas':
        return <KelasAdmin />;

      default:
        return <div>Halaman tidak ditemukan.</div>
    }
  }

  // Render Guru Dashboard and Pages
  const renderGuruContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)' }}>
              <h2 className="welcome-title">Selamat Datang, {displayName}!</h2>
              <p className="welcome-desc">
                Ruang Kerja Guru - Smart Learning OHM. Di sini Anda dapat memantau pengerjaan kuis siswa, memberikan penilaian analisis laporan praktikum, serta membuat sesi soal baru.
              </p>
            </div>

            {/* Quick stats placeholder for guru */}
            <div className="stats-grid">
              <div className="stat-card stat-card-guru">
                <div className="stat-card-details">
                  <span className="stat-card-title">Kelas Diampu</span>
                  <span className="stat-card-number">2</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              <div className="stat-card stat-card-murid">
                <div className="stat-card-details">
                  <span className="stat-card-title">Siswa Aktif</span>
                  <span className="stat-card-number">38</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
              </div>

              <div className="stat-card stat-card-kelas">
                <div className="stat-card-details">
                  <span className="stat-card-title">Perlu Dinilai</span>
                  <span className="stat-card-number">5</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              </div>
            </div>
          </>
        )

      case 'penilaian':
        return <PenilaianGuru />;

      case 'sesi_soal':
        return <SesiGuru />;

      default:
        return <div>Halaman tidak ditemukan.</div>
    }
  }

  // Render Siswa Dashboard and Pages
  const renderSiswaContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)' }}>
              <h2 className="welcome-title">Halo, Selamat Belajar {displayName}!</h2>
              <p className="welcome-desc">
                Portal Praktikum Mandiri Siswa. Pelajari materi Hukum Ohm, kerjakan soal kuis, dan kalibrasi nilai Ohm, Volt, serta Ampere menggunakan alat IoT praktikum fisik.
              </p>
            </div>

            {/* Quick stats for siswa */}
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card stat-card-murid" onClick={() => setActiveMenu('soal')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-details">
                  <span className="stat-card-title">Kuis Aktif (Berjalan)</span>
                  <span className="stat-card-number">{siswaActiveSesiCount}</span>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>

              <div className="stat-card stat-card-guru" onClick={() => setActiveMenu('nilai')} style={{ cursor: 'pointer' }}>
                <div className="stat-card-details">
                  <span className="stat-card-title">Total Penilaian Selesai</span>
                  <span className="stat-card-number">{siswaTotalNilaiCount}</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '13px', fontWeight: 600 }}>
                    <span style={{ color: 'var(--success)' }}>{siswaLulusCount} Lulus (≥71)</span>
                    <span style={{ color: 'var(--danger)' }}>{siswaRemidiCount} Remidi</span>
                  </div>
                </div>
                <div className="stat-card-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: 'var(--radius-md)',
              padding: '32px',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '32px'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
                Langkah Melakukan Praktikum Hukum Ohm
              </h3>
              <ul style={{ 
                fontSize: '14px', 
                color: 'var(--text-muted)', 
                lineHeight: '180%',
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <li>Masuk ke menu <strong>Materi</strong> untuk memahami teori kelistrikan dan rumus Hukum Ohm.</li>
                <li>Buka menu <strong>Soal</strong> di sidebar untuk melihat tugas praktikum yang diberikan oleh gurumu.</li>
                <li>Pahami parameter target Ohm dan Volt yang diberikan pada soal Anda.</li>
                <li>Gunakan perangkat keras IoT fisik Anda untuk memutar potensiometer hingga nilai hambatan (Ohm) dan tegangan (Volt) pada sensor sesuai dengan target soal.</li>
                <li>Setelah nilai pada IoT sesuai, kirimkan hasil pembacaan IoT tersebut ke sistem dan tuliskan analisis/kesimpulan Anda.</li>
              </ul>
            </div>
          </>
        )

      case 'materi':
        return <SiswaMateri />

      case 'soal':
        return <SiswaSoal />;

      case 'nilai':
        return <SiswaNilai />;

      default:
        return <div>Halaman tidak ditemukan.</div>
    }
  }

  // Choose content based on user role
  const renderRoleContent = () => {
    switch (userRole) {
      case 'admin':
        return renderAdminContent()
      case 'guru':
        return renderGuruContent()
      case 'siswa':
        return renderSiswaContent()
      default:
        return <div>Role tidak valid.</div>
    }
  }

  // Render a clean modern loading screen during session validation
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #fffbeb 100%)'
      }}>
        <svg 
          style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', width: '40px', height: '40px', marginBottom: '16px' }}
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3"
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
          <path d="M4 12a8 8 0 0 1 8-8" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-medium)', fontFamily: 'var(--font-sans)' }}>
          Memverifikasi Sesi...
        </span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
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
                <label className="form-label" htmlFor="username-input">Username / NIP / NIM</label>
                <div className="input-wrapper">
                  <input
                    id="username-input"
                    className="form-input"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoggingIn}
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
                    disabled={isLoggingIn}
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
                      disabled={isLoggingIn}
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

              <button className="submit-btn" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <svg 
                      style={{ animation: 'spin 1s linear infinite' }}
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                      <path d="M4 12a8 8 0 0 1 8-8" strokeLinecap="round"/>
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Ke Sistem</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* MAIN WORKSPACE WRAPPER (WITH SIDEBAR) */
        <div className="admin-layout-wrapper">
          <Sidebar
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            role={userRole}
            userName={displayName}
            onLogout={handleLogout}
            onOpenProfile={openProfileModal}
          />

          {/* Main Content Area */}
          <main className="main-content-area">
            {renderRoleContent()}
          </main>
          
          {isProfileModalOpen && (
            <div
              className="modal-overlay"
              onClick={closeProfileModal}
            >
              <form
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleProfileSubmit}
              >
                <div className="modal-header">
                  <h3>Profil {userRole === 'guru' ? 'Guru' : 'Siswa'}</h3>

                  <button
                    type="button"
                    className="modal-close"
                    onClick={closeProfileModal}
                    disabled={isSavingProfile}
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  {profileError && (
                    <div className="alert-error">
                      {profileError}
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Nama</label>
                    <input
                      type="text"
                      name="nama"
                      className="form-input no-icon"
                      value={profileForm.nama}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                      placeholder="Masukkan nama"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {userRole === 'guru' ? 'NIP' : 'NIM'}
                    </label>
                    <input
                      type="text"
                      className="form-input no-icon"
                      value={username}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password Lama</label>
                    <input
                      type="password"
                      name="password_lama"
                      className="form-input no-icon"
                      value={profileForm.password_lama}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                      placeholder="Isi jika ingin mengganti password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password Baru</label>
                    <input
                      type="password"
                      name="password_baru"
                      className="form-input no-icon"
                      value={profileForm.password_baru}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeProfileModal}
                    disabled={isSavingProfile}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default App
