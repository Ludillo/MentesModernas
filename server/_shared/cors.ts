export function corsHeaders(_req:Request):Record<string,string>{return {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}
export function json(req:Request,value:any,status=200){return Response.json(value,{status,headers:corsHeaders(req)})}
