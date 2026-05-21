import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, Lock, Unlock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

const API = 'http://127.0.0.1:3001/api/wifi'

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

export default function WiFi() {
  const [networks, setNetworks] = useState([])
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(null)
  const [selected, setSelected] = useState(null)
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)

  const loadNetworks = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const [netData, statusData] = await Promise.all([
        apiFetch('/list'),
        apiFetch('/status'),
      ])
      if (netData.success) setNetworks(netData.networks)
      else setMessage({ type: 'error', text: netData.error })
      setStatus(statusData)
    } catch {
      setMessage({ type: 'error', text: 'Wi-Fi API ga ulanib bo\'lmadi. Backend ishga tushganmi?' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNetworks() }, [loadNetworks])

  const handleConnect = async (network) => {
    if (network.secured && !password) {
      setSelected(network)
      return
    }

    setConnecting(network.ssid)
    setMessage(null)
    try {
      const result = await apiFetch('/connect', {
        method: 'POST',
        body: JSON.stringify({ ssid: network.ssid, password: password || undefined }),
      })
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        setSelected(null)
        setPassword('')
        setTimeout(loadNetworks, 2000)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Ulanishda xato yuz berdi' })
    } finally {
      setConnecting(null)
    }
  }

  const signalIcon = (signal) => {
    if (signal >= 70) return '▂▄▆█'
    if (signal >= 40) return '▂▄▆░'
    if (signal >= 20) return '▂▄░░'
    return '▂░░░'
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Wi-Fi</h1>
          <p className="page-subtitle">Simsiz tarmoqlarni boshqarish</p>
        </div>
        <button className="btn btn-secondary" onClick={loadNetworks} disabled={loading}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          Skanerlash
        </button>
      </div>

      {/* Connection status */}
      {status && (
        <div style={{
          padding: '16px 20px', marginBottom: 20,
          background: status.connected ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)',
          border: `1px solid ${status.connected ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {status.connected ? (
            <>
              <Wifi size={20} color="var(--accent-green)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                  Ulangan: {status.connection?.name}
                </div>
                {status.connection?.ip && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    IP: {status.connection.ip}
                  </div>
                )}
              </div>
              <span className="status-dot connected" style={{ marginLeft: 'auto' }} />
            </>
          ) : (
            <>
              <WifiOff size={20} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-muted)' }}>Internet ulanishi yo'q</span>
            </>
          )}
        </div>
      )}

      {/* Message */}
      {message && (
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
          color: message.type === 'success' ? 'var(--accent-green)' : '#ef4444',
        }}>
          {message.type === 'success'
            ? <CheckCircle size={16} />
            : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Password modal */}
      {selected && (
        <div style={{
          padding: '20px', marginBottom: 20,
          background: 'var(--bg-card)', border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-md)',
        }}>
          <p style={{ marginBottom: 12, fontWeight: 500 }}>
            <Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            "{selected.ssid}" tarmoq paroli:
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              type="password"
              placeholder="Wi-Fi paroli"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConnect(selected)}
              autoFocus
            />
            <button
              className="btn btn-primary"
              onClick={() => handleConnect(selected)}
              disabled={!password || connecting === selected.ssid}
            >
              {connecting === selected.ssid ? 'Ulanmoqda...' : 'Ulash'}
            </button>
            <button className="btn btn-secondary" onClick={() => { setSelected(null); setPassword('') }}>
              Bekor
            </button>
          </div>
        </div>
      )}

      {/* Networks list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : networks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <WifiOff size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>Tarmoqlar topilmadi</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {networks.map((net) => (
            <div
              key={net.ssid}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '14px 18px',
                background: net.connected ? 'rgba(16,185,129,0.08)' : 'var(--bg-card)',
                border: `1px solid ${net.connected ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                gap: 14,
              }}
              onClick={() => !net.connected && handleConnect(net)}
            >
              <div style={{
                color: net.signal >= 70 ? 'var(--accent-green)'
                  : net.signal >= 40 ? 'var(--accent-cyan)'
                  : 'var(--text-muted)',
                fontFamily: 'monospace', fontSize: 16, letterSpacing: 2,
              }}>
                {signalIcon(net.signal)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{net.ssid}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Signal: {net.signal}% · {net.security}
                </div>
              </div>

              {net.secured ? (
                <Lock size={16} color="var(--text-muted)" />
              ) : (
                <Unlock size={16} color="var(--accent-green)" />
              )}

              {net.connected && (
                <span className="badge badge-green">Ulangan</span>
              )}

              {connecting === net.ssid && (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              )}

              {!net.connected && connecting !== net.ssid && (
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
                  Ulash
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
