import { useState } from 'react'
import { BookMarked, Upload, X } from 'lucide-react'

const DEMO_BOOKS = [
  { id: 1, title: 'Matematika 5-sinf', author: 'Dagzo', pages: 320, size: '4.2 MB' },
  { id: 2, title: "O'zbek tili grammatikasi", author: 'Dagzo', pages: 280, size: '3.1 MB' },
  { id: 3, title: 'Informatika asoslari', author: 'Dagzo', pages: 240, size: '5.8 MB' },
]

export default function Books() {
  const [selectedBook, setSelectedBook] = useState(null)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitoblar</h1>
          <p className="page-subtitle">PDF kitoblarni o'qing</p>
        </div>
        <button className="btn btn-secondary">
          <Upload size={16} />
          Kitob qo'shish
        </button>
      </div>

      {selectedBook ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="btn btn-secondary" onClick={() => setSelectedBook(null)}>
              ← Orqaga
            </button>
            <h2 style={{ fontWeight: 600 }}>{selectedBook.title}</h2>
            <button className="btn btn-secondary btn-icon" onClick={() => setSelectedBook(null)}>
              <X size={16} />
            </button>
          </div>
          <div style={{
            height: 'calc(100vh - 220px)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', flexDirection: 'column', gap: 12,
          }}>
            <BookMarked size={48} style={{ opacity: 0.3 }} />
            <p>PDF viewer — darslik papkasidagi .pdf faylni ko'rsatadi</p>
            <p style={{ fontSize: 12 }}>lesson-template/app/books/ papkasiga PDF qo'ying</p>
          </div>
        </div>
      ) : (
        <div className="grid-cards">
          {DEMO_BOOKS.map((book) => (
            <div key={book.id} className="card" onClick={() => setSelectedBook(book)}>
              <div style={{
                width: 52, height: 52,
                background: 'rgba(6,182,212,0.15)',
                border: '1px solid rgba(6,182,212,0.3)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14, fontSize: 24,
              }}>📗</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{book.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
                {book.author} · {book.pages} bet · {book.size}
              </div>
              <span className="badge badge-cyan">PDF</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
