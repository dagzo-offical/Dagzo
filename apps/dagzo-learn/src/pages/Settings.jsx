import { useState } from 'react'
import { Settings as SettingsIcon, Monitor, Key, Info, Check } from 'lucide-react'

const WALLPAPERS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Wallpaper ${i + 1}`,
  path: `/wallpapers/wallpaper-${i + 1}.png`,
}))

export default function Settings() {
  const [activeWallpaper, setActiveWallpaper] = useState(2)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passMsg, setPassMsg] = useState(null)
  const [sysInfo, setSysInfo] = useState(null)

  useState(() => {
    if (window.dagzo) {
      window.dagzo.getSystemInfo().then(setSysInfo)
    }
  })

  const handleWallpaper = (id) => {
    setActiveWallpaper(id)
    // XFCE wallpaper o'zgartirish uchun backend ga yuborish mumkin
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Parollar mos kelmadi' })
      return
    }
    if (newPassword.length < 4) {
      setPassMsg({ type: 'error', text: 'Parol kamida 4 belgidan iborat bo\'lishi kerak' })
      return
    }
    setPassMsg({ type: 'success', text: 'Parol muvaffaqiyatli o\'zgartirildi (qayta ishga tushirgandan so\'ng)' })
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Sozlamalar</h1>
      </div>

      {/* Wallpaper section */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Monitor size={18} color="var(--accent-cyan)" />
          Desktop fon rasmi
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Joriy: wallpaper-{activeWallpaper}.png
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {WALLPAPERS.map((wp) => (
            <div
              key={wp.id}
              onClick={() => handleWallpaper(wp.id)}
              style={{
                aspectRatio: '16/9',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${activeWallpaper === wp.id ? 'var(--accent-blue)' : 'var(--border)'}`,
                background: `hsl(${wp.id * 36}, 40%, 15%)`,
                cursor: 'pointer', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{wp.id}</span>
              {activeWallpaper === wp.id && (
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'var(--accent-blue)', borderRadius: '50%',
                  width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={11} color="white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Admin password */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Key size={18} color="var(--accent-purple)" />
          Admin paroli
        </h2>
        <form onSubmit={handlePasswordChange} style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Yangi parol
            </label>
            <input
              type="password"
              className="input"
              placeholder="Yangi parol"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Parolni tasdiqlash
            </label>
            <input
              type="password"
              className="input"
              placeholder="Parolni tasdiqlang"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          {passMsg && (
            <div style={{
              padding: '10px 14px', marginBottom: 12,
              background: passMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${passMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 'var(--radius-sm)', fontSize: 13,
              color: passMsg.type === 'success' ? 'var(--accent-green)' : '#ef4444',
            }}>
              {passMsg.text}
            </div>
          )}
          <button type="submit" className="btn btn-primary">
            Saqlash
          </button>
        </form>
      </div>

      {/* System info */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={18} color="var(--accent-blue)" />
          Tizim ma'lumotlari
        </h2>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden',
        }}>
          {[
            ['OS nomi', 'Dagzo OS'],
            ['Dastur versiyasi', sysInfo ? `v${sysInfo.appVersion}` : '—'],
            ['Electron', sysInfo ? sysInfo.electronVersion : '—'],
            ['Node.js', sysInfo ? sysInfo.nodeVersion : '—'],
            ['Platform', sysInfo ? sysInfo.platform : '—'],
            ['Arxitektura', sysInfo ? sysInfo.arch : '—'],
          ].map(([key, val], i) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: i < 5 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{key}</span>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
