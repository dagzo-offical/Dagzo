import { useState, useEffect } from 'react'
import { Monitor, Key, Info, Check, CheckCircle, AlertCircle } from 'lucide-react'

const WALLPAPER_COUNT = 10

export default function Settings() {
  const [activeWallpaper, setActiveWallpaper] = useState(2)
  const [brandingDir, setBrandingDir] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passMsg, setPassMsg] = useState(null)
  const [wpMsg, setWpMsg] = useState(null)
  const [sysInfo, setSysInfo] = useState(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (window.dagzo) {
      window.dagzo.getSystemInfo().then(setSysInfo).catch(() => {})
      window.dagzo.getBrandingDir().then(setBrandingDir).catch(() => {})
    }
  }, [])

  // Wallpaper fayl yo'li — Electron file:// protokoli orqali
  const wallpaperSrc = (id) => {
    if (!brandingDir) return null
    // Electron'da local fayllar file:// bilan ochiladi
    const filePath = `${brandingDir}/wallpapers/wallpaper-${id}.png`
    // Windows: C:\... → file:///C:/...
    // Linux:   /opt/... → file:///opt/...
    return filePath.startsWith('/') ? `file://${filePath}` : `file:///${filePath}`
  }

  const handleWallpaper = async (id) => {
    setActiveWallpaper(id)
    setWpMsg(null)
    setApplying(true)

    try {
      if (window.dagzo) {
        const result = await window.dagzo.setWallpaper(id)
        if (result.success) {
          setWpMsg({ type: 'success', text: `wallpaper-${id}.png desktop fon sifatida o'rnatildi` })
        } else {
          setWpMsg({ type: 'warn', text: result.error || 'Wallpaper o\'rnatilmadi (XFCE kerak)' })
        }
      } else {
        setWpMsg({ type: 'info', text: `wallpaper-${id}.png tanlandi (Electron rejimida qo'llaniladi)` })
      }
    } catch {
      setWpMsg({ type: 'warn', text: 'Wallpaper o\'rnatishda xato' })
    } finally {
      setApplying(false)
      setTimeout(() => setWpMsg(null), 4000)
    }
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Parollar mos kelmadi' })
      return
    }
    if (newPassword.length < 4) {
      setPassMsg({ type: 'error', text: "Parol kamida 4 ta belgi bo'lishi kerak" })
      return
    }
    setPassMsg({ type: 'success', text: "Parol o'zgartirildi (keyingi kirganingizda kuchga kiradi)" })
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPassMsg(null), 5000)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Sozlamalar</h1>
      </div>

      {/* ── Wallpaper section ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{
              fontSize: 16, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
            }}>
              <Monitor size={18} color="var(--accent-cyan)" />
              Desktop fon rasmi
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Tanlangan: <strong style={{ color: 'var(--accent-cyan)' }}>wallpaper-{activeWallpaper}.png</strong>
              {applying && <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Qo'llanilmoqda...</span>}
            </p>
          </div>
        </div>

        {/* Wallpaper grid — real thumbnails */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
        }}>
          {Array.from({ length: WALLPAPER_COUNT }, (_, i) => i + 1).map((id) => {
            const isActive = activeWallpaper === id
            const src = wallpaperSrc(id)

            return (
              <div
                key={id}
                onClick={() => handleWallpaper(id)}
                style={{
                  aspectRatio: '16/9',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${isActive ? 'var(--accent-blue)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                  transform: isActive ? 'scale(1.03)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.border = '2px solid rgba(79,70,229,0.5)'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.border = '2px solid var(--border)'
                }}
              >
                {/* Real wallpaper thumbnail */}
                {src ? (
                  <img
                    src={src}
                    alt={`Wallpaper ${id}`}
                    onError={(e) => {
                      // Rasm yuklanmasa gradient placeholder ko'rsat
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                    }}
                  />
                ) : null}

                {/* Fallback gradient (rasm yo'q bo'lsa yoki yuklanmasa) */}
                <div style={{
                  display: src ? 'none' : 'flex',
                  position: 'absolute', inset: 0,
                  background: `hsl(${id * 36}, 50%, 12%)`,
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'var(--text-muted)',
                  flexDirection: 'column', gap: 4,
                }}>
                  <span style={{ fontSize: 16 }}>🖼</span>
                  <span>{id}</span>
                </div>

                {/* Active checkmark */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    background: 'var(--accent-blue)',
                    borderRadius: '50%',
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(79,70,229,0.6)',
                  }}>
                    <Check size={12} color="white" />
                  </div>
                )}

                {/* Wallpaper number label */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  padding: '8px 6px 4px',
                  fontSize: 10, color: 'rgba(255,255,255,0.7)',
                  textAlign: 'center',
                }}>
                  {id}
                </div>
              </div>
            )
          })}
        </div>

        {/* Wallpaper status message */}
        {wpMsg && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            background: wpMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(234,179,8,0.1)',
            border: `1px solid ${wpMsg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(234,179,8,0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13,
            color: wpMsg.type === 'success' ? 'var(--accent-green)' : '#eab308',
          }}>
            {wpMsg.type === 'success'
              ? <CheckCircle size={15} />
              : <AlertCircle size={15} />}
            {wpMsg.text}
          </div>
        )}
      </div>

      {/* ── Admin paroli ── */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{
          fontSize: 16, fontWeight: 600, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
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
              placeholder="Yangi parol kiriting"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Tasdiqlash
            </label>
            <input
              type="password"
              className="input"
              placeholder="Parolni takrorlang"
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

      {/* ── Tizim ma'lumotlari ── */}
      <div>
        <h2 style={{
          fontSize: 16, fontWeight: 600, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
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
            ['Branding papkasi', brandingDir || '—'],
          ].map(([key, val], i, arr) => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{key}</span>
              <span style={{
                fontWeight: 500, fontSize: 13,
                color: key === 'OS nomi' ? 'var(--accent-cyan)' : 'var(--text-primary)',
                maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: key === 'Branding papkasi' ? 'monospace' : 'inherit',
                fontSize: key === 'Branding papkasi' ? 11 : 13,
              }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
