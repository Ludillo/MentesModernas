import { useEffect,useState } from 'react'
import { loadContent } from '../services/contentService'

export default function NewsPage(){
  const [articles,setArticles]=useState<any[]>([])
  useEffect(()=>{loadContent().then(c=>setArticles(c.news?.articles??[])).catch(()=>{})},[])
  return <main className="page section"><div className="page-hero compact"><span className="eyebrow">MENTES AL DÍA</span><h1>Crecer, aprender, relacionarse y conocerse.</h1><p>Contenidos educativos sobre adolescencia, decisiones, vínculos, bienestar, aprendizaje y neurodiversidad, con fuentes responsables. La información no sustituye una valoración profesional.</p></div><div className="news-grid news-grid-all">{articles.map(x=><article className="news-card" key={x.id}><span>{x.category}</span><h2>{x.title}</h2><p>{x.excerpt}</p><small>{x.source?`${x.source} · `:''}{x.read_time}</small>{x.url&&<a className="news-source-link" href={x.url} target="_blank" rel="noreferrer">{x.link_label??'Consultar fuente'} ↗</a>}</article>)}</div></main>
}
