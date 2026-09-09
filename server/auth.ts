import { createRemoteJWKSet, jwtVerify, SignJWT, importPKCS8 } from 'jose'
import { account, googleApi, Firestore } from './firestore'
import { context, env } from './context'
const jwks=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'))
export async function identity(req:Request, optional=false):Promise<any> {
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if(!token){if(optional)return null;throw Error('Inicia sesión para continuar.')}
  const project=account().project_id
  const {payload}=await jwtVerify(token,jwks,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${project}`,audience:project})
  if(!payload.sub)throw Error('Sesión inválida.')
  const lookup=await googleApi(`https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,{localId:[payload.sub]})
  const current=lookup.users?.[0]
  if(!current||current.disabled||Number(payload.auth_time)<Number(current.validSince??0))throw Error('La sesión ya no está disponible.')
  const user={id:payload.sub,email:current.email,email_verified:current.emailVerified===true,user_metadata:{full_name:current.displayName??payload.name??''},provider:(payload.firebase as any)?.sign_in_provider,token}
  const db=new Firestore(),profile=await db.get('profiles',user.id)
  if(!profile)await db.put('profiles',user.id,{id:user.id,email:user.email??'',full_name:user.user_metadata.full_name,created_at:new Date().toISOString()},false,true).catch((e:any)=>{if(e.code!=='ALREADY_EXISTS')throw e})
  return user
}
export async function adminIdentity(req:Request):Promise<any> {
  const user=await identity(req)
  if(!user.email_verified||user.provider!=='google.com')throw Error('Ingresa con la cuenta Google autorizada.')
  const admins=await new Firestore().list('admin_users',['email',String(user.email).toLowerCase()])
  const admin=admins.find(a=>a.is_active)
  if(!admin)throw Error('Este correo no tiene acceso administrativo.')
  return {...admin,name:admin.display_name,user}
}
export async function customToken(uid:string) {
  const sa=account(),key=await importPKCS8(sa.private_key,'RS256')
  return new SignJWT({uid}).setProtectedHeader({alg:'RS256',kid:sa.private_key_id}).setIssuer(sa.client_email).setSubject(sa.client_email)
    .setAudience('https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit').setIssuedAt().setExpirationTime('1h').sign(key)
}
export async function hash(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('')}
export async function rateLimit(scope:string,limit:number,seconds:number) {
  const request=context.getStore()!.request,ip=request.headers.get('cf-connecting-ip')??'local'
  const key=await hash(`${env().APP_SECRET}:${scope}:${ip}:${Math.floor(Date.now()/seconds/1000)}`)
  await new Firestore().atomic(async db=>{const r=await db.get('rate_limits',key);if((r?.count??0)>=limit)throw Error('Demasiados intentos. Espera unos minutos.');await db.put('rate_limits',key,{id:key,count:(r?.count??0)+1,expires_at:new Date(Date.now()+seconds*2000).toISOString()})})
}
