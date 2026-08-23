import { Link, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import fallbackLogo from '../assets/mentesmodernas-logo.png'
import { trackPage } from '../services/analyticsService'
import { loadContent } from '../services/contentService'

export default function Layout() {
  const location = useLocation()
  const [logo, setLogo] = useState(fallbackLogo)
  const [menuOpen, setMenuOpen] = useState(false)

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

      <footer className="footer">
        <strong>MentesModernas</strong>
        <span>
          Explora tus intereses, fortalezas y decisiones con una experiencia inmersiva.
        </span>
        <span className="footer-credit">Hecho por <strong>ARPALSOFT</strong></span>
      </footer>
    </div>
  )
}
