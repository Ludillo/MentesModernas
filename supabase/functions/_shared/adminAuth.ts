import { SignJWT, jwtVerify } from 'npm:jose@6'

const encoder = new TextEncoder()

function secret() {
  const value = Deno.env.get('ADMIN_JWT_SECRET')
  if (!value || value.length < 32) throw new Error('ADMIN_JWT_SECRET must contain at least 32 characters')
  return encoder.encode(value)
}

export async function createAdminJwt(admin: { id:string,email:string,display_name:string,role:string }) {
  const expiresInSeconds = 4 * 60 * 60
  const token = await new SignJWT({
    email: admin.email,
    name: admin.display_name,
    role: admin.role,
    typ: 'admin'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .setIssuer('mentesmodernas-admin')
    .setAudience('mentesmodernas-admin-ui')
    .sign(secret())

  return {
    token,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
  }
}

export async function requireAdmin(req: Request) {
  const auth = req.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) throw new Error('ADMIN_AUTH_REQUIRED')

  const verified = await jwtVerify(token, secret(), {
    issuer: 'mentesmodernas-admin',
    audience: 'mentesmodernas-admin-ui'
  })
  if (verified.payload.typ !== 'admin' || !verified.payload.sub) throw new Error('INVALID_ADMIN_TOKEN')
  return {
    id: verified.payload.sub,
    email: String(verified.payload.email ?? ''),
    name: String(verified.payload.name ?? ''),
    role: String(verified.payload.role ?? '')
  }
}

export async function sha256(value: string) {
  const bytes = encoder.encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('')
}
