import { importPKCS8, SignJWT } from 'jose'
import { env } from './context'
type Row = Record<string, any>
let cached: {key:string; token:string; until:number} | undefined
export function account() { return JSON.parse(env().FIREBASE_SERVICE_ACCOUNT) }
export async function googleToken() {
  const sa = account()
  if (cached && cached.key === sa.private_key_id && cached.until > Date.now()) return cached.token
  const key = await importPKCS8(sa.private_key, 'RS256')
  const assertion = await new SignJWT({scope:'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit'})
    .setProtectedHeader({alg:'RS256',kid:sa.private_key_id}).setIssuer(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token').setIssuedAt().setExpirationTime('1h').sign(key)
  const res = await fetch('https://oauth2.googleapis.com/token', {method:'POST', body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})})
  const data:any = await res.json(); if (!res.ok) throw Error('No se pudo autenticar el servidor de datos.')
  cached = {key:sa.private_key_id,token:data.access_token,until:Date.now()+Number(data.expires_in)*1000-60000}
  return cached.token
}
export async function googleApi(url:string, body?:any, method=body === undefined?'GET':'POST') {
  const res=await fetch(url,{method,headers:{Authorization:`Bearer ${await googleToken()}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
  const data:any=await res.json().catch(()=>({})); if(!res.ok){if(res.status!==404)console.error('google_operation_failed',{status:res.status,code:data.error?.status});const e:any=Error('No se pudo completar la operación de datos.');e.code=data.error?.status;e.status=res.status;throw e} return data
}
export function encode(v:any):any {
  if(v===null||v===undefined)return {nullValue:null}
  if(typeof v==='boolean')return {booleanValue:v}
  if(typeof v==='number')return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v}
  if(Array.isArray(v))return {arrayValue:{values:v.map(encode)}}
  if(typeof v==='object')return {mapValue:{fields:fields(v)}}
  return {stringValue:String(v)}
}
export function fields(row:Row):Row { return Object.fromEntries(Object.entries(row).filter(([,v])=>v!==undefined).map(([k,v])=>[k,encode(v)])) }
export function decode(v:any):any {
  if('nullValue' in v)return null
  if('integerValue' in v)return Number(v.integerValue)
  if('doubleValue' in v)return v.doubleValue
  if('booleanValue' in v)return v.booleanValue
  if('arrayValue' in v)return (v.arrayValue.values??[]).map(decode)
  if('mapValue' in v)return row(v.mapValue.fields)
  return v.stringValue??v.timestampValue??null
}
export function row(f:Row={}):Row{return Object.fromEntries(Object.entries(f).map(([k,v])=>[k,decode(v)]))}
export class Firestore {
  base=`https://firestore.googleapis.com/v1/projects/${account().project_id}/databases/(default)/documents`
  transaction?:string
  writes:any[]=[]
  name(collection:string,id:string){if(!/^[a-z_]+$/.test(collection)||!id||id.includes('/')||id==='.'||id==='..')throw Error('Identificador inválido');return `${this.base.slice('https://firestore.googleapis.com/v1/'.length)}/${collection}/${id}`}
  async get(collection:string,id:string) {
    const path=this.name(collection,id)
    try {const d=await googleApi(`https://firestore.googleapis.com/v1/${path}${this.transaction?'?transaction='+encodeURIComponent(this.transaction):''}`);return row(d.fields)}catch(e:any){if(e.status===404)return null;throw e}
  }
  async list(collection:string,filter?:[string,any]) {
    this.name(collection,'validate')
    const structuredQuery:any={from:[{collectionId:collection}]}
    if(filter)structuredQuery.where={fieldFilter:{field:{fieldPath:filter[0]},op:'EQUAL',value:encode(filter[1])}}
    const result=await googleApi(`${this.base}:runQuery`,{structuredQuery,...(this.transaction?{transaction:this.transaction}:{})})
    return result.filter((d:any)=>d.document).map((d:any)=>row(d.document.fields)) as Row[]
  }
  async put(collection:string,id:string,value:Row,merge=false,create=false) {
    const clean=fields(value),write:any={update:{name:this.name(collection,id),fields:clean}}
    if(merge)write.updateMask={fieldPaths:Object.keys(clean)}
    if(create)write.currentDocument={exists:false}
    if(this.transaction)this.writes.push(write);else await googleApi(`${this.base}:commit`,{writes:[write]})
  }
  async remove(collection:string,id:string){const write={delete:this.name(collection,id)};if(this.transaction)this.writes.push(write);else await googleApi(`${this.base}:commit`,{writes:[write]})}
  async atomic<T>(fn:(db:Firestore)=>Promise<T>):Promise<T> {
    for(let attempt=0;attempt<5;attempt++){
      const tx=new Firestore();tx.transaction=(await googleApi(`${this.base}:beginTransaction`,{options:{readWrite:{}}})).transaction
      try{const result=await fn(tx);await googleApi(`${this.base}:commit`,{transaction:tx.transaction,writes:tx.writes});return result}
      catch(e:any){await googleApi(`${this.base}:rollback`,{transaction:tx.transaction}).catch(()=>{});if(!['ABORTED','ALREADY_EXISTS'].includes(e.code)||attempt===4)throw e}
    }throw Error('Inténtalo nuevamente.')
  }
}
