import { useState } from 'react'
import { Play, Clock } from 'lucide-react'

const DEMO_VIDEOS = [
  { id: 1, title: 'Algebra kirish darsi', duration: '12:34', subject: 'Matematika' },
  { id: 2, title: 'Python o\'zgaruvchilar', duration: '08:22', subject: 'Dasturlash' },
  { id: 3, title: "Ingliz tili so'zlashuv", duration: '15:10', subject: 'Ingliz tili' },
  { id: 4, title: 'Fizika — harakat qonunlari', duration: '18:45', subject: 'Fizika' },
]

export default function Videos() {
  const [playing, setPlaying] = useState(null)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Videolar</h1>
          <p className="page-subtitle">Video darsliklar</p>
        </div>
      </div>

      {playing ? (
        <div>
          <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => setPlaying(null)}>
            ← Orqaga
          </button>
          <div style={{
            height: 'calc(100vh - 230px)',
            background: '#000',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12, color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            <Play size={48} style={{ opacity: 0.3 }} />
            <p>{playing.title}</p>
            <p style={{ fontSize: 12 }}>Video player — .mp4/.webm fayllarni ijro etadi</p>
          </div>
        </div>
      ) : (
        <div className="grid-cards">
          {DEMO_VIDEOS.map((video) => (
            <div key={video.id} className="card" onClick={() => setPlaying(video)}>
              <div style={{
                height: 140,
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(79,70,229,0.2) 100%)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(124,58,237,0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Play size={20} color="white" fill="white" />
                </div>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{video.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-purple">{video.subject}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {video.duration}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
