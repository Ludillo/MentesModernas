import type { AdminSession } from '../types/models'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'mm_admin_session'

function functionUrl(name: string) {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearAdminSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export async function requestAdminOtp(email: string) {
  const res = await fetch(functionUrl('admin-request-otp'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    },
    body: JSON.stringify({ email })
  })
  return res.json()
}

export async function verifyAdmin(email: string, password: string, otp: string) {
  const res = await fetch(functionUrl('admin-verify'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    },
    body: JSON.stringify({ email, password, otp })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'No fue posible ingresar')
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data as AdminSession
}

export async function signInAdminWithGoogle(){
 const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:`${window.location.origin}/admin/login`}})
 if(error)throw error
}

export async function restoreGoogleAdminSession(){
 const {data}=await supabase.auth.getSession();const accessToken=data.session?.access_token
 if(!accessToken)return null
 const res=await fetch(functionUrl('admin-google-auth'),{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${accessToken}`,apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}})
 const payload=await res.json();if(!res.ok)throw new Error(payload.error??'Este correo no tiene acceso administrativo.')
 sessionStorage.setItem(STORAGE_KEY,JSON.stringify(payload));return payload as AdminSession
}

export async function adminApi(action: string, payload: Record<string, unknown> = {}) {
  const session = getAdminSession()
  if (!session) throw new Error('Sesión administrativa no disponible')

  const res = await fetch(functionUrl('admin-api'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    },
    body: JSON.stringify({ action, ...payload })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Error administrativo')
  return data
}

export async function uploadLogo(file: File) {
  const session = getAdminSession()
  if (!session) throw new Error('Sesión administrativa no disponible')
  const form = new FormData()
  form.append('file', file)

  const res = await fetch(functionUrl('admin-upload-logo'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    },
    body: form
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'No se pudo subir el logo')
  return data
}
