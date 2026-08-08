import fallbackLogo from '../assets/mentesmodernas-logo.png'
import brainHero from '../assets/brain-hero.png'

export default function LogoHero({ src }: { src?: string }) {
  return (
    <div className="logo-stage" aria-label="MentesModernas experiencia visual">
      <div className="hero-visual-card">
        <img src={brainHero} alt="Cerebro futurista con conexiones neuronales" className="hero-visual-bg" />
        <div className="hero-visual-overlay" />
        <div className="hero-brand-lockup">
          <img src={src || fallbackLogo} alt="MentesModernas" className="hero-brand-logo" />
          <div className="hero-brand-copy">
            <strong>Descubre · Conecta · Decide</strong>
            <span>Una experiencia visual moderna para jóvenes y familias.</span>
          </div>
        </div>
      </div>
      <div className="floating-pill pill-a">⚡ Neuroexploración</div>
      <div className="floating-pill pill-b">🧠 Potencial activo</div>
      <div className="floating-pill pill-c">🚀 Orientación premium</div>
    </div>
  )
}
