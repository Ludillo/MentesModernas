import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import TestFeedback from '../components/TestFeedback'

export default function PremiumResultPage() {
  const { id } = useParams()
  const [evaluation, setEvaluation] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('evaluations')
      .select('id,completed_at,result_json,test_types(name),test_versions(code)')
      .eq('id', id)
      .single()
      .then(({data,error}) => error ? setError(error.message) : setEvaluation(data))
  }, [id])

  if (error) return <main className="page section"><div className="alert error">{error}</div></main>
  if (!evaluation) return <main className="page section"><div className="loading">Construyendo tu informe...</div></main>

  const r = evaluation.result_json
  const top = r.results?.[0]
  const second = r.results?.[1]
  return (
    <main className="page section result-page">
      <div className="premium-result-hero">
        <span className="eyebrow">INFORME PREMIUM</span>
        <h1>Tu combinación principal:<br/><span>{top?.name}</span> + <span>{second?.name}</span></h1>
        <p>{r.summary}</p>
      </div>
      <div className="areas-result-grid">
        {(r.results ?? []).map((x:any) => (
          <article key={x.code} className="score-card">
            <div className="score-number">{x.percent}%</div>
            <h3>{x.name}</h3><p>{x.description}</p>
          </article>
        ))}
      </div>
      <section className="career-report">
        <h2>Carreras para explorar</h2>
        <div className="career-columns">
          <div><h3>Alta afinidad</h3>{(r.highCompatibility ?? []).map((x:string)=><span key={x}>{x}</span>)}</div>
          <div><h3>Afinidad complementaria</h3>{(r.mediumCompatibility ?? []).map((x:string)=><span key={x}>{x}</span>)}</div>
        </div>
      </section>
      <section className="pro-help">
        <div>
          <span className="eyebrow">ACOMPAÑAMIENTO PROFESIONAL</span>
          <h2>Un resultado puede orientarte. Una conversación profesional puede ayudarte a decidir.</h2>
          <p>Si quieres revisar tu perfil, dudas y opciones con un psicólogo, estamos para acompañarte.</p>
        </div>
        <a className="btn whatsapp large" href="https://wa.me/59170000000?text=Hola%2C%20realic%C3%A9%20mi%20test%20en%20MentesModernas%20y%20quiero%20orientaci%C3%B3n." target="_blank">💬 Hablar por WhatsApp</a>
      </section>
      <TestFeedback testCode={evaluation.test_versions?.code??'VOCATIONAL_PREMIUM'} evaluationId={evaluation.id}/>
    </main>
  )
}
