import { useEffect,useState } from 'react'
import { Link,useNavigate,useParams } from 'react-router-dom'
import TestRunner from '../components/TestRunner'
import { getQuestions,submitFreeResult,submitPremiumResult } from '../services/testService'
import type { TestQuestion } from '../types/models'
import TestFeedback from '../components/TestFeedback'
import { recordTestCompletion } from '../services/feedbackService'
import { resultMeta } from '../lib/resultLabels'
import { testMeta } from '../lib/testMeta'

export default function GenericTestPage(){
 const {code=''}=useParams(); const [questions,setQuestions]=useState<TestQuestion[]>([]); const [error,setError]=useState(''); const [result,setResult]=useState<any[]>([]); const navigate=useNavigate()
 useEffect(()=>{getQuestions(code).then(setQuestions).catch(e=>setError(e.message))},[code])
 if(error)return <main className="page section"><div className="alert error">{error}</div><Link className="btn secondary" to="/tests">Volver</Link></main>
 const meta=testMeta(code)
 if(result.length)return <main className="page section result-page"><div className="page-hero compact"><span className="eyebrow">RESULTADO · {meta.shortTitle.toUpperCase()}</span><h1>{meta.title}</h1><h2>Tu dimensión principal: <span>{result[0].name}</span></h2><p>{result[0].description}</p><p className="result-disclaimer">{meta.notice??'Este resultado es orientativo: describe preferencias percibidas y no constituye un diagnóstico psicológico.'}</p></div><div className="areas-result-grid">{result.map(x=><article className="score-card" key={x.code}><div className="score-number">{x.percent}%</div><h2>{x.name}</h2><p>{x.description}</p><div className="score-bar"><i style={{width:`${x.percent}%`}}/></div></article>)}</div><section className="admin-card"><h2>Cómo aprovechar tu resultado principal</h2><ul>{resultMeta(result[0].code).recommendations.map((item:string)=><li key={item}>{item}</li>)}</ul></section>{meta.premiumCode&&<section className="upgrade-banner"><div><span className="eyebrow">PROFUNDIZA TU RESULTADO</span><h2>¿Quieres un análisis más completo?</h2><p>La versión avanzada incluye más preguntas, un perfil más detallado y conserva cada intento en tu cuenta.</p></div><Link className="btn primary large" to={`/acceso/${meta.premiumCode}`}>Probar versión avanzada →</Link></section>}<TestFeedback testCode={code}/></main>
 if(!questions.length)return <main className="page section"><div className="loading">Preparando evaluación…</div></main>
 const finish=async(answers:Record<string,number>)=>{const groups=new Map<string,{total:number,count:number}>();questions.forEach(q=>{const g=groups.get(q.dimension_code)||{total:0,count:0};g.total+=answers[q.id]||0;g.count++;groups.set(q.dimension_code,g)});const results=[...groups].map(([dimension,g])=>{const meta=resultMeta(dimension);return {code:dimension,name:meta.name,score:g.total,maxScore:g.count*4,percent:Math.round(g.total/(g.count*4)*100),description:meta.description,careers:[]}}).sort((a,b)=>b.percent-a.percent);recordTestCompletion(code).catch(()=>{});if(code.endsWith('_PREMIUM')){const saved=await submitPremiumResult({testCode:code,answers,results:results as any});navigate(`/resultado/${saved.evaluationId}`)}else{const saved=await submitFreeResult({testCode:code,answers});if(saved)navigate(`/resultado/${saved.evaluationId}`);else setResult(results)}}
 return <TestRunner title={meta.title} questions={questions} onFinish={finish}/>
}
