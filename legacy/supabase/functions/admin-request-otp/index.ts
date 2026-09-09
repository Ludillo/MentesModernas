import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'
import { sha256 } from '../_shared/adminAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405)

  try {
    const { email } = await req.json()
    const normalized = String(email ?? '').trim().toLowerCase()
    // Always return a generic response to avoid administrator enumeration.
    const generic = { ok: true, message: 'Si el correo está habilitado, se envió un token.' }
    if (!normalized || !normalized.includes('@')) return json(req, generic)

    const db = adminDb()
    const { data: admin } = await db.from('admin_users')
      .select('id,email,display_name,is_active')
      .eq('email', normalized)
      .eq('is_active', true)
      .maybeSingle()

    if (!admin) return json(req, generic)

    const { data: latest } = await db.from('admin_login_tokens')
      .select('created_at')
      .eq('admin_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest && Date.now() - new Date(latest.created_at).getTime() < 60_000) {
      return json(req, generic)
    }

    const token = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0')
    const pepper = Deno.env.get('ADMIN_OTP_PEPPER') || ''
    const tokenHash = await sha256(`${pepper}:${token}`)

    await db.from('admin_login_tokens').insert({
      admin_id: admin.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString()
    })

    const resend = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('RESEND_FROM') || 'MentesModernas <noreply@example.com>'
    if (resend) {
      const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resend}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [admin.email],
          subject: 'Token de acceso MentesModernas',
          html: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>MentesModernas Admin</h2><p>Tu token temporal es:</p><div style="font-size:34px;font-weight:bold;letter-spacing:8px">${token}</div><p>Vence en 10 minutos. Si no solicitaste este acceso, ignora el mensaje.</p></div>`
        })
      })
      if (!mailRes.ok) console.error('Resend error', await mailRes.text())
    }

    if (Deno.env.get('ADMIN_DEV_MODE') === 'true') {
      return json(req, { ...generic, devToken: token })
    }
    return json(req, generic)
  } catch (e) {
    console.error(e)
    return json(req, { ok: true, message: 'Si el correo está habilitado, se envió un token.' })
  }
})
