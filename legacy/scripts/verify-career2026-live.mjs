// Integration checks use one disposable account and never invoke the bank/payment provider.
import {createClient} from '@supabase/supabase-js'
import {randomUUID} from 'node:crypto'
import assert from 'node:assert/strict'
import {CAREER_CODE} from '../shared/career2026.ts'
const url=process.env.VITE_SUPABASE_URL,anon=process.env.VITE_SUPABASE_PUBLISHABLE_KEY,key=process.env.MM_SERVICE_KEY
if(!url||!anon||!key)throw new Error('Provide public URL/key and MM_SERVICE_KEY through environment only.')
const db=createClient(url,key,{auth:{persistSession:false}}),client=createClient(url,anon,{auth:{persistSession:false}})
const check=({data,error})=>{if(error)throw error;return data}
const cat=check(await client.rpc('get_test_catalog'));const item=cat.find(x=>x.premium_code===CAREER_CODE)
assert.equal(item.price,45);assert.equal(item.premium_questions,48);assert.equal(item.free_code,null)
const locked=await client.rpc('get_active_test_questions',{p_test_code:CAREER_CODE});assert.ok(locked.error||!locked.data?.length)
console.log('PASS public catalogue: 45 BOB, 48 questions; anonymous premium access blocked')
const product=check(await db.from('test_products').select('id,test_type_id,test_version_id').eq('code',CAREER_CODE).single())
const questions=check(await db.from('test_questions').select('id,dimension_code').eq('test_version_id',product.test_version_id))
const email=`codex-career-qa-${randomUUID()}@example.com`,password=randomUUID()+randomUUID()
let userId
try{
 const created=check(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:'Temporary integration test'}}));userId=created.user.id
 check(await client.auth.signInWithPassword({email,password}))
 const noAccess=await client.rpc('get_active_test_questions',{p_test_code:CAREER_CODE});assert.ok(noAccess.error||!noAccess.data?.length)
 const {data:{session}}=await client.auth.getSession()
 const submit=async answers=>{const res=await fetch(`${url}/functions/v1/submit-premium-result`,{method:'POST',headers:{apikey:anon,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({testCode:CAREER_CODE,answers,results:[{percent:999}]})});return {status:res.status,body:await res.json()}}
 const answers=Object.fromEntries(questions.map(q=>[q.id,q.dimension_code==='S'?4:2]))
 assert.equal((await submit(answers)).status,400)
 check(await db.from('test_entitlements').insert({user_id:userId,product_id:product.id,status:'AVAILABLE',payment_id:null}))
 assert.equal(check(await client.rpc('get_active_test_questions',{p_test_code:CAREER_CODE})).length,48)
 assert.equal((await submit({...answers,[questions[0].id]:'4'})).status,400)
 const saved=await submit(answers);assert.equal(saved.status,200,JSON.stringify(saved.body))
 const report=check(await client.from('evaluations').select('result_json').eq('id',saved.body.evaluationId).single()).result_json
 assert.equal(report.results[0].code,'S');assert.equal(report.results[0].percent,100);assert.equal(report.pathways.length,6);assert.equal(report.skills.length,6)
 assert.equal((await submit(answers)).status,400)
 const {data:ent}=await db.from('test_entitlements').select('status').eq('user_id',userId);assert.ok(ent.every(e=>e.status==='CONSUMED'))
 const other=createClient(url,anon,{auth:{persistSession:false}});assert.equal(check(await other.from('evaluations').select('id').eq('id',saved.body.evaluationId)).length,0)
 console.log('PASS paid gate, question access, invalid-answer rejection, server scoring, private result, single consumption')
}finally{
 if(userId){
  // Exact generated QA user only; no pre-existing user or payment is touched.
  check(await db.from('test_entitlements').update({evaluation_id:null}).eq('user_id',userId))
  check(await db.from('evaluations').delete().eq('user_id',userId))
  check(await db.from('test_entitlements').delete().eq('user_id',userId))
  check(await db.auth.admin.deleteUser(userId))
  console.log('Temporary QA account and records removed')
 }
}
