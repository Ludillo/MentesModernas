import {useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {getTestCatalog,type TestCatalogItem} from '../services/catalogService'
import {CAREER_CODE} from '../../shared/career2026'

export default function Career2026Promo({purchase=false}:{purchase?:boolean}){
 const [offer,setOffer]=useState<TestCatalogItem|null>(null)
 useEffect(()=>{getTestCatalog().then(items=>setOffer(items.find(x=>x.premium_code===CAREER_CODE)??null)).catch(()=>{})},[])
 return <section className="career2026-promo" aria-labelledby="career2026-title"><div><span className="career2026-badge">NUEVO · EDICIÓN 2026</span><h2 id="career2026-title">La IA cambia el trabajo.<br/><em>Descubre tu próximo paso.</em></h2><p>Test vocacional: carreras que sobrevivirán a la IA. Explora tus intereses y las habilidades humanas y tecnológicas que puedes desarrollar.</p><div className="career2026-facts"><span>48 preguntas</span><span>Rutas técnicas y universitarias</span><span>Plan de acción</span></div><Link className="btn primary large" to={purchase&&offer?`/acceso/${CAREER_CODE}`:"/tests/vocacional-ia-2026"}>Descubrir mi ruta {offer?`· ${offer.price} ${offer.currency==='BOB'?'Bs':offer.currency}`:''} →</Link><small>Ninguna carrera está garantizada. Orientación con evidencia de 2025–2026.</small></div><div className="career2026-art" aria-hidden="true"><span>2026</span><b>TU VOCACIÓN<br/>+<br/>NUEVAS HABILIDADES</b><i>PERSONAS + TECNOLOGÍA</i></div></section>
}
