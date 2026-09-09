import { identity, rateLimit } from '../auth'
import { Firestore } from '../firestore'
import { Query, project } from '../database'
import { rpc } from '../operations'
const publicTables:Record<string,string>={site_content:'key,value,is_active',test_products:'id,name,code,price,currency,access_level,is_active,test_version_id'}
const ownTables:Record<string,string>={evaluations:'id,user_id,test_type_id,test_version_id,completed_at,result_json,test_types(name),test_versions(code,access_level)',test_entitlements:'id,user_id,product_id,status,created_at,test_products(name,code)',payments:'id,user_id,status,created_at,amount,currency,test_products(name,code)'}
export default async function data(req:Request){
  const b:any=(await req.json() as any)
  if(['get_test_catalog','get_public_test_stats'].includes(b.rpc)){
    const cache=typeof caches==='undefined'?null:caches.default
    const key=new Request(`${new URL(req.url).origin}/_public-cache/${b.rpc}`)
    const cached=await cache?.match(key)
    if(cached)return new Response(cached.body,cached)
    const response=Response.json({data:await rpc(b.rpc,{}),error:null},{headers:{'Cache-Control':'public, max-age=60'}})
    await cache?.put(key,response.clone())
    return response
  }
  await rateLimit('data',300,3600)
  const user=await identity(req,true)
  if(b.rpc){if(!['get_test_catalog','get_active_test_questions','get_public_test_stats','record_test_completion','submit_test_feedback'].includes(b.rpc))throw Error('Operación no permitida.');return Response.json({data:await rpc(b.rpc,b.args??{},user),error:null})}
  const table=String(b.table),allowed=publicTables[table]??ownTables[table];if(!allowed)throw Error('Colección no permitida.')
  if(ownTables[table]&&!user)throw Error('Inicia sesión para continuar.')
  if(b.mode==='delete'){
    if(table!=='evaluations'||!user)throw Error('Operación no permitida.')
    const id=b.filters?.find((f:any)=>f[0]==='eq'&&f[1]==='id')?.[2];if(typeof id!=='string')throw Error('Resultado inválido.')
    await new Firestore().atomic(async tx=>{const evaluation=await tx.get(table,id);if(!evaluation||evaluation.user_id!==user.id)throw Error('Resultado no disponible.');await tx.remove(table,id)})
    return Response.json({data:null,error:null})
  }
  if(b.mode&&b.mode!=='read')throw Error('Operación no permitida.')
  const q=new Query(table)
  if(ownTables[table])q.eq('user_id',user.id)
  if(publicTables[table])q.eq('is_active',true)
  if(!Array.isArray(b.filters)||b.filters.length>10)throw Error('Consulta inválida.')
  const filterFields=new Set(['id','key','code','user_id','product_id','status','access_level','is_active'])
  for(const [op,k,v] of b.filters){if(op!=='eq'||!filterFields.has(k)||!['string','boolean'].includes(typeof v))throw Error('Filtro inválido.');q.eq(k,v)}
  if(b.sort){if(!['created_at','completed_at','code','key'].includes(b.sort[0]))throw Error('Orden inválido.');q.order(b.sort[0],{ascending:b.sort[1]})}
  q.limit(Math.min(Math.max(Number(b.maximum)||500,1),500))
  const rows=await q.rows(),filtered=await project(q.db,table,rows,allowed)
  // Ignore arbitrary select/join expressions supplied by clients.
  if(b.one&&filtered.length>1||b.one&&!b.optional&&!filtered.length)throw Error('Registro no encontrado.')
  return Response.json({data:b.one?filtered[0]??null:filtered,error:null})
}
