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
