import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
  try{
    const b=await req.json()
    const name=String(b.name??'').trim().slice(0,150)
    const message=String(b.message??'').trim().slice(0,4000)
    const email=String(b.email??'').trim().slice(0,250)||null
    const phone=String(b.phone??'').trim().slice(0,50)||null
    if(name.length<2||message.length<5)return json(req,{error:'Completa nombre y mensaje.'},400)
    const db=adminDb()
    const {error}=await db.from('contact_messages').insert({name,email,phone,message})
    if(error)throw error
    return json(req,{ok:true})
  }catch(e){console.error(e);return json(req,{error:'No se pudo guardar el mensaje.'},500)}
})
