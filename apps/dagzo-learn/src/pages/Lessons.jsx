import { useState, useEffect } from 'react'
import { BookOpen, Search, ExternalLink, RefreshCw } from 'lucide-react'

export default function Lessons() {
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [opening, setOpening] = useState(null)

  const loadLessons = async () => {
    setLoading(true)
    try {
      if (window.dagzo) {
        const data = await window.dagzo.getLessons()
        setLessons(data)
      } else {
        // Demo data
        setLessons([
          { id: 'matematika-5', name: 'Matematika 5', publisher: 'Dagzo', version: '1.0.0' },
          { id: 'python-darslari', name: 'Python Darslari', publisher: 'Dagzo', version: '1.0.0' },
          { id: 'english-basic', name: 'English Basic', publisher: 'Dagzo', version: '1.0.0' },
        ])
      }
    } catch {
      setLessons([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLessons() }, [])

  const handleOpen = async (lesson) => {
    setOpening(lesson.id)
    try {
      if (window.dagzo) {
        const result = await window.dagzo.openLesson(lesson.id)
        if (!result.success) {
          alert(result.error || 'Darslikni ochishda xato yuz berdi')
        }
      } else {
        alert(`"${lesson.name}" darsligini ochish (demo rejim)`)
      }
    } finally {
      setOpening(null)
    }
  }

  const filtered = lessons.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.publisher?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Darsliklar</h1>
          <p className="page-subtitle">{lessons.length} ta darslik o'rnatilgan</p>
        </div>
        <button className="btn btn-secondary" onClick={loadLessons}>
          <RefreshCw size={16} />
          Yangilash
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={16} style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)',
        }} />
        <input
          className="input"
          placeholder="Darslik qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <BookOpen size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            {search ? 'Darslik topilmadi' : 'Hech qanday darslik o\'rnatilmagan'}
          </p>
          <p style={{ fontSize: 13 }}>
            {!search && 'Darsliklarni /opt/dagzo/apps/ papkasiga qo\'ying'}
          </p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((lesson) => (
            <div key={lesson.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52,
                  background: 'rgba(79,70,229,0.15)',
                  border: '1px solid rgba(79,70,229,0.3)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 24,
                }}>
                  📚
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{lesson.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {lesson.publisher} · v{lesson.version}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleOpen(lesson)}
                  disabled={opening === lesson.id}
                >
                  <ExternalLink size={14} />
                  {opening === lesson.id ? 'Ochilmoqda...' : 'Ochish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
