import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function PremiumVocationalPage() {
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <main className="page section">
        <div className="purchase-card">
          <span className="eyebrow">PREMIUM</span>

          <h1>Primero identifica tu cuenta</h1>

          <p>
            Necesitamos autenticación para asociar tu evaluación
            y guardar el resultado final.
          </p>

          <Link
            className="btn primary large"
            to="/ingresar"
          >
            Ingresar
          </Link>
        </div>
      </main>
    )
  }

  const continuePremium = async () => {
    setChecking(true)
    setMessage('')

    try {
      // ==========================================================
      // TEMPORAL - PREMIUM ABIERTO PARA PRUEBAS
      // No valida pago ni cupón.
      //
      // Cuando habilitemos nuevamente pago/cupon:
      // eliminar este bypass y volver a validatePayment(...)
      // ==========================================================

      navigate('/premium/vocacional/test')

    } catch (e: any) {
      setMessage(
        e?.message ??
        'No se pudo ingresar al test Premium.'
      )
    } finally {
      setChecking(false)
    }
  }

  return (
    <main className="page section">
      <div className="payment-layout">

        <section className="payment-copy">
          <span className="eyebrow">
            PREMIUM
          </span>

          <h1>
            Perfil Vocacional Premium
          </h1>

          <p>
            La versión Premium está habilitada temporalmente
            para pruebas y evaluación del test completo.
          </p>

          <p>
            Actualmente no es necesario realizar pago ni ingresar
            un código de cupón.
          </p>
        </section>

        <section className="qr-card">

          <div className="qr-placeholder">
            <div className="qr-grid">
              PREMIUM
            </div>
          </div>

          <strong>
            Acceso Premium habilitado
          </strong>

          <p>
            El pago mediante QR y la validación de cupones
            serán habilitados posteriormente.
          </p>

          <button
            type="button"
            className="btn primary full"
            disabled={checking}
            onClick={continuePremium}
          >
            {checking
              ? 'Ingresando...'
              : 'Probar Test Premium'}
          </button>

          {message && (
            <div className="alert">
              {message}
            </div>
          )}

        </section>

      </div>
    </main>
  )
}