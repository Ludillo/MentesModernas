import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LogoHero from '../components/LogoHero'
import { loadContent } from '../services/contentService'

export default function HomePage() {
  const [content, setContent] = useState<any>({})

  useEffect(() => { loadContent().then(setContent).catch(() => {}) }, [])

  const hero = content.home_hero ?? {
    title: 'Descubre tu mente. Enciende tu futuro.',
    subtitle: 'Una experiencia vocacional más juvenil, visual y moderna para explorar intereses, fortalezas y decisiones con claridad.',
    cta: 'Empezar ahora'
  }
  const stats=content.site_stats??{completed_tests:13433,active_users:14533,effectiveness:83}
  const news=content.news?.articles??[]

  return (
    <main>
      <section className="home-hero neuro-home-hero">
        <div className="hero-copy">
          <span className="eyebrow">DESCUBRE · CONECTA · DECIDE</span>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <div className="hero-actions">
            <Link className="btn primary large" to="/tests">{hero.cta}</Link>
            <Link className="btn ghost large" to="/contacto">Solicitar orientación</Link>
          </div>
        </div>
        <LogoHero src={content.brand?.logo_url} />
      </section>

      <section className="impact-strip" aria-label="Indicadores de MentesModernas">
        <div><span className="impact-icon">▥</span><strong>+{Number(stats.completed_tests).toLocaleString('es-BO')}</strong><small>Tests completados</small></div>
        <div><span className="impact-icon">♧</span><strong>+{Number(stats.active_users).toLocaleString('es-BO')}</strong><small>Usuarios activos</small></div>
        <div><span className="impact-icon">◇</span><strong>{stats.effectiveness}%</strong><small>Efectividad reportada</small></div>
      </section>

      <section className="section section-intense">
        <div className="section-title">
          <span className="eyebrow">MÓDULOS DESTACADOS</span>
          <h2>Una plataforma para descubrir más que una carrera</h2>
          <p>Diseñada para jóvenes, padres y procesos de orientación modernos.</p>
        </div>
        <div className="module-grid">
          <article className="module-card featured intense-card">
            <div className="module-icon">🧭</div>
            <span className="badge live">DISPONIBLE</span>
            <h3>Orientación Vocacional</h3>
            <p>Explora intereses, áreas y posibilidades de carrera con una experiencia gratuita y otra premium mucho más detallada.</p>
            <Link to="/tests">Explorar →</Link>
          </article>
          <article className="module-card intense-card">
            <div className="module-icon">📚</div><span className="badge live">DISPONIBLE</span>
            <h3>Estilo de Aprendizaje</h3><p>Conoce cómo aprendes mejor y cómo mejorar tu rendimiento de estudio.</p>
            <Link to="/test/LEARNING_STYLE_FREE">Comenzar gratis →</Link>
          </article>
          <article className="module-card intense-card">
            <div className="module-icon">✦</div><span className="badge live">DISPONIBLE</span>
            <h3>Fortalezas Personales</h3><p>Identifica tus talentos, recursos personales y tu potencial para destacar.</p>
            <Link to="/test/PERSONAL_STRENGTHS_FREE">Comenzar gratis →</Link>
          </article>
        </div>
      </section>

      <section className="section news-section">
        <div className="section-title"><span className="eyebrow">MENTES AL DÍA</span><h2>Noticias para comprender una mente diversa</h2><p>Información cercana y responsable sobre neurodiversidad, aprendizaje y bienestar.</p></div>
        <div className="news-grid">{news.slice(0,3).map((item:any)=><article className="news-card" key={item.id}><span>{item.category}</span><h3>{item.title}</h3><p>{item.excerpt}</p><small>{item.source?`${item.source} · `:''}{item.read_time}</small>{item.url&&<a className="news-source-link" href={item.url} target="_blank" rel="noreferrer">{item.link_label??'Consultar fuente'} ↗</a>}</article>)}</div>
        <div className="news-more"><Link className="btn secondary" to="/noticias">Ver todas las noticias</Link></div>
      </section>
    </main>
  )
}
