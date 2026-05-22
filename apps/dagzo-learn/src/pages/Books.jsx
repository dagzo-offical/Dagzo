import { useState } from 'react'
import { BookMarked, Upload, X } from 'lucide-react'

export default function Books() {
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitoblar</h1>
          <p className="page-subtitle">PDF kitoblarni o'qing</p>
        </div>
        <button className="btn btn-secondary" onClick={() => alert('Tez orada...')}>
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
      ) : books.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <BookMarked size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>Hali kitob qo'shilmagan</p>
          <p style={{ fontSize: 13 }}>Kitoblarni darslik papkasidagi books/ ga qo'ying</p>
        </div>
      ) : (
        <div className="grid-cards">
          {books.map((book) => (
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
