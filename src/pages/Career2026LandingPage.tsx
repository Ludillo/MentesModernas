import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {CAREER_CODE} from '../../shared/career2026'
import Career2026Promo from '../components/Career2026Promo'
import {testMeta} from '../lib/testMeta'
import {Methodology} from './GenericTestPage'
import {getTestCatalog,type TestCatalogItem} from '../services/catalogService'

export default function Career2026LandingPage(){
 const [offer,setOffer]=useState<TestCatalogItem|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 useEffect(()=>{getTestCatalog().then(items=>setOffer(items.find(x=>x.premium_code===CAREER_CODE)??null)).catch(()=>setError('No pudimos consultar la disponibilidad. Recarga la página para intentarlo otra vez.')).finally(()=>setLoading(false))},[])
 return <main className="page section"><Career2026Promo purchase/><section className="career2026-overview"><span className="eyebrow">ANTES DE ELEGIR UNA CARRERA</span><h1>Intereses, oportunidades y preparación para un mundo con IA.</h1><p>Un informe educativo para explorar opciones. No necesitas saber programar ni haber utilizado IA para responder: describe tu situación actual.</p><div className="product-grid"><article className="admin-card"><h2>01 · Tu perfil</h2><p>Seis áreas de interés y seis dimensiones de hábitos. Tus intereses se analizan por separado de tu experiencia tecnológica.</p></article><article className="admin-card"><h2>02 · Tus rutas</h2><p>Seis rutas para investigar, con formación posible, tareas que cambian con IA y aportes humanos relevantes.</p></article><article className="admin-card"><h2>03 · Tu plan</h2><p>Acciones para practicar durante 30 días y preguntas para contrastar costos, requisitos y oportunidades locales.</p></article></div><p>48 preguntas · aproximadamente 12–18 minutos · un informe guardado por acceso. Responde en una sesión; el avance parcial no se guarda.</p>{loading?<p role="status">Consultando precio…</p>:error?<p className="alert error" role="alert">{error}</p>:offer?<Link className="btn primary large" to={`/acceso/${CAREER_CODE}`}>Obtener mi test · {offer.price} {offer.currency==='BOB'?'Bs':offer.currency} →</Link>:<p role="status">Este test todavía no está disponible para compra.</p>}</section><Methodology meta={testMeta(CAREER_CODE)}/></main>
}
