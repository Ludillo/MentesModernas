import { supabase } from '../lib/supabase'
import { AREA_META } from '../lib/catalog'
import type { AreaCode, AreaResult, TestQuestion } from '../types/models'

export async function getQuestions(testCode: string): Promise<TestQuestion[]> {
  const { data, error } = await supabase
    .rpc('get_active_test_questions', { p_test_code: testCode })

  if (error) throw error
  return (data ?? []) as TestQuestion[]
}

export function calculateResults(questions: TestQuestion[], answers: Record<string, number>): AreaResult[] {
  const totals: Record<AreaCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  const counts: Record<AreaCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }

  questions.forEach(q => {
    const area = q.dimension_code as AreaCode
    counts[area] += 1
    totals[area] += answers[q.id] ?? 0
  })

  return (Object.keys(totals) as AreaCode[])
    .map(code => {
      const maxScore = counts[code] * 4
      const meta = AREA_META[code]
      return {
        code,
        name: meta.name,
        score: totals[code],
        maxScore,
        percent: maxScore ? Math.round(totals[code] / maxScore * 100) : 0,
        description: meta.description,
        careers: [...meta.careers]
      }
    })
    .sort((a,b) => b.percent - a.percent)
}

export async function submitPremiumResult(payload: {
  testCode: string
  answers: Record<string, number>
  results: AreaResult[]
}) {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Debes ingresar para guardar un test premium.')

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-premium-result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'No se pudo guardar el resultado')
  return res.json()
}
