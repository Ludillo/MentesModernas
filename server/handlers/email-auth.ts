import { Firestore, googleApi, account } from '../firestore'
import { hash, customToken, rateLimit } from '../auth'
import { env } from '../context'
import { sendEmail } from '../_shared/email'
export default async function emailAuth(req:Request){
  const b:any=(await req.json() as any),email=String(b.email??'').trim().toLowerCase()
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Correo inválido.')
  const db=new Firestore(),id=await hash(`${env().APP_SECRET}:${email}`)
  if(b.action==='send'){
    await rateLimit('email-send',5,3600)
    const bytes=crypto.getRandomValues(new Uint32Array(1)),code=String(bytes[0]%1000000).padStart(6,'0'),digest=await hash(`${env().APP_SECRET}:${email}:${code}`)
    await db.atomic(async tx=>{const old=await tx.get('email_codes',id);if(old&&Date.now()-old.issued_at<60000)throw Error('Espera un minuto antes de solicitar otro código.');await tx.put('email_codes',id,{id,digest,attempts:0,used:false,issued_at:Date.now(),expires_at:Date.now()+600000})})
    const sent=await sendEmail({to:[email],subject:'Tu código de acceso — MentesModernas',html:`<h2>Tu código es ${code}</h2><p>Es válido durante 10 minutos. No lo compartas.</p>`})
    if(!sent){await db.put('email_codes',id,{used:true},true);throw Error('No se pudo enviar el código. Inténtalo más tarde.')}
    return Response.json({ok:true})
  }
  if(b.action!=='verify'||!/^\d{6}$/.test(String(b.token)))throw Error('Código inválido.')
  await rateLimit('email-verify',20,3600)
  const digest=await hash(`${env().APP_SECRET}:${email}:${b.token}`)
  const valid=await db.atomic(async tx=>{const code=await tx.get('email_codes',id);if(!code||code.used||code.expires_at<Date.now()||code.attempts>=5)return false;const valid=code.digest===digest;await tx.put('email_codes',id,{attempts:code.attempts+1,used:valid},true);return valid})
  if(!valid)throw Error('El código es incorrecto o ha vencido.')
  const root=`https://identitytoolkit.googleapis.com/v1/projects/${account().project_id}/accounts`
  let user=(await googleApi(root+':lookup',{email:[email]})).users?.[0]
  if(user?.disabled)throw Error('Cuenta no disponible.')
  if(!user){try{user=await googleApi(root,{email,emailVerified:true})}catch{user=(await googleApi(root+':lookup',{email:[email]})).users?.[0];if(!user||user.disabled)throw Error('No se pudo crear la cuenta.')}}
  if(!user.emailVerified)await googleApi(root+':update',{localId:user.localId,emailVerified:true})
  return Response.json({token:await customToken(user.localId)})
}
