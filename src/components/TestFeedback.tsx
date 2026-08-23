import { useState } from 'react'
import { submitTestFeedback } from '../services/feedbackService'

export default function TestFeedback({testCode,evaluationId}:{testCode:string;evaluationId?:string}){
  const [helpful,setHelpful]=useState<boolean|null>(null)
  const [clarity,setClarity]=useState(0)
  const [status,setStatus]=useState('')
  const already=localStorage.getItem(`mm_feedback_${testCode}`)==='1'
  if(already || status==='ok')return <section className="feedback-card feedback-thanks"><span>✓</span><div><h2>Gracias por ayudarnos a mejorar</h2><p>Tu respuesta fue registrada de forma anónima.</p></div></section>
  const send=async()=>{
    if(helpful===null||!clarity)return
    setStatus('sending')
    try{await submitTestFeedback(testCode,helpful,clarity,evaluationId);localStorage.setItem(`mm_feedback_${testCode}`,'1');setStatus('ok')}catch{setStatus('error')}
  }
  return <section className="feedback-card">
    <span className="eyebrow">ENCUESTA DE EFECTIVIDAD · 20 SEGUNDOS</span>
    <h2>¿Este test te ayudó a conocerte o decidir mejor?</h2>
    <div className="feedback-options"><button className={helpful===true?'selected':''} onClick={()=>setHelpful(true)}>Sí, me ayudó</button><button className={helpful===false?'selected':''} onClick={()=>setHelpful(false)}>Todavía no</button></div>
    <h3>¿Qué tan claro te resultó?</h3>
    <div className="clarity-scale">{[1,2,3,4,5].map(n=><button key={n} className={clarity===n?'selected':''} onClick={()=>setClarity(n)} aria-label={`${n} de 5`}>{n}<small>{n===1?'Poco claro':n===5?'Muy claro':''}</small></button>)}</div>
    <button className="btn primary" disabled={helpful===null||!clarity||status==='sending'} onClick={send}>{status==='sending'?'Enviando…':'Enviar respuesta'}</button>
    {status==='error'&&<div className="alert error">No pudimos registrar la respuesta. Inténtalo nuevamente.</div>}
  </section>
}
