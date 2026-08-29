import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { generatePaymentQr, hasPremiumAccess, QrPayment, validatePayment, verifyPaymentQr } from '../services/paymentService'

export default function PremiumVocationalPage() {
  const [session, setSession] = useState<any>(null)
  const [checking, setChecking] = useState(false)
  const [qrBusy,setQrBusy]=useState(false)
  const [message, setMessage] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [qrPayment,setQrPayment]=useState<QrPayment|null>(null)
  const [accessAvailable,setAccessAvailable]=useState(false)
  const [accessChecking,setAccessChecking]=useState(false)
  const navigate = useNavigate()
  const { code = 'VOCATIONAL_PREMIUM' } = useParams()
  const [coupon,setCoupon]=useState('')
  const qrImageSrc=qrPayment?.qrImage?(qrPayment.qrImage.startsWith('data:')?qrPayment.qrImage:`data:image/png;base64,${qrPayment.qrImage}`):''

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))

    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(()=>{
    if(!session)return
    setAccessChecking(true)
    hasPremiumAccess(code).then(setAccessAvailable).catch(()=>setAccessAvailable(false)).finally(()=>setAccessChecking(false))
  },[session?.user?.id,code])

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

          {accessChecking?<div className="premium-access-check"><div className="loading">Comprobando tu acceso…</div></div>:accessAvailable?<div className="premium-access-ready"><span className="premium-access-ready-icon">✓</span><span className="eyebrow">ACCESO CONFIRMADO</span><h2>Tu test avanzado está habilitado</h2><p>Tu pago, cupón o autorización ya fue validado. Puedes continuar cuando estés listo.</p><button className="btn primary large full" onClick={()=>navigate(`/test/${code}`)}>Continuar al test avanzado →</button></div>:<>

          <div className={`qr-placeholder${qrPayment?' has-qr':''}`}>
            {qrPayment?.qrImage
              ? <img className="generated-payment-qr" src={qrImageSrc} alt={`QR de pago ${qrPayment.transactionId}`}/>
              : <div className="qr-callout" aria-hidden="true"><span className="qr-callout-icon">▦</span><strong>Haz clic abajo para generar tu QR</strong><small>Se creará al instante con el monto exacto de este test.</small><span className="qr-callout-arrow">↓</span></div>}
          </div>
          {!qrPayment?<button className="btn primary full" disabled={qrBusy} onClick={async()=>{setQrBusy(true);setPaymentError('');try{setQrPayment(await generatePaymentQr(code))}catch(e:any){setPaymentError(e.message)}finally{setQrBusy(false)}}}>{qrBusy?'Generando QR con ARPALSOFT…':'Solicitar QR de cobro'}</button>:<div className="qr-payment-status"><h2>{qrPayment.amount} {qrPayment.currency}</h2><p>{qrPayment.productName}</p><small>Solicitud {qrPayment.transactionId} · válida hasta {qrPayment.dueDate}</small><a className="btn secondary full qr-download" href={qrImageSrc} download={`QR-MentesModernas-${qrPayment.transactionId}.png`}>Descargar QR</a><button className="btn primary full" disabled={qrBusy} onClick={async()=>{setQrBusy(true);setPaymentError('');try{const result=await verifyPaymentQr(qrPayment.paymentId);if(result.paid)navigate(`/test/${code}`);else setPaymentError(result.message||'El pago aún no fue confirmado.')}catch(e:any){setPaymentError(e.message)}finally{setQrBusy(false)}}}>{qrBusy?'Verificando con Banco Económico…':'Ya realicé el pago · Verificar'}</button><button className="btn ghost full" disabled={qrBusy} onClick={()=>{setQrPayment(null);setPaymentError('')}}>Generar otra solicitud</button></div>}
          {paymentError && <div className="alert error" role="alert">{paymentError}</div>}

          <div className="separator"><span>¿Tienes un cupón?</span></div>
          <label>Cupón de acceso<input value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} placeholder="INGRESA TU CUPÓN" /></label>
          <button type="button" className="btn secondary full" disabled={checking || !coupon.trim()} onClick={continuePremium}>{checking?'Validando cupón…':'Habilitar acceso con cupón'}</button>
          {message && <div className="alert">{message}</div>}

          </>}

        </section>

      </div>
    </main>
  )
}
