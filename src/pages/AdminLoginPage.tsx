import { useEffect, useState } from 'react'
import { getAdminSession, requestAdminOtp, restoreGoogleAdminSession, signInAdminWithGoogle, verifyAdmin } from '../services/adminService'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [otp,setOtp]=useState('')
  const [step,setStep]=useState<1|2>(1)
  const [msg,setMsg]=useState('')
  const [googleBusy,setGoogleBusy]=useState(false)
  const navigate=useNavigate()

  useEffect(()=>{
    if(getAdminSession()){navigate('/admin');return}
    restoreGoogleAdminSession().then(session=>{if(session)navigate('/admin')}).catch(e=>setMsg(e.message))
  },[])

  const request=async()=>{
    setMsg('')
    await requestAdminOtp(email)
    setStep(2)
    setMsg('Si el correo corresponde a un administrador activo, se envió un token.')
  }
  const verify=async()=>{
    try { await verifyAdmin(email,password,otp); navigate('/admin') }
    catch(e:any){setMsg(e.message)}
  }

  return (
    <main className="admin-login">
      <section className="admin-login-card">
        <span className="eyebrow">ADMINISTRACIÓN SEGURA</span>
        <h1>MentesModernas Admin</h1>
        <p>Ingresa con una cuenta Google registrada como administradora. Podrás seleccionar la cuenta que deseas utilizar.</p>
        <button className="btn google full" disabled={googleBusy} onClick={async()=>{try{setMsg('');setGoogleBusy(true);await signInAdminWithGoogle()}catch(e:any){setGoogleBusy(false);setMsg(e.message)}}}>{googleBusy?'Abriendo Google…':'Continuar con Google'}</button>
        <div className="separator"><span>o usa el acceso de respaldo</span></div>
        {step===1 ? <>
          <p>Ingresa tu correo administrativo. La plataforma enviará un token si el usuario está habilitado.</p>
          <label>Correo<input value={email} onChange={e=>setEmail(e.target.value)} /></label>
          <button className="btn primary full" onClick={request}>Continuar</button>
        </> : <>
          <p>Completa tu contraseña administrativa y el token temporal recibido por correo.</p>
          <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
          <label>Token<input inputMode="numeric" value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456"/></label>
          <button className="btn primary full" onClick={verify}>Ingresar al panel</button>
        </>}
        {msg && <div className="alert">{msg}</div>}
      </section>
    </main>
  )
}
