import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getTestCatalog } from '../services/catalogService'

export default function TestsPage() {
  const navigate=useNavigate()
  const [items,setItems]=useState<any[]>([])
  useEffect(()=>{getTestCatalog().then(setItems).catch(()=>{})},[])
  const fallback=[
    {type_code:'VOCATIONAL',name:'Orientación Vocacional',description:'Explora intereses ocupacionales mediante seis áreas RIASEC.',icon:'🧭',free_code:'VOCATIONAL_FREE',free_questions:35,premium_code:'VOCATIONAL_PREMIUM',premium_questions:72,price:50,currency:'BOB'},
    {type_code:'LEARNING_STYLE',name:'Estilo de Aprendizaje',description:'Descubre cómo asimilas y organizas mejor la información.',icon:'📚',free_code:'LEARNING_STYLE_FREE',free_questions:12,premium_code:'LEARNING_STYLE_PREMIUM',premium_questions:24,price:40,currency:'BOB'},
    {type_code:'PERSONAL_STRENGTHS',name:'Fortalezas Personales',description:'Reconoce tus recursos personales más consistentes.',icon:'💪',free_code:'PERSONAL_STRENGTHS_FREE',free_questions:12,premium_code:'PERSONAL_STRENGTHS_PREMIUM',premium_questions:24,price:40,currency:'BOB'}]
  const catalog=items.length?items:fallback
  return (
    <main className="page section">
      <div className="page-hero compact">
        <span className="eyebrow">TESTS MENTESMODERNAS</span>
        <h1>Una respuesta puede abrir una nueva dirección.</h1>
        <p>Empieza gratis y profundiza solo si el resultado te resulta útil.</p>
      </div>

      <div className="product-grid">{catalog.map(x=><article className="product-card clickable-card" role="link" tabIndex={0} aria-label={`Comenzar gratis: ${x.name}`} onClick={()=>navigate(`/test/${x.free_code}`)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();navigate(`/test/${x.free_code}`)}}} key={x.type_code}>
        <div className="module-icon">{x.icon}</div><h2>{x.name}</h2><p>{x.description}</p>
        <ul><li>{x.free_questions} preguntas gratis</li><li>{x.premium_questions} preguntas avanzadas</li><li>Resultado inmediato</li></ul>
        <div className="card-actions"><Link onClick={e=>e.stopPropagation()} className="btn secondary" to={`/test/${x.free_code}`}>Comenzar gratis</Link><Link onClick={e=>e.stopPropagation()} className="btn primary" to={`/acceso/${x.premium_code}`}>Avanzado · {x.price} {x.currency}</Link></div>
      </article>)}</div>
    </main>
  )
}
