import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, BookOpen, BookMarked, Play, FileQuestion,
  Wifi, Settings, LogOut, Shield
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Bosh sahifa' },
  { path: '/lessons', icon: BookOpen, label: 'Darsliklar' },
  { path: '/books', icon: BookMarked, label: 'Kitoblar' },
  { path: '/videos', icon: Play, label: 'Videolar' },
  { path: '/tests', icon: FileQuestion, label: 'Testlar' },
  { path: '/wifi', icon: Wifi, label: 'Wi-Fi' },
  { path: '/settings', icon: Settings, label: 'Sozlamalar' },
]

export default function Sidebar({ onAdminExit, onExit }) {
  const location = useLocation()
  const [iconSrc, setIconSrc] = useState(null)

  useEffect(() => {
    if (window.dagzo) {
      window.dagzo.getBrandingDir().then((dir) => {
        if (dir) {
          const filePath = dir.startsWith('/')
            ? `file://${dir}/icon.png`
            : `file:///${dir}/icon.png`
          setIconSrc(filePath)
        }
      }).catch(() => {})
    }
  }, [])

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 40, height: 40,
          background: iconSrc ? 'transparent' : 'var(--gradient-aurora)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: 'white',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {iconSrc ? (
            <img
              src={iconSrc}
              alt="Dagzo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.style.background = 'var(--gradient-aurora)'
                e.target.parentElement.textContent = 'D'
              }}
            />
          ) : 'D'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            Dagzo Learn
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Ta'lim platformasi
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', padding: '8px 8px 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
          Menyu
        </div>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path)

          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 2,
                textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(79, 70, 229, 0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-blue)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-card)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <button
          onClick={onAdminExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: 14, width: '100%', textAlign: 'left',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(124, 58, 237, 0.1)'
            e.currentTarget.style.color = 'var(--accent-purple)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <Shield size={16} />
          Admin chiqish
        </button>

        <button
          onClick={onExit}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-sm)',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', cursor: 'pointer',
            fontSize: 14, width: '100%', textAlign: 'left',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <LogOut size={16} />
          Chiqish
        </button>
      </div>
    </aside>
  )
}
