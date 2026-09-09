const allowedOrigins = [
  'http://localhost:5173',
  'https://mentesmodernas.lat',
  'https://www.mentesmodernas.lat',
  'https://mentesmodernas.ludwingcocajimenez.workers.dev'
]

export function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') ?? ''

  const allowedOrigin = allowedOrigins.includes(origin)
    ? origin
    : 'https://mentesmodernas.lat'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods':
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  }
}

export function json(
  req: Request,
  data: unknown,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders(req),
        'Content-Type': 'application/json'
      }
    }
  )
}