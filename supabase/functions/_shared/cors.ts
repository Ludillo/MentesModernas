export function corsHeaders(req: Request) {
  const configured = Deno.env.get('SITE_ORIGIN') || '*'
  const origin = req.headers.get('origin') || ''
  const allow = configured === '*' ? '*' : (origin === configured ? configured : configured)
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
}

export function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' }
  })
}
