import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'
import { createAdminJwt } from '../_shared/adminAuth.ts'

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
 if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
 try{
  const auth=req.headers.get('Authorization')||'',token=auth.startsWith('Bearer ')?auth.slice(7):''
  if(!token)return json(req,{error:'Inicia sesión con Google para continuar.'},401)
  const db=adminDb(),{data,error}=await db.auth.getUser(token),user=data.user
  if(error||!user?.email)return json(req,{error:'La sesión de Google no es válida.'},401)
  const providers=Array.isArray(user.app_metadata?.providers)?user.app_metadata.providers:[]
  if(user.app_metadata?.provider!=='google'&&!providers.includes('google'))return json(req,{error:'El panel administrativo requiere una cuenta de Google autorizada.'},403)
  const {data:admin,error:adminError}=await db.from('admin_users').select('id,email,display_name,role,is_active').ilike('email',user.email).maybeSingle()
  if(adminError)throw adminError
  if(!admin?.is_active)return json(req,{error:'Este correo de Google no está autorizado como administrador.'},403)
  await db.from('admin_users').update({auth_user_id:user.id,auth_provider:'google',last_login_at:new Date().toISOString(),failed_attempts:0,updated_at:new Date().toISOString()}).eq('id',admin.id)
  await db.from('admin_audit_log').insert({admin_id:admin.id,action:'LOGIN_GOOGLE',entity:'admin_users',entity_id:admin.id,ip_address:req.headers.get('x-forwarded-for')})
  const jwt=await createAdminJwt(admin)
  return json(req,{...jwt,admin:{id:admin.id,email:admin.email,displayName:admin.display_name,role:admin.role}})
 }catch(error){console.error(error);return json(req,{error:'No fue posible validar el acceso administrativo con Google.'},500)}
})
