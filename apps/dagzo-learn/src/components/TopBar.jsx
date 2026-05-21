import { Maximize2, Minimize2 } from 'lucide-react'

export default function TopBar({ isFullscreen, onToggleFullscreen }) {
  const now = new Date()
  const time = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--bg-sidebar)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 8px var(--accent-green)',
        }} />
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Dagzo OS
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {date}
        </span>
        <span style={{
          color: 'var(--text-primary)', fontSize: 15, fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {time}
        </span>
        <button
          onClick={onToggleFullscreen}
          className="btn btn-secondary btn-icon"
          title={isFullscreen ? 'Oyna rejimi' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </header>
  )
}
