import React from 'react'

function Sidebar({ activeMenu, setActiveMenu, role = 'admin', userName = 'Admin', onLogout }) {
  // Define menu items based on user role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            )
          },
          {
            key: 'murid',
            label: 'Murid',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            )
          },
          {
            key: 'guru',
            label: 'Guru',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            )
          },
          {
            key: 'kelas',
            label: 'Kelas',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )
          }
        ]
      case 'guru':
        return [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            )
          },
          {
            key: 'penilaian',
            label: 'Penilaian',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            )
          },
          {
            key: 'sesi_soal',
            label: 'Sesi Soal',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            )
          }
        ]
      case 'siswa':
        return [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            )
          },
          {
            key: 'materi',
            label: 'Materi',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            )
          },
          {
            key: 'soal',
            label: 'Soal',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )
          },
          {
            key: 'nilai',
            label: 'Nilai',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )
          }
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 18c1.5-1.5 2.5-4 2.5-6.5a5.5 5.5 0 1 1 11 0c0 2.5 1 5 2.5 6.5M3 18h4m10 0h4" />
          </svg>
        </div>
        <div className="sidebar-brand-text">
          <h2>Smart Ohm</h2>
          <span className="badge-role">{role.toUpperCase()}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item) => {
            const isActive = activeMenu === item.key
            return (
              <li key={item.key}>
                <button
                  className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveMenu(item.key)}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Profile Section */}
      <div className="sidebar-profile">
        <div className="profile-info">
          <div className="profile-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h4 className="profile-name">{userName}</h4>
            <span className="profile-status">Online</span>
          </div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout} title="Keluar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
