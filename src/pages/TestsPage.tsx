import { Link } from 'react-router-dom'

export default function TestsPage() {
  return (
    <main className="page section">
      <div className="page-hero compact">
        <span className="eyebrow">TESTS MENTESMODERNAS</span>
        <h1>Una respuesta puede abrir una nueva dirección.</h1>
        <p>Empieza gratis y profundiza solo si el resultado te resulta útil.</p>
      </div>

      <div className="product-grid">
        <article className="product-card">
          <div className="module-icon">🧭</div>
          <h2>Orientación Vocacional</h2>
          <p>Perfil basado en seis grandes áreas de interés ocupacional.</p>
          <ul><li>35 preguntas gratis</li><li>Resultado principal inmediato</li><li>Sin registro</li></ul>
          <Link className="btn primary" to="/tests/vocacional">Ver opciones</Link>
        </article>
        <article className="product-card coming">
          <div className="module-icon">📚</div><h2>Estilo de Aprendizaje</h2>
          <p>Recomendaciones para estudiar y aprender de una manera más compatible contigo.</p>
          <span className="badge">PRÓXIMAMENTE</span>
        </article>
        <article className="product-card coming">
          <div className="module-icon">💥</div><h2>Fortalezas Personales</h2>
          <p>Un mapa simple de creatividad, empatía, disciplina, liderazgo y otras fortalezas.</p>
          <span className="badge">PRÓXIMAMENTE</span>
        </article>
      </div>
    </main>
  )
}
