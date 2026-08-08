import { useState } from 'react'
import { requestAdminOtp, verifyAdmin } from '../services/adminService'
import { useNavigate } from 'react-router-dom'

export default function AdminLoginPage() {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [otp,setOtp]=useState('')
  const [step,setStep]=useState<1|2>(1)
  const [msg,setMsg]=useState('')
  const navigate=useNavigate()

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
