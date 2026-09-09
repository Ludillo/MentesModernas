import { corsHeaders,json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'
import { escapeHtml, sendEmail } from '../_shared/email.ts'
function bytesToBase64(bytes:Uint8Array){let binary='';const size=0x8000;for(let i=0;i<bytes.length;i+=size)binary+=String.fromCharCode(...bytes.subarray(i,i+size));return btoa(binary)}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(req)})
 if(req.method!=='POST')return json(req,{error:'Method not allowed'},405)
 try{
  const {user,db}=await requireUser(req);const form=await req.formData();const file=form.get('receipt') as File|null;const productCode=String(form.get('productCode')||'');
  if(!file||!['image/jpeg','image/png','application/pdf'].includes(file.type)||file.size>5_000_000)return json(req,{error:'Adjunta JPG, PNG o PDF de hasta 5 MB.'},400)
  const ext=file.name.split('.').pop()?.replace(/[^a-z0-9]/gi,'')||'bin',path=`${user.id}/${crypto.randomUUID()}.${ext}`
  const fileBytes=new Uint8Array(await file.arrayBuffer())
  const {error:up}=await db.storage.from('payment-receipts').upload(path,fileBytes,{contentType:file.type});if(up)throw up
  const payerName=String(form.get('payerName')||''), reference=String(form.get('reference')||'')
  const {data,error}=await db.rpc('create_pending_payment',{p_user_id:user.id,p_product_code:productCode,p_payer_name:payerName,p_reference:reference,p_receipt_url:path});if(error)throw error
  const {data:admins}=await db.from('admin_users').select('email').eq('is_active',true)
  const configuredEmail=Deno.env.get('ADMIN_NOTIFICATION_EMAIL')
  const recipients=[...(admins??[]).map((x:any)=>x.email).filter(Boolean),...(configuredEmail?[configuredEmail]:[])]
    .filter((email,index,list)=>list.indexOf(email)===index)
  const notificationSent=await sendEmail({
    to:recipients,
    subject:'Nuevo comprobante de pago pendiente — MentesModernas',
    html:`<h2>Nuevo comprobante recibido</h2><p>Un usuario envió un pago que requiere revisión.</p><ul><li><b>Usuario:</b> ${escapeHtml(user.email)}</li><li><b>Producto:</b> ${escapeHtml(productCode)}</li><li><b>Pagador:</b> ${escapeHtml(payerName||'No indicado')}</li><li><b>Referencia:</b> ${escapeHtml(reference||'No indicada')}</li></ul><p>El comprobante está adjunto a este correo. Ingresa al panel administrativo, abre <b>Pagos</b> y selecciona <b>Aprobar pago</b> o <b>Rechazar</b>.</p>`,
    attachments:[{name:file.name.replace(/[^a-zA-Z0-9._-]/g,'_'),content:bytesToBase64(fileBytes)}]
  })
  if(user.email)await sendEmail({to:[user.email],subject:'Recibimos tu comprobante — MentesModernas',html:`<h2>Tu comprobante está en revisión</h2><p>Gracias por enviar tu pago para <b>${escapeHtml(productCode)}</b>.</p><p>Te informaremos en tu cuenta cuando termine la revisión. No necesitas enviarlo nuevamente.</p>`})
  return json(req,{ok:true,paymentId:data,status:'PENDING',notificationSent})
 }catch(e:any){return json(req,{error:e.message||'No se pudo enviar el comprobante.'},400)}
})
