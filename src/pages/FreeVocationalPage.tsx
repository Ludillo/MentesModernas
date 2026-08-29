import { useEffect, useState } from 'react'
import TestRunner from '../components/TestRunner'
import { FREE_TEST_CODE } from '../lib/catalog'
import { calculateResults, getQuestions, submitFreeResult } from '../services/testService'
import type { AreaResult, TestQuestion } from '../types/models'
import { Link } from 'react-router-dom'
import TestFeedback from '../components/TestFeedback'
import { recordTestCompletion } from '../services/feedbackService'
import { useNavigate } from 'react-router-dom'

export default function FreeVocationalPage() {
  const navigate=useNavigate()
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [results, setResults] = useState<AreaResult[] | null>(null)
  useEffect(()=>{if(results)window.scrollTo({top:0,behavior:'smooth'})},[results])
  const [error, setError] = useState('')

  useEffect(() => {
    getQuestions(FREE_TEST_CODE).then(setQuestions).catch(e => setError(e.message))
  }, [])

  if (error) return <main className="page section"><div className="alert error">{error}</div></main>
  if (!questions.length) return <main className="page section"><div className="loading">Cargando preguntas...</div></main>

  if (results) {
    const top = results[0]
    return (
      <main className="page section result-page">
        <div className="result-spotlight">
          <span className="eyebrow">TU RESULTADO GRATUITO</span>
          <div className="result-emoji">{top.code === 'R' ? '🛠️' : top.code === 'I' ? '🔬' : top.code === 'A' ? '🎨' : top.code === 'S' ? '🤝' : top.code === 'E' ? '🚀' : '📊'}</div>
          <h1>Tu área predominante es<br/><span>{top.name}</span></h1>
          <p>{top.description}</p>
          <div className="simple-careers">
            {top.careers.slice(0,4).map(c => <span key={c}>{c}</span>)}
          </div>
        </div>
        <div className="upgrade-banner">
          <div>
            <span className="eyebrow">ESTO ES SOLO EL COMIENZO</span>
            <h2>¿Quieres saber cuáles carreras encajan mejor contigo?</h2>
            <p>El perfil Premium analiza las seis áreas con mayor profundidad, cruza tu orientación principal con la secundaria y conserva el resultado en tu cuenta.</p>
          </div>
          <Link className="btn primary large" to="/premium/vocacional">Descubrir mi perfil completo →</Link>
        </div>
        <TestFeedback testCode={FREE_TEST_CODE}/>
      </main>
    )
  }

  return <TestRunner title="Orientación Vocacional Gratuita" questions={questions} onFinish={async a => {recordTestCompletion(FREE_TEST_CODE).catch(()=>{});const saved=await submitFreeResult({testCode:FREE_TEST_CODE,answers:a});if(saved)navigate(`/resultado/${saved.evaluationId}`);else setResults(calculateResults(questions, a))}} />
}
