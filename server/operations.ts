import { Firestore } from './firestore'
const now=()=>new Date().toISOString()
const uid=()=>crypto.randomUUID()
async function product(db:Firestore,code:string){const p=(await db.list('test_products',['code',String(code).trim().toUpperCase()])).find(p=>p.is_active&&p.access_level==='PREMIUM');if(!p||!Number.isFinite(Number(p.price))||Number(p.price)<=0)throw Error('Producto avanzado no disponible.');return p}
export async function confirmPayment(db:Firestore,paymentId:string,options:{userId?:string;transactionId?:string;provider?:any;adminId?:string;status?:string}) {
  return db.atomic(async tx=>{
    const p=await tx.get('payments',paymentId);if(!p||(options.userId&&p.user_id!==options.userId))throw Error('Pago no encontrado.')
    const status=options.status??'PAID'
    const existing=(await tx.list('test_entitlements',['payment_id',p.id]))[0]
    if(p.status==='PAID'){if(status!=='PAID')throw Error('Un pago aprobado no puede modificarse.');return existing?.id}
    if(p.status!=='PENDING')throw Error('La solicitud ya no está pendiente.')
    if(p.provider_transaction_id&&status==='PAID'){
      const r=options.provider
      if(!r||r.paid!==true||!options.transactionId||p.provider_transaction_id!==options.transactionId)throw Error('La aprobación requiere confirmación bancaria.')
      if(r.amount!==undefined&&Number(r.amount)!==Number(p.amount)||r.currency!==undefined&&r.currency!==p.currency||r.transactionId!==undefined&&String(r.transactionId)!==p.provider_transaction_id||r.qrId&&p.provider_qr_id&&String(r.qrId)!==String(p.provider_qr_id))throw Error('La confirmación bancaria no coincide.')
    }else if(!options.adminId&&status==='PAID')throw Error('Revisión administrativa requerida.')
    const id=existing?.id??`payment-${p.id}`
    await tx.put('payments',p.id,{status,paid_at:status==='PAID'?now():null,reviewed_at:now(),...(options.adminId?{reviewed_by:options.adminId}:{}),...(options.provider?{provider_status:'paid',provider_checked_at:now(),callback_response:options.provider,...(options.provider.qrId?{provider_qr_id:String(options.provider.qrId)}:{})}:{})},true)
    if(status==='PAID'&&!existing)await tx.put('test_entitlements',id,{id,user_id:p.user_id,product_id:p.product_id,payment_id:p.id,status:'AVAILABLE',created_at:now()},false,true)
    return id
  })
}
export async function rpc(name:string,a:any,user?:any):Promise<any>{
  const db=new Firestore()
  if(name==='get_test_catalog'){
    const [types,versions,products]=await Promise.all([db.list('test_types'),db.list('test_versions',['is_active',true]),db.list('test_products',['is_active',true])])
    return types.filter(t=>['ACTIVE','COMING_SOON'].includes(t.status)).sort((a,b)=>a.sort_order-b.sort_order).map(t=>{const v=versions.filter(v=>v.test_type_id===t.id),f=v.find(v=>v.access_level==='FREE'),p=v.find(v=>v.access_level==='PREMIUM'),price=products.find(x=>x.test_version_id===p?.id&&x.access_level==='PREMIUM');return {type_code:t.code,name:t.name,description:t.description,icon:t.icon,status:t.status,free_code:f?.code??null,free_questions:f?.question_count??0,premium_code:p?.code??null,premium_questions:p?.question_count??0,price:Number(price?.price??0),currency:price?.currency??'BOB'}})
  }
  if(name==='get_active_test_questions'){
    const v=(await db.list('test_versions',['code',a.p_test_code])).find(v=>v.is_active);if(!v)throw Error('Test no encontrado.')
    if(v.access_level==='PREMIUM'){
      if(!user)throw Error('Inicia sesión para continuar.')
      const products=await db.list('test_products',['test_version_id',v.id]),access=await db.list('test_entitlements',['user_id',user.id])
      if(!access.some(e=>e.status==='AVAILABLE'&&products.some(p=>p.id===e.product_id)))throw Error('No existe un acceso avanzado disponible.')
    }
    return (await db.list('test_questions',['test_version_id',v.id])).filter(q=>q.is_active).sort((a,b)=>a.number-b.number).map(({id,test_version_id,number,dimension_code,prompt,is_active})=>({id,test_version_id,number,dimension_code,prompt,is_active}))
  }
  if(name==='get_public_test_stats'){
    const [events,feedback]=await Promise.all([db.list('test_completion_events'),db.list('test_feedback')]);return [{completed_tests:events.length,survey_responses:feedback.length,helpful_percentage:feedback.length?Math.round(feedback.filter(f=>f.helpful).length/feedback.length*100):0,average_clarity:feedback.length?Math.round(feedback.reduce((s,f)=>s+f.clarity,0)/feedback.length*10)/10:0}]
  }
  if(name==='record_test_completion'||name==='submit_test_feedback'){
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(a.p_test_code)||!/^[0-9a-f-]{36}$/i.test(a.p_visitor_id))throw Error('Datos inválidos.')
    const version=(await db.list('test_versions',['code',a.p_test_code])).find(v=>v.is_active);if(!version)throw Error('Test no válido.')
    if(a.p_evaluation_id){const evaluation=await db.get('evaluations',String(a.p_evaluation_id));if(!user||evaluation?.user_id!==user.id)throw Error('Resultado no disponible.')}
    const table=name==='record_test_completion'?'test_completion_events':'test_feedback'
    return db.atomic(async tx=>{
      const existing=(await tx.list(table,['visitor_id',a.p_visitor_id])).find(x=>x.test_code===a.p_test_code)
      if(table==='test_completion_events'&&existing)return null
      if(table==='test_feedback'&&(typeof a.p_helpful!=='boolean'||!Number.isInteger(a.p_clarity)||a.p_clarity<1||a.p_clarity>5))throw Error('Valoración inválida.')
      const id=String(existing?.id??`${a.p_test_code}-${a.p_visitor_id}`)
      await tx.put(table,id,{id,test_code:a.p_test_code,visitor_id:a.p_visitor_id,...(table==='test_feedback'?{helpful:a.p_helpful,clarity:a.p_clarity,evaluation_id:a.p_evaluation_id??existing?.evaluation_id??null,created_at:now()}:{completed_at:now()})});return null
    })
  }
  if(name==='create_qr_payment'||name==='create_pending_payment'){
    return db.atomic(async tx=>{const p=await product(tx,a.p_product_code),id=uid(),sid=uid(),qr=name==='create_qr_payment'
      await tx.put('payments',id,{id,user_id:a.p_user_id,product_id:p.id,transaction_reference:`${qr?'QR-REQUEST':'MANUAL'}-${uid()}`,amount:Number(p.price),currency:p.currency,status:'PENDING',created_at:now(),...(qr?{qr_session_id:sid,provider_status:'CREATING',branch_code:'01'}:{payer_name:String(a.p_payer_name).slice(0,200),payer_reference:String(a.p_reference).slice(0,200),receipt_url:a.p_receipt_url})},false,true)
      return qr?[{payment_id:id,session_id:sid,amount:Number(p.price),currency:p.currency,product_name:p.name}]:id
    })
  }
  if(name==='confirm_verified_qr_payment')return confirmPayment(db,a.p_payment_id,{userId:a.p_user_id,transactionId:a.p_transaction_id,provider:a.p_provider_response})
  if(name==='redeem_coupon_access')return db.atomic(async tx=>{
    const p=await product(tx,a.p_product_code),code=String(a.p_coupon_code).trim().toUpperCase(),c=(await tx.list('coupons',['code',code]))[0]
    if(!c||!c.is_active||c.valid_from>now()||c.valid_until&&c.valid_until<=now()||c.product_id&&c.product_id!==p.id)throw Error('Cupón inválido, vencido o no aplicable.')
    if(c.max_uses!==null&&c.max_uses!==undefined&&Number(c.uses_count)>=Number(c.max_uses))throw Error('Este cupón ya fue utilizado.')
    if(c.discount_type!=='FREE'&&!(c.discount_type==='PERCENTAGE'&&Number(c.discount_value)>=100))throw Error('El cupón no cubre el acceso completo.')
    const redemptions=await tx.list('coupon_redemptions',['coupon_id',c.id]);if(redemptions.some(r=>r.user_id===a.p_user_id))throw Error('Ya utilizaste este cupón.')
    const paymentId=uid(),id=`coupon-${c.id}-${a.p_user_id}`,date=now()
    await tx.put('coupons',c.id,{uses_count:Number(c.uses_count??0)+1},true)
    await tx.put('payments',paymentId,{id:paymentId,user_id:a.p_user_id,product_id:p.id,coupon_id:c.id,transaction_reference:`COUPON-${uid()}`,amount:0,currency:p.currency,status:'PAID',paid_at:date,created_at:date,provider_status:'coupon'},false,true)
    await tx.put('coupon_redemptions',id,{id,coupon_id:c.id,user_id:a.p_user_id,payment_id:paymentId,created_at:date},false,true)
    await tx.put('test_entitlements',id,{id,user_id:a.p_user_id,product_id:p.id,payment_id:paymentId,status:'AVAILABLE',created_at:date},false,true)
    return id
  })
  if(name==='finalize_premium_evaluation')return db.atomic(async tx=>{
    const submissionId=`${a.p_user_id}-${a.p_request_id}`,previous=await tx.get('submissions',submissionId)
    if(previous)return previous.evaluation_id
    const p=await product(tx,a.p_test_code),v=await tx.get('test_versions',p.test_version_id)
    if(!v?.is_active)throw Error('Versión no disponible.')
    const available=(await tx.list('test_entitlements',['user_id',a.p_user_id])).filter(e=>e.product_id===p.id&&e.status==='AVAILABLE').sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)))
    const access=available[0];if(!access)throw Error('No tienes un acceso avanzado disponible.')
    const id=`evaluation-${access.id}`,date=now()
    await tx.put('evaluations',id,{id,user_id:a.p_user_id,test_type_id:v.test_type_id,test_version_id:v.id,entitlement_id:access.id,answers:a.p_answers,scores:a.p_scores,result_json:a.p_result,created_at:date,completed_at:date},false,true)
    await tx.put('test_entitlements',String(access.id),{status:'CONSUMED',evaluation_id:id,consumed_at:date},true)
    await tx.put('submissions',submissionId,{id:submissionId,user_id:a.p_user_id,evaluation_id:id,created_at:date},false,true)
    return id
  }).catch(async error=>{const previous=await db.get('submissions',`${a.p_user_id}-${a.p_request_id}`);if(previous)return previous.evaluation_id;throw error})
  throw Error('Operación no permitida.')
}
