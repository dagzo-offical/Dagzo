import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, BookMarked, Play, FileQuestion, Wifi, ArrowRight } from 'lucide-react'

const QUICK_LINKS = [
  { path: '/lessons', icon: BookOpen, label: 'Darsliklar', color: '#4f46e5', desc: "Barcha darslarni ko'ring" },
  { path: '/books', icon: BookMarked, label: 'Kitoblar', color: '#06b6d4', desc: 'PDF kitoblarni o\'qing' },
  { path: '/videos', icon: Play, label: 'Videolar', color: '#7c3aed', desc: 'Video darslar' },
  { path: '/tests', icon: FileQuestion, label: 'Testlar', color: '#10b981', desc: "Bilimingizni sinang" },
  { path: '/wifi', icon: Wifi, label: 'Wi-Fi', color: '#ec4899', desc: 'Tarmoq sozlamalari' },
]

export default function Home() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [sysInfo, setSysInfo] = useState(null)
  const now = new Date()

  useEffect(() => {
    if (window.dagzo) {
      window.dagzo.getLessons().then(setLessons).catch(() => {})
      window.dagzo.getSystemInfo().then(setSysInfo).catch(() => {})
    }
  }, [])

  const greeting = now.getHours() < 12
    ? 'Xayrli tong!'
    : now.getHours() < 17
    ? 'Xayrli kun!'
    : "Xayrli kech!"

  return (
    <div className="fade-in">
      {/* Hero section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(6,182,212,0.1) 50%, rgba(124,58,237,0.15) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 40px',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, right: 200,
          width: 150, height: 150,
          background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(79,70,229,0.2)',
            border: '1px solid rgba(79,70,229,0.4)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 12, fontWeight: 600, color: '#818cf8',
            marginBottom: 16,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
            Dagzo OS
          </div>

          <h1 style={{
            fontSize: 36, fontWeight: 800, marginBottom: 12,
            background: 'var(--gradient-aurora)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {greeting}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, maxWidth: 520 }}>
            Dagzo Learn — zamonaviy ta'lim platformasi. Darsliklar, kitoblar va testlar bilan bilimingizni oshiring.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/lessons')}
              style={{ gap: 8 }}
            >
              <BookOpen size={16} />
              Darsliklarga o'tish
              <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/wifi')}
            >
              <Wifi size={16} />
              Wi-Fi sozlash
            </button>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
          Tezkor o'tish
        </h2>
        <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {QUICK_LINKS.map(({ path, icon: Icon, label, color, desc }) => (
            <div
              key={path}
              className="card"
              onClick={() => navigate(path)}
              style={{ padding: 20, textAlign: 'center' }}
            >
              <div style={{
                width: 52, height: 52,
                background: `${color}20`,
                border: `1px solid ${color}40`,
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <Icon size={24} color={color} />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent lessons */}
      {lessons.length > 0 ? (
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)' }}>
              O'rnatilgan darsliklar ({lessons.length})
            </h2>
            <button className="btn btn-secondary" onClick={() => navigate('/lessons')}>
              Barchasi <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid-cards">
            {lessons.slice(0, 4).map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 28, padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>Hali darslik o'rnatilmagan</p>
          <p style={{ fontSize: 12, marginTop: 6 }}>Darsliklarni /opt/dagzo/apps/ papkasiga qo'ying</p>
        </div>
      )}

      {/* System info */}
      {sysInfo && (
        <div style={{
          marginTop: 28, padding: '16px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', gap: 24, flexWrap: 'wrap',
          fontSize: 12, color: 'var(--text-muted)',
        }}>
          <span>Dagzo OS</span>
          <span>•</span>
          <span>Electron {sysInfo.electronVersion}</span>
          <span>•</span>
          <span>v{sysInfo.appVersion}</span>
          <span>•</span>
          <span>Platform: {sysInfo.platform}</span>
        </div>
      )}
    </div>
  )
}

function LessonCard({ lesson }) {
  const handleOpen = async () => {
    if (window.dagzo) {
      const result = await window.dagzo.openLesson(lesson.id)
      if (!result.success) {
        alert(result.error || 'Darslikni ochishda xato')
      }
    }
  }

  return (
    <div className="card" onClick={handleOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44,
          background: 'rgba(79,70,229,0.15)',
          border: '1px solid rgba(79,70,229,0.3)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 20,
        }}>
          📚
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{lesson.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{lesson.publisher}</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="badge badge-blue">v{lesson.version}</span>
        <span style={{ fontSize: 12, color: 'var(--accent-cyan)' }}>Ochish →</span>
      </div>
    </div>
  )
}
