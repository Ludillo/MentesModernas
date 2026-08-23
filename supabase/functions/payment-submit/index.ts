import { corsHeaders,json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
 if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
 try{
  const {user,db}=await requireUser(req);const form=await req.formData();const file=form.get('receipt') as File|null;const productCode=String(form.get('productCode')||'');
  if(!file||!['image/jpeg','image/png','application/pdf'].includes(file.type)||file.size>5_000_000)return json(req,{error:'Adjunta JPG, PNG o PDF de hasta 5 MB.'},400)
  const ext=file.name.split('.').pop()?.replace(/[^a-z0-9]/gi,'')||'bin',path=`${user.id}/${crypto.randomUUID()}.${ext}`
  const {error:up}=await db.storage.from('payment-receipts').upload(path,await file.arrayBuffer(),{contentType:file.type});if(up)throw up
  const {data,error}=await db.rpc('create_pending_payment',{p_user_id:user.id,p_product_code:productCode,p_payer_name:String(form.get('payerName')||''),p_reference:String(form.get('reference')||''),p_receipt_url:path});if(error)throw error
  return json(req,{ok:true,paymentId:data,status:'PENDING'})
 }catch(e:any){return json(req,{error:e.message||'No se pudo enviar el comprobante.'},400)}
})
