import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
  try{
    const admin=await requireAdmin(req)
    const form=await req.formData()
    const file=form.get('file')
    if(!(file instanceof File))return json(req,{error:'Archivo requerido'},400)
    if(file.size>2_000_000)return json(req,{error:'El logo no debe superar 2 MB'},400)
    if(!file.type.startsWith('image/'))return json(req,{error:'Formato no permitido'},400)

    const db=adminDb()
    const ext=(file.name.split('.').pop()||'png').replace(/[^a-z0-9]/gi,'')
    const path=`logo-${Date.now()}.${ext}`
    const bytes=new Uint8Array(await file.arrayBuffer())
    const {error}=await db.storage.from('branding').upload(path,bytes,{contentType:file.type,upsert:true})
    if(error)throw error
    const {data:pub}=db.storage.from('branding').getPublicUrl(path)

    const {data:current}=await db.from('site_content').select('value').eq('key','brand').maybeSingle()
    const value={...(current?.value??{}),logo_url:pub.publicUrl}
    await db.from('site_content').upsert({key:'brand',value,is_active:true,updated_at:new Date().toISOString(),updated_by:admin.id})
    await db.from('admin_audit_log').insert({admin_id:admin.id,action:'LOGO_UPLOAD',entity:'site_content',entity_id:'brand',payload:{url:pub.publicUrl}})
    return json(req,{ok:true,url:pub.publicUrl})
  }catch(e){console.error(e);return json(req,{error:'No se pudo subir el logo'},401)}
})
