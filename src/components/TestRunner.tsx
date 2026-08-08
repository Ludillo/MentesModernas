import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { TestQuestion } from '../types/models'

type Props = {
  title: string
  questions: TestQuestion[]
  onFinish: (answers: Record<string, number>) => void
}

const options = [
  { value: 0, emoji: '😐', title: 'Nada', subtitle: 'No me identifica' },
  { value: 1, emoji: '🙂', title: 'Poco', subtitle: 'Me identifica ligeramente' },
  { value: 2, emoji: '😊', title: 'Algo', subtitle: 'Me identifica moderadamente' },
  { value: 3, emoji: '😃', title: 'Bastante', subtitle: 'Me representa mucho' },
  { value: 4, emoji: '🤩', title: 'Totalmente', subtitle: 'Me representa claramente' }
]

export default function TestRunner({ title, questions, onFinish }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const questionTopRef = useRef<HTMLDivElement | null>(null)

  const q = questions[current]
  const answered = Object.keys(answers).length
  const progress = useMemo(
    () => Math.round(answered / questions.length * 100),
    [answered, questions.length]
  )

  // Cada vez que cambia la pregunta, en celular/tablet volvemos a colocar
  // el enunciado en la zona visible. En desktop conservamos el scroll actual.
  useEffect(() => {
    if (current === 0) return

    const scrollQuestionIntoView = () => {
      if (window.innerWidth <= 900 && questionTopRef.current) {
        questionTopRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }

    // Esperamos a que React haya renderizado el nuevo enunciado.
    const frame = requestAnimationFrame(scrollQuestionIntoView)
    return () => cancelAnimationFrame(frame)
  }, [current])

  if (!q) {
    return <div className="panel">No existen preguntas activas para este test.</div>
  }

  const next = () => {
    if (answers[q.id] === undefined) return

    if (current === questions.length - 1) {
      onFinish(answers)
      return
    }

    setCurrent(v => v + 1)
  }

  const previous = () => {
    setCurrent(v => Math.max(0, v - 1))
  }

  return (
    <main className="wizard-shell">
      <aside className="wizard-progress">
        <span className="eyebrow">{title}</span>

        <div
          className="progress-circle"
          style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}
        >
          <div>
            <strong>{progress}%</strong>
            <small>completado</small>
          </div>
        </div>

        <p>{answered} de {questions.length} respuestas</p>

        <div className="tip-card">
          No hay respuestas correctas o incorrectas. Responde pensando en lo que realmente disfrutas.
        </div>
      </aside>

      <section className="wizard-panel">
        <div ref={questionTopRef} className="question-scroll-anchor">
          <div className="question-kicker">
            Pregunta {current + 1} de {questions.length}
          </div>

          <h1>{q.prompt}</h1>
        </div>

        <div className="answer-grid">
          {options.map(o => (
            <button
              key={o.value}
              className={answers[q.id] === o.value ? 'answer selected' : 'answer'}
              onClick={() => setAnswers({ ...answers, [q.id]: o.value })}
            >
              <span>{o.emoji}</span>
              <b>{o.title}</b>
              <small>{o.subtitle}</small>
            </button>
          ))}
        </div>

        <div className="wizard-actions">
          <button
            className="btn secondary"
            disabled={current === 0}
            onClick={previous}
          >
            ← Anterior
          </button>

          <button
            className="btn primary"
            disabled={answers[q.id] === undefined}
            onClick={next}
          >
            {current === questions.length - 1
              ? 'Ver mi resultado →'
              : 'Siguiente →'}
          </button>
        </div>
      </section>
    </main>
  )
}
