import { corsHeaders,json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'
import { escapeHtml, sendEmail } from '../_shared/email.ts'
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
 if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
 try{
  const {user,db}=await requireUser(req);const form=await req.formData();const file=form.get('receipt') as File|null;const productCode=String(form.get('productCode')||'');
  if(!file||!['image/jpeg','image/png','application/pdf'].includes(file.type)||file.size>5_000_000)return json(req,{error:'Adjunta JPG, PNG o PDF de hasta 5 MB.'},400)
  const ext=file.name.split('.').pop()?.replace(/[^a-z0-9]/gi,'')||'bin',path=`${user.id}/${crypto.randomUUID()}.${ext}`
  const {error:up}=await db.storage.from('payment-receipts').upload(path,await file.arrayBuffer(),{contentType:file.type});if(up)throw up
  const payerName=String(form.get('payerName')||''), reference=String(form.get('reference')||'')
  const {data,error}=await db.rpc('create_pending_payment',{p_user_id:user.id,p_product_code:productCode,p_payer_name:payerName,p_reference:reference,p_receipt_url:path});if(error)throw error
  const {data:admins}=await db.from('admin_users').select('email').eq('is_active',true)
  const notificationSent=await sendEmail({
    to:(admins??[]).map((x:any)=>x.email).filter(Boolean),
    subject:'Nuevo comprobante de pago pendiente — MentesModernas',
    html:`<h2>Nuevo comprobante recibido</h2><p>Un usuario envió un pago que requiere revisión.</p><ul><li><b>Usuario:</b> ${escapeHtml(user.email)}</li><li><b>Producto:</b> ${escapeHtml(productCode)}</li><li><b>Pagador:</b> ${escapeHtml(payerName||'No indicado')}</li><li><b>Referencia:</b> ${escapeHtml(reference||'No indicada')}</li></ul><p>Ingresa al panel administrativo, abre <b>Pagos</b> y selecciona <b>Aprobar pago</b> o <b>Rechazar</b>.</p>`
  })
  return json(req,{ok:true,paymentId:data,status:'PENDING',notificationSent})
 }catch(e:any){return json(req,{error:e.message||'No se pudo enviar el comprobante.'},400)}
})
