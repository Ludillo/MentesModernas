import { context, type Env } from './context'
import { media } from './storage'
import { adminIdentity, rateLimit } from './auth'
import data from './handlers/data'
import emailAuth from './handlers/email-auth'
import admin from './handlers/admin-api'
import qr from './handlers/payment-qr'
import paymentCheck from './handlers/payment-check'
import paymentSubmit from './handlers/payment-submit'
import logo from './handlers/admin-upload-logo'
import contact from './handlers/public-contact'
import analytics from './handlers/public-analytics'
import premium from './handlers/submit-premium-result'
import free from './handlers/submit-free-result'
const handlers:Record<string,(r:Request)=>Promise<Response>>={data,'email-auth':emailAuth,'admin-api':admin,'payment-qr':qr,'payment-check':paymentCheck,'payment-submit':paymentSubmit,'admin-upload-logo':logo,'public-contact':contact,'public-analytics':analytics,'submit-premium-result':premium,'submit-free-result':free,
  'admin-google-auth':async req=>{const a=await adminIdentity(req);return Response.json({token:a.user.token,expiresAt:new Date(Date.now()+3500000).toISOString(),admin:{id:a.id,email:a.email,displayName:a.display_name,role:a.role}})}
}
export default {async fetch(req:Request,env:Env){return context.run({env,request:req},async()=>{
  const url=new URL(req.url)
  try{
    if(url.pathname==='/api/health')return Response.json({ok:true,backend:'firebase',storage:'r2',version:'2026-09-08'})
    if(url.pathname.startsWith('/media/'))return await media(req)
    if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req)
    if(req.method!=='POST')return Response.json({error:'Método no permitido.'},{status:405})
    const origin=req.headers.get('origin');if(origin&&origin!==url.origin)return Response.json({error:'Origen no permitido.'},{status:403})
    if(Number(req.headers.get('content-length')??0)>6000000)return Response.json({error:'Solicitud demasiado grande.'},{status:413})
    const name=url.pathname.slice(5),handler=handlers[name];if(!handler)return Response.json({error:'Ruta no disponible.'},{status:404})
    if(['public-contact','payment-qr','payment-submit'].includes(name))await rateLimit(name,name==='public-contact'?5:30,3600)
    if(name==='public-analytics')await rateLimit(name,120,3600)
    const response=await handler(req);response.headers.set('Cache-Control','no-store');response.headers.set('X-Content-Type-Options','nosniff');return response
  }catch(error:any){console.error('request_failed',{path:url.pathname,code:error.code??'VALIDATION'});return Response.json({error:error.code?'No se pudo completar la operación. Inténtalo nuevamente.':error.message??'No se pudo completar la solicitud.'},{status:400,headers:{'Cache-Control':'no-store'}})}
})}}
