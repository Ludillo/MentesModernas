import { paymentErrorMessage } from '../../shared/payment-errors'
import { backend } from '../lib/backend'

export async function validatePayment(
  productCode: string,
  couponCode?: string
): Promise<boolean> {

  const { data: sessionData } = await backend.auth.getSession()

  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Debes autenticarte antes de continuar.')
  }

  const res = await fetch(
    `/api/payment-check`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`},
      body: JSON.stringify({
        productCode,
        couponCode: couponCode || null
      })
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(
      data?.error || 'No se pudo habilitar el test Premium.'
    )
  }

  return data.paid === true
}

export async function submitPaymentReceipt(productCode:string,file:File,payerName:string,reference:string){
 const {data}=await backend.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Debes autenticarte.')
 const form=new FormData();form.set('productCode',productCode);form.set('receipt',file);form.set('payerName',payerName);form.set('reference',reference)
 const res=await fetch(`/api/payment-submit`,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});const body=await res.json();if(!res.ok)throw new Error(body.error);return body
}

export async function hasPremiumAccess(productCode:string):Promise<boolean>{
  const {data:sessionData}=await backend.auth.getSession()
  const userId=sessionData.session?.user.id
  if(!userId)return false
  const {data:product,error:productError}=await backend.from('test_products').select('id').eq('code',productCode.toUpperCase()).eq('access_level','PREMIUM').eq('is_active',true).maybeSingle()
  if(productError||!product)return false
  const {data:entitlement,error:entitlementError}=await backend.from('test_entitlements').select('id').eq('user_id',userId).eq('product_id',product.id).eq('status','AVAILABLE').limit(1).maybeSingle()
  if(entitlementError)return false
  return !!entitlement
}

export type QrPayment={paymentId:string;amount:number;currency:string;productName:string;transactionId:string;qrId?:string;qrImage:string;dueDate:string;status:string}

async function qrRequest(body:Record<string,unknown>){
 const {data}=await backend.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Debes autenticarte antes de continuar.')
 const res=await fetch(`/api/payment-qr`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
 const payload=await res.json();if(!res.ok)throw new Error(paymentErrorMessage(payload));return payload
}

export async function generatePaymentQr(productCode:string):Promise<QrPayment>{return qrRequest({action:'generate',productCode})}
export async function verifyPaymentQr(paymentId:string):Promise<{paid:boolean;accessGranted:boolean;message?:string}>{return qrRequest({action:'status',paymentId})}
