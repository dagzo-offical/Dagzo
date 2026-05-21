import { useState } from 'react'
import { Shield, X, Eye, EyeOff } from 'lucide-react'

export default function AdminExitModal({ onClose }) {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) {
      setError('Parol kiriting')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (window.dagzo) {
        const result = await window.dagzo.adminExit(password)
        if (result.success) {
          onClose()
        } else {
          setError("Noto'g'ri parol")
          setPassword('')
        }
      } else {
        // Browser mode — test uchun
        if (password === 'dagzo2024') {
          alert('Admin rejimga kirildi (browser mode)')
          onClose()
        } else {
          setError("Noto'g'ri parol")
          setPassword('')
        }
      }
    } catch {
      setError('Xato yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44,
              background: 'rgba(124, 58, 237, 0.15)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(124, 58, 237, 0.3)',
            }}>
              <Shield size={22} color="var(--accent-purple)" />
            </div>
            <div>
              <div className="modal-title">Admin chiqish</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Admin parolini kiriting
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ width: 36, height: 36 }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type={showPass ? 'text' : 'password'}
              className="input"
              placeholder="Admin paroli"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                padding: 4,
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{
              color: '#ef4444', fontSize: 13, marginBottom: 16,
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Bekor qilish
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
