import { Link } from 'react-router-dom'

export default function VocationalLandingPage() {
  return (
    <main className="page section">
      <div className="page-hero">
        <span className="eyebrow">ORIENTACIÓN VOCACIONAL</span>
        <h1>Descubre hacia dónde apuntan tus intereses.</h1>
        <p>Dos niveles: una exploración gratuita y una evaluación premium más profunda.</p>
      </div>

      <div className="pricing-grid">
        <article className="price-card">
          <span className="plan-tag">GRATIS</span>
          <h2>Exploración Básica</h2>
          <div className="price">Bs 0</div>
          <ul>
            <li>35 preguntas</li>
            <li>Sin autenticación</li>
            <li>Área predominante</li>
            <li>Breve explicación</li>
            <li>Familias generales de carreras</li>
          </ul>
          <Link className="btn primary" to="/tests/vocacional/gratis">Comenzar gratis</Link>
        </article>

        <article className="price-card premium">
          <span className="plan-tag">PREMIUM</span>
          <h2>Perfil Vocacional Completo</h2>
          <div className="price">Precio configurable</div>
          <ul>
            <li>72 preguntas</li>
            <li>Autenticación requerida</li>
            <li>Perfil principal + secundario</li>
            <li>Precisión ampliada</li>
            <li>Carreras y compatibilidad</li>
            <li>Resultado guardado</li>
            <li>Acceso posterior desde Mi Cuenta</li>
          </ul>
          <Link className="btn primary" to="/premium/vocacional">Quiero el perfil completo</Link>
        </article>
      </div>
      <div className="method-note">
        <strong>Metodología:</strong> instrumento orientativo propio inspirado en el modelo RIASEC de intereses vocacionales. No reemplaza una evaluación psicológica profesional.
      </div>
    </main>
  )
}
