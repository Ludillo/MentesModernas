import { useEffect, useState } from 'react'
import { adminApi, clearAdminSession, getAdminSession, uploadLogo } from '../services/adminService'
import { useNavigate } from 'react-router-dom'
import { EMPTY_SOCIAL_SETTINGS, SocialSettings } from '../lib/social'

type Tab='overview'|'content'|'social'|'payments'|'contacts'|'visits'|'coupons'|'users'|'tests'|'reports'|'security'

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
      const action = t==='overview'?'dashboard':t==='content'||t==='social'?'content-list':t==='payments'?'payments-list':t==='contacts'?'contacts-list':t==='visits'||t==='reports'?'analytics-summary':t==='coupons'?'coupons-list':t==='users'?'users-list':t==='tests'?'tests-list':'me'
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
          ['overview','Resumen'],['content','Contenido'],['social','Redes sociales'],['payments','Pagos'],['contacts','Mensajes'],
          ['visits','Visitas'],['coupons','Cupones'],['users','Usuarios y accesos'],['tests','Tests y preguntas'],['reports','Reportes'],['security','Seguridad']
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

        {tab==='social' && data && <SocialPanel initial={data.items?.find((i:any)=>i.key==='social_links')?.value}/>} 

        {tab==='payments' && data && <><Table rows={data.items??[]} columns={['id','created_at','email','product_name','amount','currency','status','receipt_url','coupon_code']}/><ActionBox title="Revisar pago" fields="ID del pago,Estado (PAID/FAILED/CANCELLED)" onRun={async v=>{await adminApi('payment-review',{id:v[0],status:v[1].toUpperCase()});load('payments')}}/></>}
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
        {tab==='tests' && data && <><Table rows={(data.items??[]).map((x:any)=>({code:x.code,name:x.name,status:x.status,versions:x.test_versions?.length??0}))} columns={['code','name','status','versions']}/><p className="admin-hint">El catálogo, versiones y cantidad de preguntas se leen desde la base de datos. Usa el editor de preguntas para agregar o actualizar ítems.</p><ActionBox title="Guardar pregunta" fields="ID versión,Número,Dimensión,Pregunta" onRun={async v=>{await adminApi('question-save',{item:{testVersionId:v[0],number:v[1],dimensionCode:v[2],prompt:v[3]}});load('tests')}}/></>}
        {tab==='reports' && data && <><div className="stat-grid"><Stat label="Visitas 7 días" value={data.last7d}/><Stat label="Visitas 30 días" value={data.last30d}/><Stat label="Usuarios únicos" value={data.unique30d}/></div><Table rows={data.topPages??[]} columns={['path','views']}/><button className="btn secondary" onClick={()=>window.print()}>Imprimir / guardar PDF</button></>}
        {tab==='security' && <SecurityPanel/>}
      </section>
    </main>
  )
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
function Table({rows,columns}:{rows:any[],columns:string[]}){return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(c=><td key={c}>{String(r[c]??'')}</td>)}</tr>)}</tbody></table></div>}
function SecurityPanel(){
  const [currentPassword,setCurrent]=useState('');const [newPassword,setNew]=useState('');const [newEmail,setNewEmail]=useState('');const [msg,setMsg]=useState('')
  const change=async()=>{try{await adminApi('change-password',{currentPassword,newPassword});setMsg('Contraseña actualizada.')}catch(e:any){setMsg(e.message)}}
  const changeEmail=async()=>{try{await adminApi('change-email',{currentPassword,newEmail});setMsg('Correo actualizado. Cierra sesión y vuelve a ingresar con el nuevo correo.')}catch(e:any){setMsg(e.message)}}
  return <div className="admin-card"><h2>Seguridad administrativa</h2><label>Contraseña actual<input type="password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/></label><hr/><label>Nuevo correo<input value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></label><button className="btn secondary" onClick={changeEmail}>Cambiar correo</button><hr/><label>Nueva contraseña<input type="password" value={newPassword} onChange={e=>setNew(e.target.value)}/></label><button className="btn primary" onClick={change}>Actualizar contraseña</button>{msg&&<div className="alert">{msg}</div>}</div>
}
function ActionBox({title,fields,onRun}:{title:string,fields:string,onRun:(values:string[])=>Promise<void>}){const labels=fields.split(',');const [values,setValues]=useState(labels.map(()=>''));const [msg,setMsg]=useState('');return <div className="admin-card"><h2>{title}</h2>{labels.map((l,i)=><label key={l}>{l}<input value={values[i]} onChange={e=>setValues(v=>v.map((x,j)=>j===i?e.target.value:x))}/></label>)}<button className="btn primary" onClick={async()=>{try{await onRun(values);setMsg('Operación completada.')}catch(e:any){setMsg(e.message)}}}>Guardar</button>{msg&&<div className="alert">{msg}</div>}</div>}
