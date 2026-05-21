import { useState } from 'react'
import { FileQuestion, CheckCircle, XCircle, Award } from 'lucide-react'

const DEMO_QUIZ = {
  title: 'Matematika asoslari',
  questions: [
    { id: 1, question: '5 × 8 = ?', options: ['35', '40', '45', '48'], answer: 1 },
    { id: 2, question: '√144 = ?', options: ['11', '12', '13', '14'], answer: 1 },
    { id: 3, question: '2³ = ?', options: ['6', '8', '9', '12'], answer: 1 },
    { id: 4, question: '100 ÷ 4 = ?', options: ['20', '25', '30', '40'], answer: 1 },
  ],
}

export default function Tests() {
  const [started, setStarted] = useState(false)
  const [answers, setAnswers] = useState({})
  const [finished, setFinished] = useState(false)

  const score = DEMO_QUIZ.questions.filter(
    (q) => answers[q.id] === q.answer
  ).length

  const handleAnswer = (questionId, optionIdx) => {
    if (finished) return
    setAnswers(prev => ({ ...prev, [questionId]: optionIdx }))
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
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{DEMO_QUIZ.title}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
            {DEMO_QUIZ.questions.length} ta savol
          </p>
          <button className="btn btn-primary" style={{ padding: '12px 32px' }} onClick={() => setStarted(true)}>
            Testni boshlash →
          </button>
        </div>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / DEMO_QUIZ.questions.length) * 100)
    return (
      <div className="fade-in" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>
        <Award size={64} color={pct >= 70 ? 'var(--accent-green)' : 'var(--accent-cyan)'} style={{ marginBottom: 20 }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          {pct >= 90 ? "A'lo!" : pct >= 70 ? 'Yaxshi!' : "Ko'proq o'qing"}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, marginBottom: 32 }}>
          {score} / {DEMO_QUIZ.questions.length} to'g'ri javob ({pct}%)
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
        <h1 className="page-title">{DEMO_QUIZ.title}</h1>
        <span style={{ color: 'var(--text-secondary)' }}>
          {Object.keys(answers).length} / {DEMO_QUIZ.questions.length}
        </span>
      </div>

      {DEMO_QUIZ.questions.map((q, qi) => (
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

      {Object.keys(answers).length === DEMO_QUIZ.questions.length && (
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
