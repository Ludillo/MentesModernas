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
      const {data:product,error:productError}=await db.from('test_products').select('id').eq('code',productCode.toUpperCase()).eq('access_level','PREMIUM').eq('is_active',true).maybeSingle()
      if(productError)throw productError
      if(!product)return json(req,{paid:false,accessGranted:false,error:'El test avanzado no está disponible.'},404)
      const {data:entitlement,error:entitlementError}=await db.from('test_entitlements').select('id').eq('user_id',user.id).eq('product_id',product.id).eq('status','AVAILABLE').limit(1).maybeSingle()
      if(entitlementError)throw entitlementError
      return json(req,{paid:!!entitlement,accessGranted:!!entitlement,entitlementId:entitlement?.id??null})
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
