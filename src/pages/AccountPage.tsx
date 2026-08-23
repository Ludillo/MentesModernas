import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { signOut } from '../services/authService'

export default function AccountPage() {
  const [session, setSession] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [entitlements, setEntitlements] = useState<any[]>([])
  const [catalog, setCatalog] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({data}) => {
      setSession(data.session)
      if (data.session) {
        const [e, t, c] = await Promise.all([
          supabase.from('evaluations').select('id,completed_at,result_json,test_types(name)').order('completed_at', {ascending:false}),
          supabase.from('test_entitlements').select('id,status,created_at,test_products(name,code)').eq('status','AVAILABLE'),
          supabase.rpc('get_test_catalog')
        ])
        setEvaluations(e.data ?? [])
        setEntitlements(t.data ?? [])
        setCatalog(c.data ?? [])
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
      <h2>Mis resultados</h2>
      <div className="history-list">
        {evaluations.length ? evaluations.map((x:any)=><Link key={x.id} to={`/resultado/${x.id}`}><b>{x.test_types?.name}</b><span>{new Date(x.completed_at).toLocaleDateString()}</span></Link>) : <p>Aún no tienes evaluaciones Premium finalizadas.</p>}
      </div>
    </main>
  )
}
