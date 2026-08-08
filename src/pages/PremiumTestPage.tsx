import { useEffect, useState } from 'react'
import { PREMIUM_TEST_CODE } from '../lib/catalog'
import TestRunner from '../components/TestRunner'
import { calculateResults, getQuestions, submitPremiumResult } from '../services/testService'
import type { AreaResult, TestQuestion } from '../types/models'
import { useNavigate } from 'react-router-dom'

export default function PremiumTestPage() {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { getQuestions(PREMIUM_TEST_CODE).then(setQuestions).catch(e=>setError(e.message)) }, [])

  if (error) return <main className="page section"><div className="alert error">{error}</div></main>
  if (!questions.length) return <main className="page section"><div className="loading">Preparando evaluación Premium...</div></main>

  const finish = async (answers: Record<string, number>) => {
    try {
      const results: AreaResult[] = calculateResults(questions, answers)
      const saved = await submitPremiumResult({ testCode: PREMIUM_TEST_CODE, answers, results })
      navigate(`/resultado/${saved.evaluationId}`)
    } catch (e:any) {
      setError(e.message)
    }
  }

  return <TestRunner title="Perfil Vocacional Premium" questions={questions} onFinish={finish} />
}
