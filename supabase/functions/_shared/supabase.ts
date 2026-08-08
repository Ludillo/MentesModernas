import { createClient } from 'npm:@supabase/supabase-js@2'

export function adminDb() {
  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export async function requireUser(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw new Error('AUTH_REQUIRED')

  const db = adminDb()
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new Error('INVALID_USER_TOKEN')
  return { user: data.user, db }
}
