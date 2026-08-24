import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { signOut } from '../services/authService'

export default function AccountPage() {
  const [session, setSession] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [entitlements, setEntitlements] = useState<any[]>([])
  const [catalog, setCatalog] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function deleteEvaluation(id: string) {
    if (!window.confirm('¿Seguro que quieres borrar este resultado? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    setDeleteError('')
    const {error} = await supabase.from('evaluations').delete().eq('id', id)
    if (error) setDeleteError('No pudimos borrar el resultado. Inténtalo nuevamente.')
    else setEvaluations(current => current.filter(item => item.id !== id))
    setDeletingId(null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({data}) => {
      setSession(data.session)
      if (data.session) {
        const [e, t, c, p] = await Promise.all([
          supabase.from('evaluations').select('id,completed_at,result_json,test_types(name),test_versions(code,access_level)').order('completed_at', {ascending:false}),
          supabase.from('test_entitlements').select('id,status,created_at,test_products(name,code)').eq('status','AVAILABLE'),
          supabase.rpc('get_test_catalog'),
          supabase.from('payments').select('id,status,created_at,amount,currency,test_products(name,code)').order('created_at',{ascending:false})
        ])
        setEvaluations(e.data ?? [])
        setEntitlements(t.data ?? [])
        setCatalog(c.data ?? [])
        setPayments(p.data ?? [])
      }
    })
  }, [])

  if (!session) return <main className="page section"><div className="purchase-card"><h1>Mi cuenta</h1><p>Ingresa para consultar tus resultados y tests disponibles.</p><Link className="btn primary" to="/ingresar">Ingresar</Link></div></main>

  return (
    <main className="page section">
      <div className="account-head">
        <div><span className="eyebrow">MI CUENTA</span><h1>{session.user.user_metadata?.full_name ?? session.user.email}</h1></div>
        <button className="btn secondary" onClick={async()=>{await signOut(); location.reload()}}>Cerrar sesión</button>
      </div>
      {payments.length > 0 && <section className="account-payments-section">
        <h2>Estado de mis pagos</h2>
        <p className="section-lead">Aquí puedes comprobar si tu comprobante continúa en revisión o si el acceso ya fue habilitado.</p>
        <div className="payment-status-list">{payments.map((payment:any)=><article className="payment-status-card" key={payment.id}>
          <div><span className={`payment-status status-${String(payment.status).toLowerCase()}`}>{payment.status==='PENDING'?'En revisión':payment.status==='PAID'?'Aprobado':payment.status==='FAILED'?'Rechazado':'Cancelado'}</span><h3>{payment.test_products?.name??'Evaluación avanzada'}</h3><small>Enviado el {new Date(payment.created_at).toLocaleString('es-BO')} · {payment.amount} {payment.currency}</small></div>
          {payment.status==='PENDING'&&<p>Recibimos tu comprobante. Te informaremos en esta cuenta cuando termine la revisión.</p>}
          {payment.status==='PAID'&&<p>Tu pago fue aprobado. El acceso avanzado ya está disponible más abajo.</p>}
          {payment.status==='FAILED'&&<p>El comprobante no pudo ser validado. Puedes enviar uno nuevo o contactarnos.</p>}
        </article>)}</div>
      </section>}
      <section className="account-history-section">
        <h2>Mi historial de resultados</h2>
        <p className="section-lead">Consulta nuevamente los informes de los tests que ya completaste.</p>
        {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
        <div className="history-list">
          {evaluations.length ? evaluations.map((x:any)=><div className="history-item" key={x.id}>
            <Link to={`/resultado/${x.id}`}><b>{x.test_types?.name} · {x.test_versions?.access_level==='FREE'?'Gratuito':'Avanzado'}</b><span>{new Date(x.completed_at).toLocaleString('es-BO')}</span></Link>
            <button className="history-delete" type="button" disabled={deletingId===x.id} onClick={()=>deleteEvaluation(x.id)}>{deletingId===x.id?'Borrando…':'Borrar'}</button>
          </div>) : <p>Aún no tienes evaluaciones finalizadas. Cada intento gratuito o avanzado aparecerá aquí.</p>}
        </div>
      </section>
      <section className="account-tests-section">
      <h2>Tests disponibles</h2>
      <p className="section-lead">Elige el test que deseas realizar. Todos tienen una versión gratuita y otra avanzada.</p>
      <div className="account-test-grid">
        {catalog.map((x:any)=>{
          const available=entitlements.some((e:any)=>e.test_products?.code===x.premium_code)
          return <article className="account-test-card" key={x.type_code}>
            <div className="account-test-icon">{x.icon}</div>
            <div><span className="plan-tag">{available?'ACCESO AVANZADO DISPONIBLE':'ELIGE TU MODALIDAD'}</span><h3>{x.name}</h3><p>{x.description}</p></div>
            <div className="account-test-actions">
              <Link className="btn secondary" to={`/test/${x.free_code}`}>Gratis · {x.free_questions} preguntas</Link>
              <Link className="btn primary" to={available?`/test/${x.premium_code}`:`/acceso/${x.premium_code}`}>{available?'Iniciar avanzado':`Avanzado · ${x.price} ${x.currency}`}</Link>
            </div>
          </article>
        })}
      </div>
      </section>
    </main>
  )
}
