import { SignJWT, jwtVerify } from 'jose'
import { env } from './context'
const key=()=>new TextEncoder().encode(env().APP_SECRET)
function objectKey(bucket:string,path:string){if(!['branding','payment-receipts'].includes(bucket)||path.includes('..')||path.startsWith('/'))throw Error('Archivo inválido');return `${bucket}/${path}`}
export const storage={from:(bucket:string)=>({
  async upload(path:string,bytes:Uint8Array,options:any){await env().PRIVATE_FILES.put(objectKey(bucket,path),bytes,{httpMetadata:{contentType:options.contentType}});return {error:null}},
  getPublicUrl(path:string){if(bucket!=='branding')throw Error('Archivo privado');return {data:{publicUrl:`/media/branding/${encodeURIComponent(path)}`}}},
  async createSignedUrl(path:string,seconds:number){const token=await new SignJWT({path:objectKey(bucket,path)}).setProtectedHeader({alg:'HS256'}).setExpirationTime(`${Math.min(seconds,900)}s`).sign(key());return {data:{signedUrl:`/media/private?token=${token}`}}}
})}
export async function media(req:Request){const u=new URL(req.url);let path:string
  if(u.pathname.startsWith('/media/branding/'))path=objectKey('branding',decodeURIComponent(u.pathname.slice('/media/branding/'.length)))
  else{const {payload}=await jwtVerify(u.searchParams.get('token')??'',key(),{algorithms:['HS256']});path=String(payload.path);if(!path.startsWith('payment-receipts/'))throw Error('Archivo inválido')}
  const obj=await env().PRIVATE_FILES.get(path);if(!obj)return new Response('Archivo no encontrado',{status:404})
  const headers=new Headers({'Cache-Control':path.startsWith('branding/')?'public, max-age=3600':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});obj.writeHttpMetadata(headers)
  if(!path.startsWith('branding/'))headers.set('Content-Disposition','inline')
  return new Response(obj.body,{headers})
}
