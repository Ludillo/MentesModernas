import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'
import { createAdminJwt, sha256 } from '../_shared/adminAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const otp = String(body.otp ?? '').trim()
    const db = adminDb()

    const { data: verifiedRows, error: passwordError } = await db.rpc('admin_verify_password', {
      p_email: email,
      p_password: password
    })
    const admin = verifiedRows?.[0]

    if (passwordError || !admin) {
      await db.from('admin_users').update({ failed_attempts: 1 }).eq('email', email)
      return json(req, { error: 'Credenciales o token inválidos.' }, 401)
    }

    const { data: challenge } = await db.from('admin_login_tokens')
      .select('id,token_hash,expires_at,used_at')
      .eq('admin_id', admin.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const pepper = Deno.env.get('ADMIN_OTP_PEPPER') || ''
    const providedHash = await sha256(`${pepper}:${otp}`)
    if (!challenge || challenge.token_hash !== providedHash) {
      return json(req, { error: 'Credenciales o token inválidos.' }, 401)
    }

    await db.from('admin_login_tokens').update({ used_at: new Date().toISOString() }).eq('id', challenge.id)
    await db.from('admin_users').update({
      failed_attempts: 0,
      last_login_at: new Date().toISOString()
    }).eq('id', admin.id)

    const jwt = await createAdminJwt(admin)
    await db.from('admin_audit_log').insert({
      admin_id: admin.id,
      action: 'LOGIN',
      entity: 'admin_users',
      entity_id: admin.id,
      ip_address: req.headers.get('x-forwarded-for')
    })

    return json(req, {
      ...jwt,
      admin: { id: admin.id, email: admin.email, displayName: admin.display_name, role: admin.role }
    })
  } catch (e) {
    console.error(e)
    return json(req, { error: 'No fue posible ingresar.' }, 500)
  }
})
