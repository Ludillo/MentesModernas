import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'
import { escapeHtml, sendEmail } from '../_shared/email.ts'

async function count(db:any, table:string, filter?: (q:any)=>any) {
  let q = db.from(table).select('*', { count:'exact', head:true })
  if (filter) q = filter(q)
  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error:'Method not allowed' }, 405)

  try {
    const tokenAdmin = await requireAdmin(req)
    const body = await req.json()
    const action = String(body.action ?? '')
    const db = adminDb()
    const {data:activeAdmin,error:activeAdminError}=await db.from('admin_users').select('id,email,display_name,role,is_active').eq('id',tokenAdmin.id).maybeSingle()
    if(activeAdminError)throw activeAdminError
    if(!activeAdmin?.is_active)return json(req,{error:'La cuenta administrativa ya no está activa.'},403)
    const admin={id:activeAdmin.id,email:activeAdmin.email,name:activeAdmin.display_name,role:activeAdmin.role}

    if (action === 'me') return json(req, { admin })

    if(action==='admins-list'){
      if(admin.role!=='SUPERADMIN')return json(req,{error:'Solo un superadministrador puede gestionar accesos.'},403)
      const {data,error}=await db.from('admin_users').select('id,email,display_name,role,is_active,auth_provider,last_login_at,created_at').order('created_at');if(error)throw error
      return json(req,{items:data})
    }

    if(action==='admin-create'){
      if(admin.role!=='SUPERADMIN')return json(req,{error:'Solo un superadministrador puede agregar administradores.'},403)
      const email=String(body.email??'').trim().toLowerCase(),displayName=String(body.displayName??'').trim(),role=String(body.role??'ADMIN')
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!displayName)return json(req,{error:'Correo y nombre son obligatorios.'},400)
      if(!['ADMIN','SUPERADMIN'].includes(role))return json(req,{error:'Rol no válido.'},400)
      const {data,error}=await db.from('admin_users').upsert({email,display_name:displayName,role,is_active:true,auth_provider:'google',password_hash:null,updated_at:new Date().toISOString()},{onConflict:'email'}).select('id').single();if(error)throw error
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'ADMIN_CREATE',entity:'admin_users',entity_id:data.id,payload:{email,role}})
      return json(req,{ok:true})
    }

    if(action==='admin-toggle'){
      if(admin.role!=='SUPERADMIN')return json(req,{error:'Solo un superadministrador puede cambiar accesos.'},403)
      const id=String(body.id??''),isActive=Boolean(body.isActive)
      if(id===admin.id&&!isActive)return json(req,{error:'No puedes desactivar tu propia cuenta.'},400)
      const {error}=await db.from('admin_users').update({is_active:isActive,updated_at:new Date().toISOString()}).eq('id',id);if(error)throw error
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:isActive?'ADMIN_ENABLE':'ADMIN_DISABLE',entity:'admin_users',entity_id:id})
      return json(req,{ok:true})
    }

    if (action === 'dashboard') {
      const startToday = new Date(); startToday.setUTCHours(0,0,0,0)
      const d30 = new Date(Date.now()-30*86400000).toISOString()
      const [visitsToday,visits30d,paidPayments,unreadContacts,completedPremium,totalProfiles] = await Promise.all([
        count(db,'page_visits',q=>q.gte('visited_at',startToday.toISOString())),
        count(db,'page_visits',q=>q.gte('visited_at',d30)),
        count(db,'payments',q=>q.eq('status','PAID')),
        count(db,'contact_messages',q=>q.eq('status','NEW')),
        count(db,'evaluations'),
        count(db,'profiles')
      ])
      return json(req,{visitsToday,visits30d,paidPayments,unreadContacts,completedPremium,totalProfiles})
    }

    if (action === 'content-list') {
      const { data, error } = await db.from('site_content').select('key,value,is_active,updated_at').order('key')
      if(error)throw error
      return json(req,{items:data})
    }

    if (action === 'content-update') {
      const key=String(body.key??''); const value=body.value
      if(!key || typeof value!=='object') return json(req,{error:'Contenido inválido'},400)
      const { error } = await db.from('site_content').upsert({
        key,value,is_active:true,updated_at:new Date().toISOString(),updated_by:admin.id
      })
      if(error)throw error
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'CONTENT_UPDATE',entity:'site_content',entity_id:key,payload:value})
      return json(req,{ok:true})
    }

    if (action === 'payments-list') {
      const { data, error } = await db.from('payments')
        .select('id,created_at,amount,currency,status,receipt_url,payer_name,payer_reference,provider_transaction_id,provider_status,provider_checked_at,profiles(email),test_products(name),coupons(code)')
        .order('created_at',{ascending:false}).limit(500)
      if(error)throw error
      const items=await Promise.all((data??[]).map(async(x:any)=>{
        let receipt_url=x.receipt_url
        if(receipt_url){const {data:signed}=await db.storage.from('payment-receipts').createSignedUrl(receipt_url,900);receipt_url=signed?.signedUrl??receipt_url}
        return {...x,receipt_url,email:x.profiles?.email,product_name:x.test_products?.name,coupon_code:x.coupons?.code}
      }))
      return json(req,{items})
    }

    if (action === 'payment-review') {
      const id=String(body.id??''), status=String(body.status??'')
      if(!['PAID','FAILED','CANCELLED'].includes(status))return json(req,{error:'Estado inválido'},400)
      const {data:current,error:currentError}=await db.from('payments').select('provider_transaction_id').eq('id',id).single()
      if(currentError)throw currentError
      if(current.provider_transaction_id&&status==='PAID')return json(req,{error:'Un pago QR solo puede aprobarse mediante confirmación de la API bancaria.'},409)
      const {data:payment,error:pe}=await db.from('payments').update({status,paid_at:status==='PAID'?new Date().toISOString():null,reviewed_at:new Date().toISOString(),reviewed_by:admin.id}).eq('id',id).select('id,user_id,product_id,profiles(email),test_products(name)').single()
      if(pe)throw pe
      if(status==='PAID'){
        const {data:existing}=await db.from('test_entitlements').select('id').eq('payment_id',id).maybeSingle()
        if(!existing){const {error}=await db.from('test_entitlements').insert({user_id:payment.user_id,product_id:payment.product_id,payment_id:id,status:'AVAILABLE'});if(error)throw error}
      }
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'PAYMENT_'+status,entity:'payments',entity_id:id})
      const userEmail=(payment as any).profiles?.email
      if(userEmail) await sendEmail({
        to:[userEmail],
        subject:status==='PAID'?'Tu pago fue aprobado — MentesModernas':'Actualización de tu comprobante — MentesModernas',
        html:status==='PAID'
          ?`<h2>Tu pago fue aprobado</h2><p>Ya puedes ingresar a <b>${escapeHtml((payment as any).test_products?.name)}</b> desde tu cuenta en MentesModernas.</p>`
          :`<h2>No pudimos aprobar tu comprobante</h2><p>El comprobante asociado a <b>${escapeHtml((payment as any).test_products?.name)}</b> no pudo validarse. Revisa los datos y vuelve a enviarlo o comunícate con soporte.</p>`
      })
      return json(req,{ok:true})
    }

    if(action==='users-list'){
      const {data,error}=await db.from('profiles').select('id,email,full_name,created_at').order('created_at',{ascending:false}).limit(500);if(error)throw error;return json(req,{items:data})
    }

    if(action==='access-grant'){
      const email=String(body.email??'').trim().toLowerCase(), productCode=String(body.productCode??'')
      const {data:user}=await db.from('profiles').select('id').ilike('email',email).single()
      const {data:product}=await db.from('test_products').select('id').eq('code',productCode).eq('access_level','PREMIUM').single()
      if(!user||!product)return json(req,{error:'Usuario o test no encontrado'},404)
      const {error}=await db.from('test_entitlements').insert({user_id:user.id,product_id:product.id,payment_id:null,status:'AVAILABLE'});if(error)throw error
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'ACCESS_GRANT',entity:'test_entitlements',payload:{email,productCode}});return json(req,{ok:true})
    }

    if(action==='tests-list'){
      const {data,error}=await db.from('test_types').select('*,test_versions(*,test_questions(count),test_products(*))').order('sort_order');if(error)throw error;return json(req,{items:data})
    }

    if(action==='question-save'){
      const item=body.item as any
      const {error}=await db.from('test_questions').upsert({id:item.id||undefined,test_version_id:item.testVersionId,number:Number(item.number),dimension_code:String(item.dimensionCode),prompt:String(item.prompt),weight:Number(item.weight||1),is_active:item.isActive!==false});if(error)throw error;return json(req,{ok:true})
    }

    if(action==='product-price-update'){
      const productCode=String(body.productCode??'').trim().toUpperCase(),price=Number(body.price),currency=String(body.currency??'BOB').trim().toUpperCase()
      if(!productCode||!Number.isFinite(price)||price<=0)return json(req,{error:'Código y monto mayor a cero son obligatorios'},400)
      if(!['BOB','USD'].includes(currency))return json(req,{error:'Moneda no válida'},400)
      const {data,error}=await db.from('test_products').update({price,currency}).eq('code',productCode).eq('access_level','PREMIUM').select('id').single();if(error)throw error
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'PRODUCT_PRICE_UPDATE',entity:'test_products',entity_id:data.id,payload:{productCode,price,currency}})
      return json(req,{ok:true})
    }

    if(action==='coupon-toggle'){
      const {error}=await db.from('coupons').update({is_active:Boolean(body.isActive)}).eq('id',String(body.id));if(error)throw error;return json(req,{ok:true})
    }

    if (action === 'contacts-list') {
      const { data,error }=await db.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(500)
      if(error)throw error
      return json(req,{items:data})
    }

    if (action === 'contact-status') {
      const { error }=await db.from('contact_messages').update({status:String(body.status)}).eq('id',String(body.id))
      if(error)throw error
      return json(req,{ok:true})
    }

    if (action === 'analytics-summary') {
      const now=Date.now(), day=86400000
      const d1=new Date(now-day).toISOString(),d7=new Date(now-7*day).toISOString(),d30=new Date(now-30*day).toISOString()
      const [today,last7d,last30d] = await Promise.all([
        count(db,'page_visits',q=>q.gte('visited_at',d1)),
        count(db,'page_visits',q=>q.gte('visited_at',d7)),
        count(db,'page_visits',q=>q.gte('visited_at',d30))
      ])
      const { data: recent,error }=await db.from('page_visits').select('visitor_id,path').gte('visited_at',d30).limit(10000)
      if(error)throw error
      const unique30d=new Set((recent??[]).map((x:any)=>x.visitor_id).filter(Boolean)).size
      const map=new Map<string,number>()
      for(const x of recent??[])map.set(x.path,(map.get(x.path)||0)+1)
      const topPages=[...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([path,views])=>({path,views}))
      return json(req,{today,last7d,last30d,unique30d,topPages})
    }

    if (action === 'coupons-list') {
      const {data,error}=await db.from('coupons').select('*').order('created_at',{ascending:false})
      if(error)throw error
      return json(req,{items:data})
    }

    if (action === 'coupon-create') {
      const code=String(body.code??'').trim().toUpperCase()
      const discount=Number(body.discountPercent??0)
      if(!code || discount<0 || discount>100)return json(req,{error:'Cupón inválido'},400)
      const { data: product }=await db.from('test_products').select('id').eq('code','VOCATIONAL_PREMIUM').single()
      const {error}=await db.from('coupons').insert({
        code,discount_type:discount>=100?'FREE':'PERCENTAGE',discount_value:discount,
        product_id:product?.id,max_uses:Number(body.maxUses??1),is_active:true
      })
      if(error)throw error
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'COUPON_CREATE',entity:'coupons',entity_id:code})
      return json(req,{ok:true})
    }

    if (action === 'change-email') {
      const {data,error}=await db.rpc('admin_change_email',{
        p_admin_id:admin.id,p_password:String(body.currentPassword??''),p_new_email:String(body.newEmail??'')
      })
      if(error)throw error
      if(data!==true)return json(req,{error:'La contraseña actual no es correcta.'},400)
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'EMAIL_CHANGE',entity:'admin_users',entity_id:admin.id,payload:{newEmail:String(body.newEmail??'')}})
      return json(req,{ok:true})
    }

    if (action === 'change-password') {
      const {data,error}=await db.rpc('admin_change_password',{
        p_admin_id:admin.id,p_current:String(body.currentPassword??''),p_new:String(body.newPassword??'')
      })
      if(error)throw error
      if(data!==true)return json(req,{error:'La contraseña actual no es correcta.'},400)
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'PASSWORD_CHANGE',entity:'admin_users',entity_id:admin.id})
      return json(req,{ok:true})
    }

    return json(req,{error:'Acción no soportada'},400)
  } catch(e) {
    console.error(e)
    return json(req,{error:'Sesión inválida o error administrativo.'},401)
  }
})
