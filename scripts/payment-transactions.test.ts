// Integration checks use temporary records and a mocked bank, never real transfers.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import worker from '../server/index'
import { context } from '../server/context'
import { Firestore } from '../server/firestore'
import { confirmPayment } from '../server/operations'
import { paymentErrorMessage } from '../shared/payment-errors'
import { hash } from '../server/auth'
const credentialFile=process.env.MM_FIREBASE_CREDENTIAL_FILE
if(!credentialFile)throw Error('Set MM_FIREBASE_CREDENTIAL_FILE to a private service account file.')
const credentials=readFileSync(credentialFile,'utf8'),app=initializeApp({credential:cert(JSON.parse(credentials))}),db=getFirestore(app),auth=getAuth(app)
const uid=`qa-bank-${randomUUID()}`,requestIds:string[]=[],fetchOriginal=globalThis.fetch,config=JSON.parse(readFileSync('mentesmodernas.config','utf8'))
const env:any={FIREBASE_SERVICE_ACCOUNT:credentials,APP_SECRET:randomUUID()+randomUUID(),ARPALSOFT_QR_API_URL:'https://bank.test.invalid',ARPALSOFT_QR_API_TOKEN:'mock-only',BREVO_API_KEY:'mock-only',BREVO_FROM_EMAIL:'qa@example.invalid'}
let token='',paid=false,wrongAmount=false,emailCode='',bankError=false,invalidQr=false,wrongQr=false,invalidStatus=false
globalThis.fetch=async(input:any,init:any)=>{
  if(String(input)==='https://api.brevo.com/v3/smtp/email'){const body=JSON.parse(init.body);emailCode=body.htmlContent.match(/\d{6}/)[0];return Response.json({messageId:'mock-email'})}
  if(String(input).startsWith('https://bank.test.invalid/')){
    if(bankError)return Response.json({error:{message:'El banco está temporalmente ocupado.'}},{status:503})
    if(init?.method==='POST'&&invalidQr)return Response.json({transactionId:'QA-invalid',qrImage:{result:'invalid'}})
    if(init?.method==='POST'){const b=JSON.parse(init.body);assert.equal(b.amount,45);assert.equal(b.currency,'BOB');assert.equal(b.modifyAmount,false);return Response.json({transactionId:'QA-'+randomUUID(),qrId:'QA-QR',qrImage:'data:image/png;base64,QA',status:'pending'})}
    return Response.json({paid:invalidStatus?'true':paid,status:paid?'paid':'pending',amount:wrongAmount?1:45,currency:'BOB',qrId:wrongQr?'OTHER-QR':'QA-QR'})
  }
  return fetchOriginal(input,init)
}
async function call(body:any){const response=await worker.fetch(new Request('https://test.invalid/api/payment-qr',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)}),env);return {...await response.json() as any,httpStatus:response.status}}
try{
  await auth.createUser({uid,email:`${uid}@example.invalid`,emailVerified:true})
  const custom=await auth.createCustomToken(uid),response=await fetchOriginal(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${config.firebase.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:custom,returnSecureToken:true})});token=(await response.json() as any).idToken;assert.ok(token)
  assert.equal(paymentErrorMessage({error:{message:'Mensaje bancario'}}),'Mensaje bancario')
  assert.equal(paymentErrorMessage({error:{result:{}}}),'No se pudo procesar el pago QR.')
  bankError=true;const failed=await call({action:'generate',productCode:'VOCATIONAL_AI_2026_PREMIUM'});assert.equal(failed.error,'El banco está temporalmente ocupado.');assert.equal(failed.httpStatus,400);bankError=false
  invalidQr=true;assert.equal((await call({action:'generate',productCode:'VOCATIONAL_AI_2026_PREMIUM'})).httpStatus,400);invalidQr=false
  const generated=await call({action:'generate',productCode:'VOCATIONAL_AI_2026_PREMIUM',amount:1});assert.equal(generated.httpStatus,200,JSON.stringify(generated));requestIds.push(generated.paymentId)
  assert.equal((await call({action:'status',paymentId:generated.paymentId})).paid,false)
  assert.equal((await db.collection('test_entitlements').where('user_id','==',uid).get()).size,0)
  invalidStatus=true;assert.equal((await call({action:'status',paymentId:generated.paymentId})).httpStatus,400);invalidStatus=false
  paid=true;wrongQr=true;assert.equal((await call({action:'status',paymentId:generated.paymentId})).httpStatus,400);wrongQr=false
  paid=true;wrongAmount=true;assert.notEqual((await call({action:'status',paymentId:generated.paymentId})).httpStatus,200)
  wrongAmount=false;const confirmations=await Promise.all([call({action:'status',paymentId:generated.paymentId}),call({action:'status',paymentId:generated.paymentId})]);assert.ok(confirmations.every(x=>x.paid===true),JSON.stringify(confirmations))
  assert.equal((await db.collection('test_entitlements').where('user_id','==',uid).get()).size,1)
  console.log('PASS server pricing, pending bank, amount mismatch and concurrent bank confirmation')
  const manualId=`qa-manual-${randomUUID()}`,product=(await db.collection('test_products').where('code','==','VOCATIONAL_AI_2026_PREMIUM').get()).docs[0]
  requestIds.push(manualId);await db.collection('payments').doc(manualId).set({id:manualId,user_id:uid,product_id:product.id,status:'PENDING',amount:45,currency:'BOB'})
  await context.run({env,request:new Request('https://test.invalid')},async()=>{
    await assert.rejects(()=>confirmPayment(new Firestore(),manualId,{}))
    const result=await Promise.all([confirmPayment(new Firestore(),manualId,{adminId:'qa-admin'}),confirmPayment(new Firestore(),manualId,{adminId:'qa-admin'})]);assert.equal(result[0],result[1])
    await assert.rejects(()=>confirmPayment(new Firestore(),manualId,{adminId:'qa-admin',status:'FAILED'}))
  })
  assert.equal((await db.collection('test_entitlements').where('payment_id','==',manualId).get()).size,1)
  console.log('PASS authorized and idempotent manual review; paid history protected')
  const email=`${uid}@example.invalid`
  const emailCall=async(body:any)=>{const r=await worker.fetch(new Request('https://test.invalid/api/email-auth',{method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':uid},body:JSON.stringify({email,...body})}),env);return {httpStatus:r.status,...await r.json() as any}}
  assert.equal((await emailCall({action:'send'})).httpStatus,200);assert.ok(emailCode)
  assert.notEqual((await emailCall({action:'verify',token:emailCode==='000000'?'111111':'000000'})).httpStatus,200)
  const verified=await emailCall({action:'verify',token:emailCode});assert.equal(verified.httpStatus,200,JSON.stringify(verified));assert.ok(verified.token)
  assert.notEqual((await emailCall({action:'verify',token:emailCode})).httpStatus,200)
  console.log('PASS email code issuance, invalid attempt, verification and replay rejection with mocked mail')
}finally{
  globalThis.fetch=fetchOriginal
  for(const table of ['payments','test_entitlements'])for(const d of (await db.collection(table).where('user_id','==',uid).get()).docs)await d.ref.delete()
  const codeId=await hash(`${env.APP_SECRET}:${uid}@example.invalid`);await db.collection('email_codes').doc(codeId).delete()
  await db.collection('profiles').doc(uid).delete();await auth.deleteUser(uid)
  console.log('Temporary bank test records removed')
}
