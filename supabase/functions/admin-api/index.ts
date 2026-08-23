import { corsHeaders, json } from '../_shared/cors.ts'
import { adminDb } from '../_shared/supabase.ts'
import { requireAdmin } from '../_shared/adminAuth.ts'

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
    const admin = await requireAdmin(req)
    const body = await req.json()
    const action = String(body.action ?? '')
    const db = adminDb()

    if (action === 'me') return json(req, { admin })

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
        .select('id,created_at,amount,currency,status,receipt_url,payer_name,payer_reference,profiles(email),test_products(name),coupons(code)')
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
      const {data:payment,error:pe}=await db.from('payments').update({status,paid_at:status==='PAID'?new Date().toISOString():null,reviewed_at:new Date().toISOString(),reviewed_by:admin.id}).eq('id',id).select('id,user_id,product_id').single()
      if(pe)throw pe
      if(status==='PAID'){
        const {data:existing}=await db.from('test_entitlements').select('id').eq('payment_id',id).maybeSingle()
        if(!existing){const {error}=await db.from('test_entitlements').insert({user_id:payment.user_id,product_id:payment.product_id,payment_id:id,status:'AVAILABLE'});if(error)throw error}
      }
      await db.from('admin_audit_log').insert({admin_id:admin.id,action:'PAYMENT_'+status,entity:'payments',entity_id:id})
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
