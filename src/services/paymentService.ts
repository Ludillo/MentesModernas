import { supabase } from '../lib/supabase'

export async function validatePayment(
  productCode: string,
  couponCode?: string
): Promise<boolean> {

  const { data: sessionData } = await supabase.auth.getSession()

  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Debes autenticarte antes de continuar.')
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-check`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      },
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
 const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Debes autenticarte.')
 const form=new FormData();form.set('productCode',productCode);form.set('receipt',file);form.set('payerName',payerName);form.set('reference',reference)
 const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-submit`,{method:'POST',headers:{Authorization:`Bearer ${token}`,apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},body:form});const body=await res.json();if(!res.ok)throw new Error(body.error);return body
}

export type QrPayment={paymentId:string;amount:number;currency:string;productName:string;transactionId:string;qrId?:string;qrImage:string;dueDate:string;status:string}

async function qrRequest(body:Record<string,unknown>){
 const {data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token)throw new Error('Debes autenticarte antes de continuar.')
 const res=await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payment-qr`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,apikey:import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify(body)})
 const payload=await res.json();if(!res.ok)throw new Error(payload?.error||'No se pudo procesar el pago QR.');return payload
}

export async function generatePaymentQr(productCode:string):Promise<QrPayment>{return qrRequest({action:'generate',productCode})}
export async function verifyPaymentQr(paymentId:string):Promise<{paid:boolean;accessGranted:boolean;message?:string}>{return qrRequest({action:'status',paymentId})}
