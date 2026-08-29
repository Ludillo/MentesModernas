import { useEffect, useState } from 'react'
import { adminApi, clearAdminSession, getAdminSession, uploadLogo } from '../services/adminService'
import { useNavigate } from 'react-router-dom'
import { EMPTY_SOCIAL_SETTINGS, SocialSettings } from '../lib/social'

type Tab='overview'|'content'|'statistics'|'news'|'social'|'payments'|'contacts'|'visits'|'coupons'|'users'|'administrators'|'tests'|'reports'|'security'

export default function AdminDashboardPage() {
  const [tab,setTab]=useState<Tab>('overview')
  const [data,setData]=useState<any>(null)
  const [error,setError]=useState('')
  const [contentKey,setContentKey]=useState('home_hero')
  const [contentJson,setContentJson]=useState('')
  const navigate=useNavigate()
  const session=getAdminSession()
  const navItems:[Tab,string][]=[
    ['overview','Resumen'],['content','Contenido'],['statistics','Indicadores'],['news','Noticias'],['social','Redes sociales'],['payments','Pagos'],['contacts','Mensajes'],
    ['visits','Visitas'],['coupons','Cupones'],['users','Usuarios y accesos'],...(session?.admin.role==='SUPERADMIN'?([['administrators','Administradores']] as [Tab,string][]):[]),['tests','Tests y preguntas'],['reports','Reportes'],['security','Seguridad']
  ]

  const load=async(t:Tab=tab)=>{
    setError('')
    try {
      const action = t==='overview'?'dashboard':['content','social','statistics','news'].includes(t)?'content-list':t==='payments'?'payments-list':t==='contacts'?'contacts-list':t==='visits'||t==='reports'?'analytics-summary':t==='coupons'?'coupons-list':t==='users'?'users-list':t==='administrators'?'admins-list':t==='tests'?'tests-list':'me'
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
    const maxUses=Number(prompt('Cantidad máxima de usos','1')||'1')
    await adminApi('coupon-create',{code,discountPercent:discount,maxUses})
    await load('coupons')
  }

  if(!session)return null

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <h2>MentesModernas</h2><span>Panel administrativo</span>
        <label className="admin-nav-select">Ir a una sección<select value={tab} onChange={e=>setTab(e.target.value as Tab)}>{navItems.map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
        <div className="admin-nav-buttons">{navItems.map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</div>
        <button className="admin-logout" onClick={()=>{clearAdminSession();navigate('/admin/login')}}>Cerrar sesión</button>
      </aside>

      <section className="admin-content">
        <div className="admin-top"><div><span className="eyebrow">ADMIN</span><h1>{tab.toUpperCase()}</h1></div><span>{session.admin.email}</span></div>
        {error && <div className="alert error">{error}</div>}

        {tab==='overview' && data && <>
          <section className="admin-welcome"><div><span className="eyebrow">BIENVENIDO</span><h2>El pulso de MentesModernas</h2><p>Consulta accesos, crecimiento, evaluaciones y actividad comercial desde una sola pantalla.</p></div><span className="admin-live-indicator">● Datos actuales</span></section>
          <div className="stat-grid admin-overview-grid">
            <Stat label="Accesos totales" value={data.totalVisits}/>
            <Stat label="Visitas hoy" value={data.visitsToday}/>
            <Stat label="Visitas últimos 30 días" value={data.visits30d}/>
            <Stat label="Tests completados" value={data.totalCompleted}/>
            <Stat label="Tests gratuitos" value={data.completedFree}/>
            <Stat label="Tests avanzados" value={data.completedPremium}/>
            <Stat label="Pagos confirmados" value={data.paidPayments}/>
            <Stat label="Cuentas registradas" value={data.totalProfiles}/>
            <Stat label="Cuentas nuevas · 30 días" value={data.newAccounts30d}/>
            <Stat label="Usuarios recurrentes · 2+ tests" value={data.returningAccounts}/>
            <Stat label="Mensajes nuevos" value={data.unreadContacts}/>
          </div>
        </>}

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

        {tab==='social' && data && <SocialPanel initial={data.items?.find((i:any)=>i.key==='social_links')?.value}/>} 
        {tab==='statistics' && data && (
          <StatisticsPanel initial={data.items?.find((i:any)=>i.key==='site_stats')?.value}/>
        )}
        {tab==='news' && data && (
          <NewsPanel initial={data.items?.find((i:any)=>i.key==='news')?.value}/>
        )}

        {tab==='payments' && data && <PaymentsPanel items={data.items??[]} onRefresh={()=>load('payments')}/>}
        {tab==='contacts' && data && <Table rows={data.items??[]} columns={['created_at','name','email','phone','message','status']}/>}
        {tab==='visits' && data && <>
          <div className="stat-grid"><Stat label="Hoy" value={data.today}/><Stat label="7 días" value={data.last7d}/><Stat label="30 días" value={data.last30d}/><Stat label="Visitantes únicos 30d" value={data.unique30d}/></div>
          <Table rows={data.topPages??[]} columns={['path','views']}/>
        </>}
        {tab==='coupons' && data && <>
          <button className="btn primary" onClick={createCoupon}>+ Crear cupón</button>
          <Table rows={data.items??[]} columns={['code','discount_type','discount_value','max_uses','uses_count','valid_until','is_active']}/>
        </>}
        {tab==='users' && data && <><Table rows={data.items??[]} columns={['email','full_name','created_at']}/><ActionBox title="Autorizar acceso manual" fields="Correo del usuario,Código Premium del test" onRun={async v=>{await adminApi('access-grant',{email:v[0],productCode:v[1].toUpperCase()});alert('Acceso autorizado')}}/></>}
        {tab==='administrators' && data && <AdministratorsPanel items={data.items??[]} onRefresh={()=>load('administrators')}/>}
        {tab==='tests' && data && <><Table rows={(data.items??[]).map((x:any)=>({code:x.code,name:x.name,status:x.status,versions:x.test_versions?.length??0}))} columns={['code','name','status','versions']}/><p className="admin-hint">El catálogo, versiones, preguntas y precios se leen desde la base de datos. El monto guardado aquí es el que se envía a la API QR.</p><ProductPrices items={data.items??[]} onSaved={()=>load('tests')}/><ActionBox title="Guardar pregunta" fields="ID versión,Número,Dimensión,Pregunta" onRun={async v=>{await adminApi('question-save',{item:{testVersionId:v[0],number:v[1],dimensionCode:v[2],prompt:v[3]}});load('tests')}}/></>}
        {tab==='reports' && data && <><div className="stat-grid"><Stat label="Visitas 7 días" value={data.last7d}/><Stat label="Visitas 30 días" value={data.last30d}/><Stat label="Usuarios únicos" value={data.unique30d}/></div><Table rows={data.topPages??[]} columns={['path','views']}/><button className="btn secondary" onClick={()=>window.print()}>Imprimir / guardar PDF</button></>}
        {tab==='security' && <SecurityPanel/>}
      </section>
    </main>
  )
}

function StatisticsPanel({initial}:{initial?:any}){
  const [values,setValues]=useState(initial??{completed_tests:13433,active_users:14533,effectiveness:83});const [msg,setMsg]=useState('')
  const field=(key:string,label:string,suffix='')=><label>{label}<div className="admin-inline-input"><input type="number" min="0" max={key==='effectiveness'?100:undefined} value={values[key]??0} onChange={e=>setValues({...values,[key]:Number(e.target.value)})}/>{suffix&&<span>{suffix}</span>}</div></label>
  return <div className="admin-card"><h2>Indicadores públicos</h2><p className="admin-hint">Estos valores aparecen en la portada y pueden actualizarse cuando lo necesites.</p>{field('completed_tests','Tests completados')}{field('active_users','Usuarios activos')}{field('effectiveness','Efectividad','%')}<button className="btn primary" onClick={async()=>{try{await adminApi('content-update',{key:'site_stats',value:values});setMsg('Indicadores publicados.')}catch(e:any){setMsg(e.message)}}}>Guardar indicadores</button>{msg&&<div className="alert">{msg}</div>}</div>
}

function NewsPanel({initial}:{initial?:any}){
  const [articles,setArticles]=useState<any[]>(initial?.articles??[]);const [msg,setMsg]=useState('')
  const update=(i:number,key:string,value:string)=>setArticles(a=>a.map((x,n)=>n===i?{...x,[key]:value}:x))
  const add=()=>setArticles(a=>[...a,{id:crypto.randomUUID(),category:'NUEVO',title:'Nuevo artículo',excerpt:'Escribe aquí un resumen informativo.',read_time:'4 min de lectura'}])
  return <div className="admin-card"><div className="admin-section-head"><div><h2>Noticias y contenidos</h2><p className="admin-hint">Administra las tarjetas educativas que aparecen en la portada y en Noticias. Utiliza fuentes en español pensadas para público latinoamericano.</p></div><button className="btn secondary" onClick={add}>+ Agregar noticia</button></div><div className="news-editor-list">{articles.map((x,i)=><fieldset key={x.id}><legend>Noticia {i+1}</legend><label>Categoría<input value={x.category??''} onChange={e=>update(i,'category',e.target.value)}/></label><label>Título<input value={x.title??''} onChange={e=>update(i,'title',e.target.value)}/></label><label>Resumen<textarea rows={4} value={x.excerpt??''} onChange={e=>update(i,'excerpt',e.target.value)}/></label><label>Fuente en español<input value={x.source??''} onChange={e=>update(i,'source',e.target.value)}/></label><label>Enlace de la fuente<input type="url" value={x.url??''} onChange={e=>update(i,'url',e.target.value)}/></label><label>Texto del enlace<input value={x.link_label??''} onChange={e=>update(i,'link_label',e.target.value)}/></label><label>Tiempo de lectura<input value={x.read_time??''} onChange={e=>update(i,'read_time',e.target.value)}/></label><button className="btn ghost" onClick={()=>setArticles(a=>a.filter((_,n)=>n!==i))}>Quitar de la publicación</button></fieldset>)}</div><button className="btn primary" onClick={async()=>{try{await adminApi('content-update',{key:'news',value:{articles}});setMsg('Noticias publicadas.')}catch(e:any){setMsg(e.message)}}}>Guardar y publicar noticias</button>{msg&&<div className="alert">{msg}</div>}</div>
}

function SocialPanel({initial}:{initial?:SocialSettings}){
  const [settings,setSettings]=useState<SocialSettings>({...EMPTY_SOCIAL_SETTINGS,...initial})
  const [msg,setMsg]=useState('')
  const update=(network:keyof SocialSettings,field:string,value:string|boolean)=>setSettings(current=>({...current,[network]:{...(current[network] as any),[field]:value}}))
  const save=async()=>{try{await adminApi('content-update',{key:'social_links',value:settings});setMsg('Redes sociales actualizadas y publicadas.')}catch(e:any){setMsg(e.message)}}
  const networks:[keyof SocialSettings,string][]=[['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok'],['youtube','YouTube'],['linkedin','LinkedIn']]
  return <div className="admin-card social-admin">
    <h2>Redes sociales y WhatsApp</h2><p className="admin-hint">Activa únicamente los canales que quieres mostrar públicamente. WhatsApp abrirá una conversación con el número y mensaje configurados.</p>
    <div className="social-config-grid">
      <fieldset><legend>WhatsApp</legend><label className="check-row"><input type="checkbox" checked={!!settings.whatsapp?.enabled} onChange={e=>update('whatsapp','enabled',e.target.checked)}/> Mostrar botón de WhatsApp</label><label>Número con código de país<input placeholder="59170000000" value={settings.whatsapp?.number??''} onChange={e=>update('whatsapp','number',e.target.value)}/></label><label>Mensaje inicial<textarea rows={3} value={settings.whatsapp?.message??''} onChange={e=>update('whatsapp','message',e.target.value)}/></label></fieldset>
      {networks.map(([key,label])=><fieldset key={key}><legend>{label}</legend><label className="check-row"><input type="checkbox" checked={!!settings[key]?.enabled} onChange={e=>update(key,'enabled',e.target.checked)}/> Mostrar {label}</label><label>Enlace completo<input placeholder={`https://${label.toLowerCase()}.com/...`} value={(settings[key] as any)?.url??''} onChange={e=>update(key,'url',e.target.value)}/></label></fieldset>)}
    </div>
    <button className="btn primary" onClick={save}>Guardar y publicar redes</button>{msg&&<div className="alert">{msg}</div>}
  </div>
}

function Stat({label,value}:{label:string,value:any}){return <div className="stat-card"><span>{label}</span><strong>{value ?? 0}</strong></div>}
function AdministratorsPanel({items,onRefresh}:{items:any[],onRefresh:()=>Promise<void>}){
 const [email,setEmail]=useState('');const [name,setName]=useState('');const [role,setRole]=useState('ADMIN');const [msg,setMsg]=useState('')
 const add=async()=>{try{await adminApi('admin-create',{email,displayName:name,role});setEmail('');setName('');setMsg('Administrador agregado. Ya puede entrar con su cuenta Google.');await onRefresh()}catch(e:any){setMsg(e.message)}}
 return <><div className="admin-card"><h2>Agregar administrador con Google</h2><p className="admin-hint">Registra el mismo correo que la persona utiliza en Google. No se comparte ni almacena su contraseña de Gmail.</p><label>Nombre<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Correo Google<input type="email" value={email} onChange={e=>setEmail(e.target.value.toLowerCase())} placeholder="persona@gmail.com"/></label><label>Rol<select value={role} onChange={e=>setRole(e.target.value)}><option value="ADMIN">Administrador</option><option value="SUPERADMIN">Superadministrador</option></select></label><button className="btn primary" disabled={!email||!name} onClick={add}>Agregar administrador</button>{msg&&<div className="alert">{msg}</div>}</div><div className="payment-review-list">{items.map(x=><article className="admin-card payment-review-card" key={x.id}><div><span className={`payment-status ${x.is_active?'status-paid':'status-cancelled'}`}>{x.is_active?'Activo':'Desactivado'}</span><h3>{x.display_name}</h3><p>{x.email} · {x.role}</p><small>{x.last_login_at?`Último acceso: ${new Date(x.last_login_at).toLocaleString('es-BO')}`:'Todavía no inició con Google'}</small></div><button className="btn secondary" onClick={async()=>{try{await adminApi('admin-toggle',{id:x.id,isActive:!x.is_active});await onRefresh()}catch(e:any){setMsg(e.message)}}}>{x.is_active?'Desactivar':'Activar'}</button></article>)}</div></>
}
function ProductPrices({items,onSaved}:{items:any[],onSaved:()=>Promise<void>}){
 const products=items.flatMap(type=>(type.test_versions??[]).flatMap((version:any)=>(version.test_products??[]).filter((product:any)=>product.access_level==='PREMIUM')))
 const [values,setValues]=useState<Record<string,string>>(Object.fromEntries(products.map((p:any)=>[p.code,String(p.price)])));const [msg,setMsg]=useState('')
 return <div className="admin-card"><h2>Precios de tests avanzados</h2><p className="admin-hint">Configura el valor de cobro por cada test. Moneda: bolivianos (BOB).</p>{products.map((p:any)=><div className="admin-inline-input" key={p.code}><label>{p.name}<input type="number" min="1" step="0.01" value={values[p.code]??p.price} onChange={e=>setValues(current=>({...current,[p.code]:e.target.value}))}/></label><button className="btn secondary" onClick={async()=>{try{await adminApi('product-price-update',{productCode:p.code,price:Number(values[p.code]),currency:'BOB'});setMsg(`Precio de ${p.name} actualizado.`);await onSaved()}catch(e:any){setMsg(e.message)}}}>Guardar precio</button></div>)}{msg&&<div className="alert">{msg}</div>}</div>
}
function PaymentsPanel({items,onRefresh}:{items:any[],onRefresh:()=>Promise<void>}){
  const [busy,setBusy]=useState('');const [msg,setMsg]=useState('')
  const review=async(id:string,status:'PAID'|'FAILED')=>{setBusy(id);setMsg('');try{await adminApi('payment-review',{id,status});setMsg(status==='PAID'?'Pago aprobado y acceso habilitado.':'Comprobante rechazado.');await onRefresh()}catch(e:any){setMsg(e.message)}finally{setBusy('')}}
  const pending=items.filter(x=>x.status==='PENDING'), reviewed=items.filter(x=>x.status!=='PENDING')
  const list=(rows:any[])=><div className="payment-review-list">{rows.map(x=><article className="admin-card payment-review-card" key={x.id}><div><span className={`payment-status status-${String(x.status).toLowerCase()}`}>{x.status==='PENDING'?(x.provider_transaction_id?'Esperando confirmación bancaria':'Pendiente de revisión'):x.status==='PAID'?'Pagado':'Rechazado'}</span><h3>{x.product_name??'Test Premium'}</h3><p><b>{x.provider_transaction_id?`QR ${x.provider_transaction_id}`:(x.payer_name||'Nombre no indicado')}</b> · {x.email}</p><p>{x.provider_transaction_id?`Estado API: ${x.provider_status||'pending'}`:`Referencia: ${x.payer_reference||'No indicada'}`} · {x.amount} {x.currency}</p><small>Recibido: {new Date(x.created_at).toLocaleString('es-BO')}</small></div><div className="payment-review-actions">{x.provider_transaction_id?<span>Verificación automática segura</span>:<>{x.receipt_url?<a className="btn secondary" href={x.receipt_url} target="_blank" rel="noreferrer">Ver comprobante</a>:<span>Sin archivo</span>}{x.status==='PENDING'&&<><button className="btn primary" disabled={busy===x.id} onClick={()=>review(x.id,'PAID')}>Aprobar pago</button><button className="btn ghost" disabled={busy===x.id} onClick={()=>review(x.id,'FAILED')}>Rechazar</button></>}</>}</div></article>)}</div>
  return <><div className="admin-section-head"><div><h2>Comprobantes pendientes</h2><p className="admin-hint">Abre el comprobante, verifica el monto y la referencia, y aprueba el acceso con un clic.</p></div><span className="pending-badge">{pending.length} pendientes</span></div>{msg&&<div className="alert">{msg}</div>}{pending.length?list(pending):<div className="admin-card"><p>No hay pagos pendientes de revisión.</p></div>}<h2 className="admin-subtitle">Historial de pagos</h2>{reviewed.length?list(reviewed):<p className="admin-hint">Todavía no hay pagos revisados.</p>}</>
}
function Table({rows,columns}:{rows:any[],columns:string[]}){return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(c=><td key={c}>{String(r[c]??'')}</td>)}</tr>)}</tbody></table></div>}
function SecurityPanel(){
  const [currentPassword,setCurrent]=useState('');const [newPassword,setNew]=useState('');const [newEmail,setNewEmail]=useState('');const [msg,setMsg]=useState('')
  const change=async()=>{try{await adminApi('change-password',{currentPassword,newPassword});setMsg('Contraseña actualizada.')}catch(e:any){setMsg(e.message)}}
  const changeEmail=async()=>{try{await adminApi('change-email',{currentPassword,newEmail});setMsg('Correo actualizado. Cierra sesión y vuelve a ingresar con el nuevo correo.')}catch(e:any){setMsg(e.message)}}
  return <div className="admin-card"><h2>Seguridad administrativa</h2><label>Contraseña actual<input type="password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/></label><hr/><label>Nuevo correo<input value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></label><button className="btn secondary" onClick={changeEmail}>Cambiar correo</button><hr/><label>Nueva contraseña<input type="password" value={newPassword} onChange={e=>setNew(e.target.value)}/></label><button className="btn primary" onClick={change}>Actualizar contraseña</button>{msg&&<div className="alert">{msg}</div>}</div>
}
function ActionBox({title,fields,onRun}:{title:string,fields:string,onRun:(values:string[])=>Promise<void>}){const labels=fields.split(',');const [values,setValues]=useState(labels.map(()=>''));const [msg,setMsg]=useState('');return <div className="admin-card"><h2>{title}</h2>{labels.map((l,i)=><label key={l}>{l}<input value={values[i]} onChange={e=>setValues(v=>v.map((x,j)=>j===i?e.target.value:x))}/></label>)}<button className="btn primary" onClick={async()=>{try{await onRun(values);setMsg('Operación completada.')}catch(e:any){setMsg(e.message)}}}>Guardar</button>{msg&&<div className="alert">{msg}</div>}</div>}
