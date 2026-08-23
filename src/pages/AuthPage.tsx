import { useState } from 'react'
import {
  sendEmailOtp,
  signInWithGoogle,
  verifyEmailOtp
  ,signInWithPassword, signUpWithPassword
} from '../services/authService'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState('')
  const [password,setPassword]=useState('')
  const [fullName,setFullName]=useState('')
  const [mode,setMode]=useState<'password'|'otp'>('password')

  const navigate = useNavigate()

  const send = async () => {
    setMsg('')

    try {
      await sendEmailOtp(email)

      setSent(true)
      setMsg('Te enviamos un código a tu correo.')
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  const verify = async () => {
    setMsg('')

    try {
      await verifyEmailOtp(email, otp)

      navigate('/cuenta')
    } catch (e: any) {
      setMsg(e.message)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="eyebrow">
          INGRESAR
        </span>

        <h1>
          Tu cuenta MentesModernas
        </h1>

        <p>
          No distinguimos entre registro y login.
          Si es tu primera vez, tu cuenta se crea al autenticarte.
        </p>

        <button
          type="button"
          className="google-btn google-btn--brand"
          onClick={signInWithGoogle}
        >
          <span
            className="google-mark"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="26"
              height="26"
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.207 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />

              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"
              />

              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.142 35.091 26.715 36 24 36c-5.186 0-9.625-3.33-11.287-7.946l-6.522 5.025C9.5 39.556 16.227 44 24 44z"
              />

              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303c-1.08 3.019-3.34 5.432-6.084 6.965l.003-.002 6.19 5.238C33.971 42.09 44 36 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
          </span>

          <span className="google-btn-text">
            Continuar con Google
          </span>
        </button>

        <div className="separator">
          <span>o</span>
        </div>

        <div className="auth-tabs"><button className={mode==='password'?'active':''} onClick={()=>setMode('password')}>Contraseña</button><button className={mode==='otp'?'active':''} onClick={()=>setMode('otp')}>Código por correo</button></div>

        <label>
          Correo electrónico

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
          />
        </label>

        {mode==='password' ? <>
          <label>Nombre (solo para registro)<input value={fullName} onChange={e=>setFullName(e.target.value)} autoComplete="name" /></label>
          <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" minLength={8}/></label>
          <div className="card-actions"><button className="btn primary" onClick={async()=>{try{await signInWithPassword(email,password);navigate('/cuenta')}catch(e:any){setMsg(e.message)}}}>Ingresar</button><button className="btn secondary" onClick={async()=>{try{await signUpWithPassword(email,password,fullName);setMsg('Cuenta creada. Revisa tu correo si se requiere confirmación.')}catch(e:any){setMsg(e.message)}}}>Crear cuenta</button></div>
        </> : !sent ? (
          <button
            type="button"
            className="btn primary full"
            onClick={send}
            disabled={!email.trim()}
          >
            Continuar con correo
          </button>
        ) : (
          <>
            <label>
              Código recibido

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </label>

            <button
              type="button"
              className="btn primary full"
              onClick={verify}
              disabled={otp.length < 6}
            >
              Verificar e ingresar
            </button>
          </>
        )}

        {msg && (
          <div className="alert">
            {msg}
          </div>
        )}
      </section>
    </main>
  )
}
