import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'

Deno.serve(async(req)=>{
  
  if (req.method === 'OPTIONS') {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req)
  })
}
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
  try{
    const b=await req.json()
    const path=String(b.path??'/').slice(0,500)
    const visitorId=/^[0-9a-f-]{36}$/i.test(String(b.visitorId??''))?String(b.visitorId):null
    const db=adminDb()
    await db.from('page_visits').insert({
      visitor_id:visitorId,path,
      referrer:String(b.referrer??'').slice(0,1000)||null,
      user_agent:String(b.userAgent??'').slice(0,1000)||null
    })
    return json(req,{ok:true})
  }catch(e){console.error(e);return json(req,{ok:true})}
})
