import { corsHeaders, json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'

const configuredApi=(Deno.env.get('ARPALSOFT_QR_API_URL')||'https://api.arpalsoft.com').trim()
const apiBase=configuredApi.replace(/\/v1\/mentes-modernas\/qrs\/?$/,'').replace(/\/$/,'')
const apiToken=()=>{const value=Deno.env.get('ARPALSOFT_QR_API_TOKEN');if(!value)throw new Error('La integración QR no está configurada');return value}
async function provider(path:string,init:RequestInit={}){
  const response=await fetch(`${apiBase}${path}`,{...init,headers:{'Content-Type':'application/json','X-Client-Token':apiToken(),...(init.headers||{})}})
  const body=await response.json().catch(()=>({error:'Respuesta inválida del proveedor QR'}))
  if(!response.ok)throw new Error(body?.error||'No se pudo comunicar con el proveedor QR')
  return body
}

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(req)})
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
  try{
    const {user,db}=await requireUser(req);const body=await req.json();const action=String(body.action||'')
    if(action==='generate'){
      const productCode=String(body.productCode||'').trim().toUpperCase()
      const {data,error}=await db.rpc('create_qr_payment',{p_user_id:user.id,p_product_code:productCode})
      if(error)throw error
      const payment=data?.[0];if(!payment)throw new Error('No se pudo crear la solicitud de pago')
      try{
        const dueDate=new Date(Date.now()+24*60*60*1000).toISOString().slice(0,10)
        const qr=await provider('/v1/mentes-modernas/qrs',{method:'POST',body:JSON.stringify({sessionId:payment.session_id,amount:Number(payment.amount),currency:payment.currency,description:`Pago de test ${payment.product_name}`.slice(0,100),dueDate,singleUse:true,modifyAmount:false,branchCode:'01'})})
        const {error:updateError}=await db.from('payments').update({transaction_reference:`QR-${qr.transactionId}`,provider_transaction_id:String(qr.transactionId),provider_qr_id:String(qr.qrId||''),provider_status:String(qr.status||'pending'),qr_payload:qr.qrImage||null,callback_response:qr}).eq('id',payment.payment_id).eq('user_id',user.id)
        if(updateError)throw updateError
        return json(req,{paymentId:payment.payment_id,amount:payment.amount,currency:payment.currency,productName:payment.product_name,transactionId:String(qr.transactionId),qrId:qr.qrId,qrImage:qr.qrImage,dueDate:qr.dueDate,status:'pending'})
      }catch(error){await db.from('payments').update({status:'FAILED',provider_status:'error',callback_response:{error:error instanceof Error?error.message:String(error)}}).eq('id',payment.payment_id);throw error}
    }
    if(action==='status'){
      const paymentId=String(body.paymentId||'')
      const {data:payment,error}=await db.from('payments').select('id,status,provider_transaction_id,provider_qr_id,qr_session_id').eq('id',paymentId).eq('user_id',user.id).single()
      if(error||!payment)throw new Error('Solicitud de pago no encontrada')
      if(payment.status==='PAID')return json(req,{paid:true,accessGranted:true,status:'paid'})
      if(payment.status!=='PENDING'||!payment.provider_transaction_id||!payment.qr_session_id)throw new Error('La solicitud no está disponible para verificación')
      const result=await provider(`/v1/mentes-modernas/qrs/${encodeURIComponent(payment.provider_transaction_id)}/status?sessionId=${encodeURIComponent(payment.qr_session_id)}`)
      await db.from('payments').update({provider_status:String(result.status||'pending'),provider_checked_at:new Date().toISOString(),callback_response:result}).eq('id',payment.id)
      if(result.paid!==true)return json(req,{paid:false,accessGranted:false,status:result.status||'pending',message:'El Banco Económico todavía no reporta este pago. Si acabas de pagar, espera un momento y vuelve a verificar.'})
      const {error:confirmError}=await db.rpc('confirm_verified_qr_payment',{p_user_id:user.id,p_payment_id:payment.id,p_transaction_id:payment.provider_transaction_id,p_qr_id:String(result.qrId||payment.provider_qr_id||''),p_provider_response:result})
      if(confirmError)throw confirmError
      return json(req,{paid:true,accessGranted:true,status:'paid'})
    }
    return json(req,{error:'Acción no válida'},400)
  }catch(error){return json(req,{error:error instanceof Error?error.message:String(error)},400)}
})
