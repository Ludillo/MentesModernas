import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import fallbackLogo from '../assets/mentesmodernas-logo.png'
import { trackPage } from '../services/analyticsService'
import { loadContent } from '../services/contentService'
import { activeSocialLinks, SocialSettings, whatsappUrl } from '../lib/social'

export default function Layout() {
  const location = useLocation()
  const [logo, setLogo] = useState(fallbackLogo)
  const [menuOpen, setMenuOpen] = useState(false)
  const [social, setSocial] = useState<SocialSettings>({})

  useEffect(() => {
    trackPage(location.pathname)
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    loadContent()
      .then((c: any) => {
        if (c.brand?.logo_url) {
          setLogo(c.brand.logo_url)
        }
        setSocial(c.social_links ?? {})
      })
      .catch(() => {})
  }, [])

  return (
    <div className="site-shell">
      <div className="neuro-background">
        <span className="neuro-blob blob-a" />
        <span className="neuro-blob blob-b" />
        <span className="neuro-blob blob-c" />
        <span className="neuro-grid" />
      </div>

      <header className="topbar">
        <Link
          to="/"
          className="brand"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src={logo}
            alt="MentesModernas"
          />
        </Link>

        <button
          type="button"
          className={`mobile-menu-button ${menuOpen ? 'active' : ''}`}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen(v => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="main-navigation"
          className={menuOpen ? 'main-nav open' : 'main-nav'}
        >
          <Link to="/tests">Tests</Link>
          <Link to="/contacto">Contáctate con nosotros</Link>
          <Link to="/cuenta">Mi cuenta</Link>
        </nav>
      </header>

      <Outlet />

      {whatsappUrl(social) && <a className="floating-whatsapp" href={whatsappUrl(social)} target="_blank" rel="noreferrer" aria-label="Conversar por WhatsApp"><span>WhatsApp</span><strong>Conversemos</strong></a>}
      <footer className="footer">
        <div className="footer-brand"><strong>MentesModernas</strong><span>Explora tus intereses, fortalezas y decisiones.</span></div>
        <div className="social-links">{activeSocialLinks(social).map(x=><a key={x.key} href={x.url} target="_blank" rel="noreferrer">{x.label}</a>)}</div>
        <span className="footer-legal"><Link to="/privacidad">Privacidad</Link><Link to="/terminos">Términos</Link></span>
        <span className="footer-credit">Hecho por <strong>ARPALSOFT</strong></span>
      </footer>
    </div>
  )
}
