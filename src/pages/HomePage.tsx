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

  return (
    <main>
      <section className="home-hero neuro-home-hero">
        <div className="hero-copy">
          <span className="eyebrow">EXPERIENCIA INMERSIVA · MENTESMODERNAS</span>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <div className="hero-actions">
            <Link className="btn primary large" to="/tests">{hero.cta}</Link>
            <Link className="btn ghost large" to="/contacto">Hablar con un psicólogo</Link>
          </div>
          <div className="hero-metrics">
            <span><b>35 preguntas</b><small>Ruta gratuita inicial</small></span>
            <span><b>72+ preguntas</b><small>Versión premium avanzada</small></span>
            <span><b>Resultados claros</b><small>Áreas, afinidades y apoyo profesional</small></span>
          </div>
        </div>
        <LogoHero src={content.brand?.logo_url} />
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
            <Link to="/tests/vocacional">Explorar →</Link>
          </article>
          <article className="module-card intense-card">
            <div className="module-icon">🧠</div><span className="badge">PRÓXIMAMENTE</span>
            <h3>Estilo de Aprendizaje</h3><p>Conoce cómo aprendes mejor y cómo mejorar tu rendimiento de estudio.</p>
          </article>
          <article className="module-card intense-card">
            <div className="module-icon">⚡</div><span className="badge">PRÓXIMAMENTE</span>
            <h3>Fortalezas Personales</h3><p>Identifica tus talentos, recursos personales y tu potencial para destacar.</p>
          </article>
        </div>
      </section>
    </main>
  )
}
