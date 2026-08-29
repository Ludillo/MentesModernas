import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { generatePaymentQr, QrPayment, validatePayment, verifyPaymentQr } from '../services/paymentService'

export default function PremiumVocationalPage() {
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [qrPayment,setQrPayment]=useState<QrPayment|null>(null)
  const navigate = useNavigate()
  const { code = 'VOCATIONAL_PREMIUM' } = useParams()
  const [coupon,setCoupon]=useState('')

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
            Accede con un cupón válido de un uso o solicita un QR de cobro por el monto configurado para este test.
          </p>

          <p>
            El acceso queda asociado a tu cuenta y a esta evaluación específica.
          </p>
        </section>

        <section className="qr-card">

          <div className="qr-placeholder">{qrPayment?.qrImage?<img className="generated-payment-qr" src={qrPayment.qrImage.startsWith('data:')?qrPayment.qrImage:`data:image/png;base64,${qrPayment.qrImage}`} alt={`QR de pago ${qrPayment.transactionId}`}/>:<div className="qr-grid">QR</div>}</div>

          <strong>
            Acceso seguro
          </strong>

          <p>
            El cupón válido habilita el acceso inmediatamente. El pago QR solamente lo habilita cuando Banco Económico lo confirma mediante la API de ARPALSOFT.
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
          {!qrPayment?<button className="btn secondary full" disabled={checking} onClick={async()=>{setChecking(true);setPaymentError('');try{setQrPayment(await generatePaymentQr(code))}catch(e:any){setPaymentError(e.message)}finally{setChecking(false)}}}>{checking?'Generando QR…':'Solicitar QR de cobro'}</button>:<div className="qr-payment-status"><h2>{qrPayment.amount} {qrPayment.currency}</h2><p>{qrPayment.productName}</p><small>Solicitud {qrPayment.transactionId} · válida hasta {qrPayment.dueDate}</small><button className="btn primary full" disabled={checking} onClick={async()=>{setChecking(true);setPaymentError('');try{const result=await verifyPaymentQr(qrPayment.paymentId);if(result.paid)navigate(`/test/${code}`);else setPaymentError(result.message||'El pago aún no fue confirmado.')}catch(e:any){setPaymentError(e.message)}finally{setChecking(false)}}}>{checking?'Verificando con el banco…':'Ya realicé el pago · Verificar'}</button><button className="btn ghost full" disabled={checking} onClick={()=>{setQrPayment(null);setPaymentError('')}}>Generar otra solicitud</button></div>}
          {paymentError && <div className="alert error" role="alert">{paymentError}</div>}

        </section>

      </div>
    </main>
  )
}
