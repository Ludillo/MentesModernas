import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { submitPaymentReceipt, validatePayment } from '../services/paymentService'

export default function PremiumVocationalPage() {
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { code = 'VOCATIONAL_PREMIUM' } = useParams()
  const [coupon,setCoupon]=useState('')
  const [receipt,setReceipt]=useState<File|null>(null);const [payerName,setPayerName]=useState('');const [reference,setReference]=useState('')

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
      await validatePayment(code,coupon)
      navigate(`/test/${code}`)

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
            Evaluación avanzada
          </h1>

          <p>
            Accede con un cupón válido o envía tu comprobante de pago QR para revisión.
          </p>

          <p>
            El acceso queda asociado a tu cuenta y a esta evaluación específica.
          </p>
        </section>

        <section className="qr-card">

          <div className="qr-placeholder">
            <div className="qr-grid">
              QR
            </div>
          </div>

          <strong>
            Acceso seguro
          </strong>

          <p>
            Ingresa un cupón. Para pagos QR, envía el comprobante mediante el formulario de contacto indicando tu correo y el test; el administrador podrá aprobarlo.
          </p>

          <label>Cupón de acceso<input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="EJEMPLO100" /></label>

          <button
            type="button"
            className="btn primary full"
            disabled={checking || !coupon.trim()}
            onClick={continuePremium}
          >
            {checking
              ? 'Ingresando...'
              : 'Validar cupón y acceder'}
          </button>

          {message && (
            <div className="alert">
              {message}
            </div>
          )}
          <div className="separator"><span>o paga por QR</span></div>
          <label>Nombre del pagador<input value={payerName} onChange={e=>setPayerName(e.target.value)}/></label>
          <label>Referencia bancaria<input value={reference} onChange={e=>setReference(e.target.value)}/></label>
          <label>Comprobante (JPG, PNG o PDF)<input type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>setReceipt(e.target.files?.[0]||null)}/></label>
          <button className="btn secondary full" disabled={!receipt||checking} onClick={async()=>{if(!receipt)return;setChecking(true);try{await submitPaymentReceipt(code,receipt,payerName,reference);setMessage('Comprobante recibido. Te avisaremos cuando el administrador apruebe el acceso.')}catch(e:any){setMessage(e.message)}finally{setChecking(false)}}}>Enviar comprobante</button>

        </section>

      </div>
    </main>
  )
}
