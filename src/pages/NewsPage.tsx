import { useEffect,useState } from 'react'
import { loadContent } from '../services/contentService'

export default function NewsPage(){
  const [articles,setArticles]=useState<any[]>([])
  useEffect(()=>{loadContent().then(c=>setArticles(c.news?.articles??[])).catch(()=>{})},[])
  return <main className="page section"><div className="page-hero compact"><span className="eyebrow">MENTES AL DÍA</span><h1>Neurodiversidad, aprendizaje y bienestar.</h1><p>Contenido educativo para comprender distintas formas de pensar, sentir, aprender y relacionarse. No sustituye una valoración profesional.</p></div><div className="news-grid news-grid-all">{articles.map(x=><article className="news-card" key={x.id}><span>{x.category}</span><h2>{x.title}</h2><p>{x.excerpt}</p><small>{x.read_time}</small></article>)}</div></main>
}
