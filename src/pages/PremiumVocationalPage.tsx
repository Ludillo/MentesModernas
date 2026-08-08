import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { validatePayment } from '../services/paymentService'

export default function PremiumVocationalPage() {
  const [session, setSession] = useState<any>(null)
  const [coupon, setCoupon] = useState('')
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e,s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <main className="page section">
        <div className="purchase-card">
          <span className="eyebrow">PREMIUM</span>
          <h1>Primero identifica tu cuenta</h1>
          <p>Necesitamos autenticación para asociar el pago, conservar el derecho a realizar el test y guardar el resultado final.</p>
          <Link className="btn primary large" to="/ingresar">Ingresar</Link>
        </div>
      </main>
    )
  }

  const continuePayment = async () => {
    setChecking(true); setMessage('')
    try {
      const ok = await validatePayment('VOCATIONAL_PREMIUM', coupon)
      if (ok) navigate('/premium/vocacional/test')
      else setMessage('El pago todavía no fue confirmado.')
    } catch(e:any) { setMessage(e.message) }
    finally { setChecking(false) }
  }

  return (
    <main className="page section">
      <div className="payment-layout">
        <section className="payment-copy">
          <span className="eyebrow">PAGO DEL TEST</span>
          <h1>Perfil Vocacional Premium</h1>
          <p>El pago queda asociado a tu usuario. Si no finalizas el test, tu derecho continuará disponible hasta completarlo.</p>
          <label>Cupón (opcional)<input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="Ej.: COLEGIO2026" /></label>
        </section>
        <section className="qr-card">
          <div className="qr-placeholder">
            <div className="qr-grid">QR</div>
          </div>
          <strong>QR pendiente de integración</strong>
          <p>La generación y callback bancario se conectarán posteriormente.</p>
          <button className="btn primary full" disabled={checking} onClick={continuePayment}>
            {checking ? 'Validando...' : 'Ya realicé el pago · Continuar'}
          </button>
          {message && <div className="alert">{message}</div>}
        </section>
      </div>
    </main>
  )
}
