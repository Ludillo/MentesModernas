import { useEffect, useState } from 'react'
import { adminApi, clearAdminSession, getAdminSession, uploadLogo } from '../services/adminService'
import { useNavigate } from 'react-router-dom'

type Tab='overview'|'content'|'payments'|'contacts'|'visits'|'coupons'|'security'

export default function AdminDashboardPage() {
  const [tab,setTab]=useState<Tab>('overview')
  const [data,setData]=useState<any>(null)
  const [error,setError]=useState('')
  const [contentKey,setContentKey]=useState('home_hero')
  const [contentJson,setContentJson]=useState('')
  const navigate=useNavigate()
  const session=getAdminSession()

  const load=async(t:Tab=tab)=>{
    setError('')
    try {
      const action = t==='overview'?'dashboard':t==='content'?'content-list':t==='payments'?'payments-list':t==='contacts'?'contacts-list':t==='visits'?'analytics-summary':t==='coupons'?'coupons-list':'me'
      setData(await adminApi(action))
    } catch(e:any){setError(e.message)}
  }

  useEffect(()=>{ if(!session) navigate('/admin/login'); else load(tab) },[tab])

  const saveContent=async()=>{
    try {
      await adminApi('content-update',{key:contentKey,value:JSON.parse(contentJson)})
      await load('content')
    }catch(e:any){setError(e.message)}
  }

  const createCoupon=async()=>{
    const code=prompt('Código del cupón')
    if(!code)return
    const discount=Number(prompt('Porcentaje de descuento (0-100)','100')||'0')
    await adminApi('coupon-create',{code,discountPercent:discount,maxUses:100})
    await load('coupons')
  }

  if(!session)return null

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <h2>MentesModernas</h2><span>Panel administrativo</span>
        {[
          ['overview','Resumen'],['content','Contenido'],['payments','Pagos'],['contacts','Mensajes'],
          ['visits','Visitas'],['coupons','Cupones'],['security','Seguridad']
        ].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k as Tab)}>{l}</button>)}
        <button onClick={()=>{clearAdminSession();navigate('/admin/login')}}>Cerrar sesión</button>
      </aside>

      <section className="admin-content">
        <div className="admin-top"><div><span className="eyebrow">ADMIN</span><h1>{tab.toUpperCase()}</h1></div><span>{session.admin.email}</span></div>
        {error && <div className="alert error">{error}</div>}

        {tab==='overview' && data && <div className="stat-grid">
          <Stat label="Visitas hoy" value={data.visitsToday}/>
          <Stat label="Visitas 30 días" value={data.visits30d}/>
          <Stat label="Pagos" value={data.paidPayments}/>
          <Stat label="Mensajes nuevos" value={data.unreadContacts}/>
          <Stat label="Tests Premium" value={data.completedPremium}/>
          <Stat label="Usuarios" value={data.totalProfiles}/>
        </div>}

        {tab==='content' && data && <>
          <div className="admin-card">
            <h2>Editar textos del sitio</h2>
            <label>Clave<select value={contentKey} onChange={e=>{setContentKey(e.target.value);const x=data.items?.find((i:any)=>i.key===e.target.value);setContentJson(JSON.stringify(x?.value??{},null,2))}}>
              {(data.items??[]).map((x:any)=><option key={x.key}>{x.key}</option>)}
            </select></label>
            <label>Contenido JSON<textarea rows={10} value={contentJson || JSON.stringify(data.items?.find((i:any)=>i.key===contentKey)?.value??{},null,2)} onChange={e=>setContentJson(e.target.value)}/></label>
            <button className="btn primary" onClick={saveContent}>Guardar cambios</button>
          </div>
          <div className="admin-card">
            <h2>Logo</h2>
            <input type="file" accept="image/*" onChange={async e=>{const f=e.target.files?.[0];if(f){await uploadLogo(f);alert('Logo actualizado')}}}/>
          </div>
        </>}

        {tab==='payments' && data && <Table rows={data.items??[]} columns={['created_at','email','product_name','amount','currency','status','coupon_code']}/>}
        {tab==='contacts' && data && <Table rows={data.items??[]} columns={['created_at','name','email','phone','message','status']}/>}
        {tab==='visits' && data && <>
          <div className="stat-grid"><Stat label="Hoy" value={data.today}/><Stat label="7 días" value={data.last7d}/><Stat label="30 días" value={data.last30d}/><Stat label="Visitantes únicos 30d" value={data.unique30d}/></div>
          <Table rows={data.topPages??[]} columns={['path','views']}/>
        </>}
        {tab==='coupons' && data && <>
          <button className="btn primary" onClick={createCoupon}>+ Crear cupón</button>
          <Table rows={data.items??[]} columns={['code','discount_type','discount_value','max_uses','uses_count','valid_until','is_active']}/>
        </>}
        {tab==='security' && <SecurityPanel/>}
      </section>
    </main>
  )
}

function Stat({label,value}:{label:string,value:any}){return <div className="stat-card"><span>{label}</span><strong>{value ?? 0}</strong></div>}
function Table({rows,columns}:{rows:any[],columns:string[]}){return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(c=><td key={c}>{String(r[c]??'')}</td>)}</tr>)}</tbody></table></div>}
function SecurityPanel(){
  const [currentPassword,setCurrent]=useState('');const [newPassword,setNew]=useState('');const [newEmail,setNewEmail]=useState('');const [msg,setMsg]=useState('')
  const change=async()=>{try{await adminApi('change-password',{currentPassword,newPassword});setMsg('Contraseña actualizada.')}catch(e:any){setMsg(e.message)}}
  const changeEmail=async()=>{try{await adminApi('change-email',{currentPassword,newEmail});setMsg('Correo actualizado. Cierra sesión y vuelve a ingresar con el nuevo correo.')}catch(e:any){setMsg(e.message)}}
  return <div className="admin-card"><h2>Seguridad administrativa</h2><label>Contraseña actual<input type="password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/></label><hr/><label>Nuevo correo<input value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></label><button className="btn secondary" onClick={changeEmail}>Cambiar correo</button><hr/><label>Nueva contraseña<input type="password" value={newPassword} onChange={e=>setNew(e.target.value)}/></label><button className="btn primary" onClick={change}>Actualizar contraseña</button>{msg&&<div className="alert">{msg}</div>}</div>
}
