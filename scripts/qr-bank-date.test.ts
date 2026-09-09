import assert from 'node:assert/strict'
import { context } from '../server/context'
import { bankDate, verifiedQrStatus } from '../server/qr-provider'
const original = globalThis.fetch
const payment = {provider_transaction_id:'12345678',qr_session_id:'test-session',created_at:'2026-09-09T02:26:22Z'}
const calls:string[]=[]
let reconciled=false,paidOnReport=true
try {
  globalThis.fetch=async(input:any)=>{
    const url=String(input);calls.push(url)
    if(url.includes('/payments?')){assert.ok(url.endsWith('date=2026-09-08'));reconciled=paidOnReport;return Response.json({payments:[]})}
    return Response.json({transactionId:payment.provider_transaction_id,paid:reconciled,status:reconciled?'paid':'pending',qrId:'bank-qr'})
  }
  await context.run({env:{ARPALSOFT_QR_API_TOKEN:'mock',ARPALSOFT_QR_API_URL:'https://bank.test.invalid'} as any,request:new Request('https://test.invalid')},async()=>{
    assert.equal(bankDate(new Date('2026-09-09T02:26:22Z')),'2026-09-08')
    assert.equal(bankDate(new Date('2026-09-09T04:00:00Z')),'2026-09-09')
    assert.equal((await verifiedQrStatus(payment,new Date('2026-09-09T02:30:00Z'))).paid,true)
    assert.equal(calls.length,3)
    calls.length=0
    assert.equal((await verifiedQrStatus(payment,new Date('2026-09-09T02:31:00Z'))).paid,true)
    assert.equal(calls.length,1)
    reconciled=false;paidOnReport=false;calls.length=0
    assert.equal((await verifiedQrStatus(payment,new Date('2026-09-09T02:32:00Z'))).paid,false)
    assert.equal(calls.length,3)
  })
  console.log('PASS Bolivia midnight reconciliation, authoritative recheck, unpaid QR and already paid QR')
} finally {globalThis.fetch=original}
