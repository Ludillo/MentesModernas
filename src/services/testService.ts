import { backend } from '../lib/backend'
import { AREA_META } from '../lib/catalog'
import type { AreaCode, AreaResult, TestQuestion } from '../types/models'

export async function getQuestions(testCode: string): Promise<TestQuestion[]> {
  const { data, error } = await backend
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
  const { data: sessionData } = await backend.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) throw new Error('Debes ingresar para guardar un test premium.')

  const attemptKey='mm_submission_'+payload.testCode
  const requestId=sessionStorage.getItem(attemptKey)??crypto.randomUUID()
  sessionStorage.setItem(attemptKey,requestId)
  const res = await fetch(`/api/submit-premium-result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`},
    body: JSON.stringify({...payload,requestId})
  })
  if (!res.ok) throw new Error((await res.json()).error ?? 'No se pudo guardar el resultado')
  const saved=await res.json();sessionStorage.removeItem(attemptKey);return saved
}

export async function submitFreeResult(payload:{testCode:string;answers:Record<string,number>}){
  const {data:sessionData}=await backend.auth.getSession()
  const accessToken=sessionData.session?.access_token
  if(!accessToken)return null
  const res=await fetch(`/api/submit-free-result`,{
    method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${accessToken}`},body:JSON.stringify(payload)
  })
  const data=await res.json()
  if(!res.ok)throw new Error(data.error??'No se pudo guardar el resultado gratuito.')
  return data as {ok:boolean;evaluationId:string}
}
