import { corsHeaders, json } from '../_shared/cors.ts'
import { requireUser } from '../_shared/supabase.ts'

Deno.serve(async (req: Request) => {

if (req.method === 'OPTIONS') {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req)
  })
}

  if (req.method !== 'POST') {
    return json(
      req,
      { error: 'Method not allowed' },
      405
    )
  }

  try {
    const { user, db } = await requireUser(req)

    const body = await req.json()

    const productCode =
      String(body.productCode ?? '').trim()

    const couponCode =
      String(body.couponCode ?? '').trim()

    if (!productCode) {
      return json(
        req,
        {
          paid: false,
          error: 'No se especificó el producto.'
        },
        400
      )
    }

    if (!couponCode) {
      return json(
        req,
        {
          paid: false,
          error: 'Actualmente necesitas un cupón válido para acceder al test Premium.'
        },
        400
      )
    }

    const { data, error } = await db.rpc(
      'redeem_coupon_access',
      {
        p_user_id: user.id,
        p_product_code: productCode,
        p_coupon_code: couponCode
      }
    )

    if (error) {
      return json(
        req,
        {
          paid: false,
          error: error.message
        },
        400
      )
    }

    return json(
      req,
      {
        paid: true,
        accessGranted: true,
        entitlementId: data ?? null
      }
    )

  } catch (e: any) {

    return json(
      req,
      {
        paid: false,
        error:
          e?.message ??
          'No se pudo habilitar el test Premium.'
      },
      400
    )
  }
})
