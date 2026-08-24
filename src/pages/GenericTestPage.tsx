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
 if(result.length)return <main className="page section result-page"><div className="page-hero compact"><span className="eyebrow">TU RESULTADO</span><h1>Tu dimensión principal:<br/><span>{result[0].name}</span></h1><p>{result[0].description}</p><p className="result-disclaimer">Este resultado es orientativo: describe preferencias percibidas y no constituye un diagnóstico psicológico.</p></div><div className="areas-result-grid">{result.map(x=><article className="score-card" key={x.code}><div className="score-number">{x.percent}%</div><h2>{x.name}</h2><p>{x.description}</p><div className="score-bar"><i style={{width:`${x.percent}%`}}/></div></article>)}</div><section className="admin-card"><h2>Cómo aprovechar tu resultado principal</h2><ul>{resultMeta(result[0].code).recommendations.map((item:string)=><li key={item}>{item}</li>)}</ul></section><TestFeedback testCode={code}/></main>
 if(!questions.length)return <main className="page section"><div className="loading">Preparando evaluación…</div></main>
 const finish=async(answers:Record<string,number>)=>{const groups=new Map<string,{total:number,count:number}>();questions.forEach(q=>{const g=groups.get(q.dimension_code)||{total:0,count:0};g.total+=answers[q.id]||0;g.count++;groups.set(q.dimension_code,g)});const results=[...groups].map(([dimension,g])=>{const meta=resultMeta(dimension);return {code:dimension,name:meta.name,score:g.total,maxScore:g.count*4,percent:Math.round(g.total/(g.count*4)*100),description:meta.description,careers:[]}}).sort((a,b)=>b.percent-a.percent);recordTestCompletion(code).catch(()=>{});if(code.endsWith('_PREMIUM')){const saved=await submitPremiumResult({testCode:code,answers,results:results as any});navigate(`/resultado/${saved.evaluationId}`)}else setResult(results)}
 const titles:Record<string,string>={LEARNING_STYLE_FREE:'Estilo de Aprendizaje Gratuito',LEARNING_STYLE_PREMIUM:'Estilo de Aprendizaje Premium',PERSONAL_STRENGTHS_FREE:'Fortalezas Personales Gratuito',PERSONAL_STRENGTHS_PREMIUM:'Fortalezas Personales Premium'}
 return <TestRunner title={titles[code]??'Evaluación personal'} questions={questions} onFinish={finish}/>
}
