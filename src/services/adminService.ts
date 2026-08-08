import type { AdminSession } from '../types/models'

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
