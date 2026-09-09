// Explicit integration test: creates and removes QA-only users and records.
if(!process.env.MM_FIREBASE_CREDENTIAL_FILE||!process.env.MM_VERIFY_BASE_URL)throw Error('Set MM_FIREBASE_CREDENTIAL_FILE and MM_VERIFY_BASE_URL for the isolated preview.');
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {randomUUID,randomBytes} from 'node:crypto'
import {initializeApp,cert} from 'firebase-admin/app'
import {getFirestore} from 'firebase-admin/firestore'
import {getAuth} from 'firebase-admin/auth'
const app=initializeApp({credential:cert(JSON.parse(readFileSync(process.env.MM_FIREBASE_CREDENTIAL_FILE,'utf8')))}),db=getFirestore(app),auth=getAuth(app)
const config=JSON.parse(readFileSync('src/lib/firebase-config.json','utf8')),base=process.env.MM_VERIFY_BASE_URL,users=[],notes=[]
const call=async(path,body,token)=>{const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});const data=await r.json();return {status:r.status,...data}}
const record=s=>{notes.push(s);console.log('PASS',s)}
let couponId='QA_'+randomBytes(6).toString('hex').toUpperCase()
try{
 for(let i=0;i<2;i++){const uid='qa-migration-'+randomUUID(),password=randomBytes(20).toString('hex'),email=uid+'@example.invalid';await auth.createUser({uid,email,password,emailVerified:true});users.push({uid});const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+config.apiKey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const data=await r.json();assert.ok(data.idToken,JSON.stringify(data));users[i].token=data.idToken}
 record('Firebase password login')
 const [u,v]=users,product=(await db.collection('test_products').where('code','==','VOCATIONAL_AI_2026_PREMIUM').get()).docs[0]
 const publicCatalog=await call('data',{rpc:'get_test_catalog'});assert.equal(publicCatalog.status,200);assert.equal(publicCatalog.data.find(p=>p.premium_code==='VOCATIONAL_AI_2026_PREMIUM').price,45);record('Catalog and 45 BOB price from Firestore')
 assert.notEqual((await call('data',{table:'admin_users',filters:[]})).status,200)
 assert.notEqual((await call('data',{rpc:'confirm_verified_qr_payment',args:{}},u.token)).status,200)
 assert.notEqual((await call('admin-api',{action:'dashboard'},u.token)).status,200)
 assert.notEqual((await call('data',{rpc:'get_active_test_questions',args:{p_test_code:'VOCATIONAL_AI_2026_PREMIUM'}},u.token)).status,200);record('Private collections, admin, privileged RPC and unpaid tests blocked')
 const code='VOCATIONAL_AI_2026_PREMIUM';await db.collection('coupons').doc(couponId).set({id:couponId,code:couponId,is_active:true,discount_type:'FREE',discount_value:100,max_uses:1,uses_count:0,product_id:product.id,valid_from:new Date(Date.now()-60000).toISOString(),valid_until:null,created_at:new Date().toISOString()})
 const redemption=await Promise.all([call('payment-check',{productCode:code,couponCode:couponId},u.token),call('payment-check',{productCode:code,couponCode:couponId},u.token)]);assert.equal(redemption.filter(r=>r.status===200).length,1,JSON.stringify(redemption));assert.equal((await db.collection('coupons').doc(couponId).get()).data().uses_count,1);record('Concurrent coupon redemption grants exactly one access')
 const questionResult=await call('data',{rpc:'get_active_test_questions',args:{p_test_code:code}},u.token);assert.equal(questionResult.status,200,JSON.stringify(questionResult));assert.equal(questionResult.data.length,48)
 const answers=Object.fromEntries(questionResult.data.map(q=>[q.id,3])),requestId=randomUUID()
 const invalid=await call('submit-premium-result',{testCode:code,requestId,answers:{...answers,[questionResult.data[0].id]:'3'}},u.token);assert.notEqual(invalid.status,200);record('Invalid answers rejected without consuming access')
 const submits=await Promise.all([call('submit-premium-result',{testCode:code,requestId,answers},u.token),call('submit-premium-result',{testCode:code,requestId,answers},u.token)]);assert.ok(submits.every(s=>s.status===200),JSON.stringify(submits));assert.equal(submits[0].evaluationId,submits[1].evaluationId);record('Concurrent/retried submission returns one evaluation')
 const evaluationId=submits[0].evaluationId
 const own=await call('data',{table:'evaluations',filters:[['eq','id',evaluationId]],one:true},u.token);assert.equal(own.status,200,JSON.stringify(own));assert.equal(own.data.result_json.pathways.length,6)
 const other=await call('data',{table:'evaluations',filters:[['eq','id',evaluationId]],one:true},v.token);assert.notEqual(other.status,200)
 assert.notEqual((await call('data',{table:'evaluations',mode:'delete',filters:[['eq','id',evaluationId]]},v.token)).status,200);record('Result ownership and cross-account deletion isolation')
 assert.notEqual((await call('submit-premium-result',{testCode:code,requestId:randomUUID(),answers},u.token)).status,200);record('Consumed access cannot fund another evaluation')
 const free=await call('data',{rpc:'get_active_test_questions',args:{p_test_code:'VOCATIONAL_FREE'}});assert.ok(free.data.length>0)
 const savedFree=await call('submit-free-result',{testCode:'VOCATIONAL_FREE',answers:Object.fromEntries(free.data.map(q=>[q.id,2]))},u.token);assert.equal(savedFree.status,200,JSON.stringify(savedFree));record('Free test scoring and history persistence')
 const direct=await fetch('https://firestore.googleapis.com/v1/projects/'+config.projectId+'/databases/(default)/documents/evaluations',{headers:{Authorization:'Bearer '+u.token}});assert.equal(direct.status,403);record('Direct Firestore access denied by deployed rules')
 writeFileSync('work/firebase-verification.json',JSON.stringify({at:new Date().toISOString(),passed:notes},null,2))
}finally{
 for(const {uid}of users){for(const table of ['evaluations','payments','test_entitlements','coupon_redemptions','submissions']){const docs=await db.collection(table).where('user_id','==',uid).get();for(const d of docs.docs)await d.ref.delete()}await db.collection('profiles').doc(uid).delete();await auth.deleteUser(uid)}await db.collection('coupons').doc(couponId).delete();console.log('QA users and records removed')
}
