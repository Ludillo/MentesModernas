import { supabase } from '../lib/supabase'

export async function validatePayment(
  productCode: string,
  couponCode?: string
): Promise<boolean> {

  /*
  // ============================================================
  // IMPLEMENTACIÓN REAL - DESCOMENTAR CUANDO TENGAMOS API DE PAGO
  // ============================================================

  const { data: sessionData } = await supabase.auth.getSession()

  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error('Debes autenticarte antes de pagar.')
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

  if (!res.ok) {
    return false
  }

  const data = await res.json()

  return data.paid === true
  */

  // ============================================================
  // TEMPORAL
  // Mientras no exista la integración QR + callback bancario,
  // permitimos continuar siempre.
  // ============================================================

  return true
}