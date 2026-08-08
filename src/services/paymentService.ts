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