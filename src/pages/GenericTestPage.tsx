import { useEffect,useState } from 'react'
import { Link,useNavigate,useParams } from 'react-router-dom'
import TestRunner from '../components/TestRunner'
import { getQuestions,submitPremiumResult } from '../services/testService'
import type { TestQuestion } from '../types/models'
import TestFeedback from '../components/TestFeedback'
import { recordTestCompletion } from '../services/feedbackService'
import { resultMeta } from '../lib/resultLabels'

export default function GenericTestPage(){
 const {code=''}=useParams(); const [questions,setQuestions]=useState<TestQuestion[]>([]); const [error,setError]=useState(''); const [result,setResult]=useState<any[]>([]); const navigate=useNavigate()
 useEffect(()=>{getQuestions(code).then(setQuestions).catch(e=>setError(e.message))},[code])
 if(error)return <main className="page section"><div className="alert error">{error}</div><Link className="btn secondary" to="/tests">Volver</Link></main>
 if(result.length)return <main className="page section"><div className="page-hero compact"><span className="eyebrow">RESULTADO</span><h1>Tu perfil principal: {result[0].name}</h1><p>Este resultado orienta tu reflexión y no constituye un diagnóstico clínico.</p></div><div className="areas-result-grid">{result.map(x=><article className="score-card" key={x.code}><h2>{x.name}</h2><strong>{x.percent}%</strong><div className="score-bar"><i style={{width:`${x.percent}%`}}/></div></article>)}</div><TestFeedback testCode={code}/></main>
 if(!questions.length)return <main className="page section"><div className="loading">Preparando evaluación…</div></main>
 const finish=async(answers:Record<string,number>)=>{const groups=new Map<string,{total:number,count:number}>();questions.forEach(q=>{const g=groups.get(q.dimension_code)||{total:0,count:0};g.total+=answers[q.id]||0;g.count++;groups.set(q.dimension_code,g)});const results=[...groups].map(([dimension,g])=>{const meta=resultMeta(dimension);return {code:dimension,name:meta.name,score:g.total,maxScore:g.count*4,percent:Math.round(g.total/(g.count*4)*100),description:meta.description,careers:[]}}).sort((a,b)=>b.percent-a.percent);recordTestCompletion(code).catch(()=>{});if(code.endsWith('_PREMIUM')){const saved=await submitPremiumResult({testCode:code,answers,results:results as any});navigate(`/resultado/${saved.evaluationId}`)}else setResult(results)}
 return <TestRunner title={code.replaceAll('_',' ')} questions={questions} onFinish={finish}/>
}
