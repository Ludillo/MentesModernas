import { corsHeaders, json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
  if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
  try{
    const {user,db}=await requireUser(req)
    const b=await req.json()
    const productCode=String(b.productCode??'')
    const couponCode=b.couponCode?String(b.couponCode):null

    // TEMPORARY PAYMENT ADAPTER:
    // This RPC marks the demo payment as PAID and creates an AVAILABLE entitlement.
    // Replace only this function when the QR provider and callback API are ready.
    const {data,error}=await db.rpc('create_demo_entitlement',{
      p_user_id:user.id,p_product_code:productCode,p_coupon_code:couponCode
    })
    if(error)throw error
    return json(req,{paid:true,detail:data?.[0]??null})
  }catch(e:any){
    console.error(e)
    return json(req,{paid:false,error:e.message??'No se pudo validar el pago'},400)
  }
})
