import { useState } from 'react'
import { FileQuestion, CheckCircle, XCircle, Award } from 'lucide-react'

export default function Tests() {
  const [quiz, setQuiz] = useState(null)
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const score = quiz ? quiz.questions.filter(
    (q) => answers[q.id] === q.answer
  ).length : 0

  const handleAnswer = (questionId, optionIdx) => {
    if (finished) return
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }))
  }

  if (quiz === null) {
    return (
      <div className="fade-in">
        <h1 className="page-title" style={{ marginBottom: 8 }}>Testlar</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Bilimingizni sinang
        </p>
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <FileQuestion size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>Hali test qo'shilmagan</p>
          <p style={{ fontSize: 13 }}>Testlarni darslik papkasidagi tests/ ga qo'ying</p>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="fade-in" style={{ maxWidth: 600 }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>Testlar</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Bilimingizni sinang
        </p>
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{quiz.title}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
            {quiz.questions.length} ta savol
          </p>
          <button className="btn btn-primary" style={{ padding: '12px 32px' }} onClick={() => setStarted(true)}>
            Testni boshlash →
          </button>
        </div>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / quiz.questions.length) * 100)
    return (
      <div className="fade-in" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
        <Award size={64} color={pct >= 70 ? 'var(--accent-green)' : 'var(--accent-cyan)'} style={{ marginBottom: 20 }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          {pct >= 90 ? "A'lo!" : pct >= 70 ? 'Yaxshi!' : "Ko'proq o'qing"}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 32 }}>
          {score} / {quiz.questions.length} to'g'ri javob ({pct}%)
        </p>
        <button className="btn btn-primary" onClick={() => { setStarted(false); setAnswers({}); setFinished(false) }}>
          Qayta boshlash
        </button>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">{quiz.title}</h1>
        <span style={{ color: 'var(--text-secondary)' }}>
          {Object.keys(answers).length} / {quiz.questions.length}
        </span>
      </div>

      {quiz.questions.map((q, qi) => (
        <div key={q.id} style={{
          marginBottom: 20, padding: 24,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>
            <span style={{ color: 'var(--accent-blue)', marginRight: 8 }}>{qi + 1}.</span>
            {q.question}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi
              return (
                <button
                  key={oi}
                  onClick={() => handleAnswer(q.id, oi)}
                  style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selected ? 'var(--accent-blue)' : 'var(--border)'}`,
                    background: selected ? 'rgba(79,70,229,0.15)' : 'var(--bg-secondary)',
                    color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer', textAlign: 'left', fontSize: 14,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontWeight: 600, marginRight: 8, color: 'var(--text-muted)' }}>
                    {String.fromCharCode(65 + oi)}.
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {Object.keys(answers).length === quiz.questions.length && (
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 16, marginTop: 8 }}
          onClick={() => setFinished(true)}
        >
          <CheckCircle size={18} />
          Testni yakunlash
        </button>
      )}
    </div>
  )
}
