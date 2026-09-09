// Server-only query adapter. The public API exposes a separate, explicit allowlist.
import { Firestore } from './firestore'
import { storage } from './storage'
import { rpc } from './operations'
type Row=Record<string,any>
type Filter=[string,string,any]
export function columns(value:string){let depth=0,start=0;const parts:string[]=[];for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;if(value[i]===')')depth--;if(value[i]===','&&depth===0){parts.push(value.slice(start,i).trim());start=i+1}}parts.push(value.slice(start).trim());return parts}
const foreign:Record<string,string>={profiles:'user_id',test_types:'test_type_id',test_versions:'test_version_id',test_products:'product_id',coupons:'coupon_id'}
export async function project(db:Firestore,table:string,items:Row[],selection:string):Promise<Row[]> {
  const parts=columns(selection)
  const cache=new Map<string,Promise<Row[]>>()
  return Promise.all(items.map(async item=>{
    const result:Row=parts.includes('*')?{...item}:{}
    for(const part of parts){const match=part.match(/^(\w+)\((.*)\)$/);if(!match){if(part!=='*')result[part]=item[part]??null;continue}
      const [,target,sub]=match,field=foreign[target]
      if(field&&item[field]){const key=`${target}:${item[field]}`;if(!cache.has(key))cache.set(key,db.get(target,String(item[field])).then(r=>r?[r]:[]));result[target]=(await project(db,target,await cache.get(key)!,sub))[0]??null}
      else{const childField=table==='test_types'?'test_type_id':table==='test_versions'?'test_version_id':null;if(!childField){result[target]=null;continue}const key=`${target}:${childField}:${item.id}`;if(!cache.has(key))cache.set(key,db.list(target,[childField,item.id]));const children=await cache.get(key)!;result[target]=sub==='count'?[{count:children.length}]:await project(db,target,children,sub)}
    }return result
  }))
}
function matches(row:Row,[op,k,v]:Filter){switch(op){case'eq':return row[k]===v;case'gte':return row[k]>=v;case'ilike':return String(row[k]??'').toLowerCase()===String(v).toLowerCase();case'notnull':return row[k]!==null&&row[k]!==undefined;default:throw Error('Filtro no permitido')}}
export function defaults(table:string,value:Row):Row{
  const now=new Date().toISOString(),r:Row={id:crypto.randomUUID(),created_at:now,...value}
  if(table==='site_content')delete r.id
  if(table==='payments')Object.assign(r,{status:'PENDING',...value})
  if(table==='test_entitlements')Object.assign(r,{status:'AVAILABLE',payment_id:null,...value})
  if(table==='evaluations')r.completed_at=value.completed_at??now
  if(table==='page_visits')r.visited_at=value.visited_at??now
  if(table==='contact_messages')r.status=value.status??'NEW'
  if(table==='coupons')Object.assign(r,{uses_count:0,valid_from:now,valid_until:null,product_id:null,...value})
  if(table==='admin_users')Object.assign(r,{is_active:true,...value})
  return r
}
export class Query implements PromiseLike<any> {
  filters:Filter[]=[];selection='*';mode='read';values:any;one=false;optional=false;sort?:[string,boolean];maximum?:number;options:any;conflict?:string
  constructor(public table:string,public db=new Firestore()){}
  select(s='*',options?:any){this.selection=s;this.options=options;return this}
  eq(k:string,v:any){this.filters.push(['eq',k,v]);return this}
  gte(k:string,v:any){this.filters.push(['gte',k,v]);return this}
  ilike(k:string,v:any){this.filters.push(['ilike',k,v]);return this}
  not(k:string,op:string,v:any){if(op!=='is'||v!==null)throw Error('Filtro inválido');this.filters.push(['notnull',k,null]);return this}
  order(k:string,o:any={}){this.sort=[k,o.ascending!==false];return this}
  limit(n:number){this.maximum=n;return this}
  single(){this.one=true;return this}
  maybeSingle(){this.one=true;this.optional=true;return this}
  insert(v:any){this.mode='insert';this.values=v;return this}
  upsert(v:any,o:any={}){this.mode='upsert';this.values=v;this.conflict=o.onConflict;return this}
  update(v:any){this.mode='update';this.values=v;return this}
  delete(){this.mode='delete';return this}
  async rows(db=this.db){
    const idKey=this.table==='site_content'?'key':'id',byId=this.filters.find(([op,k])=>op==='eq'&&k===idKey),eq=this.filters.find(([op])=>op==='eq')
    let rows=byId?await db.get(this.table,String(byId[2])).then(x=>x?[x]:[]):await db.list(this.table,eq?[eq[1],eq[2]]:undefined)
    rows=rows.filter(r=>this.filters.every(f=>matches(r,f)))
    if(this.sort){const [k,asc]=this.sort;rows.sort((a,b)=>(a[k]<b[k]?-1:a[k]>b[k]?1:0)*(asc?1:-1))}
    return this.maximum===undefined?rows:rows.slice(0,this.maximum)
  }
  async execute(){try{
    let rows:Row[]
    if(this.mode==='read')rows=await this.rows()
    else rows=await this.db.atomic(async db=>{
      const result:Row[]=[],key=this.table==='site_content'?'key':'id'
      if(this.mode==='insert'||this.mode==='upsert'){
        for(const value of Array.isArray(this.values)?this.values:[this.values]){
          let existing:Row|null=null
          if(this.mode==='upsert')existing=value[key]?await db.get(this.table,String(value[key])):this.conflict?(await db.list(this.table,[this.conflict,value[this.conflict]]))[0]??null:null
          const clean=Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined)),next=existing?{...existing,...clean}:defaults(this.table,clean)
          await db.put(this.table,String(next[key]),next,false,!existing);result.push(next)
        }
      }else{const selected=await this.rows(db);for(const item of selected){if(this.mode==='delete')await db.remove(this.table,String(item[key]));else await db.put(this.table,String(item[key]),this.values,true);result.push({...item,...this.values})}}
      return result
    })
    if(this.one&&(rows.length>1||(!this.optional&&rows.length!==1)))throw Error('Registro no encontrado o ambiguo.')
    const data=this.options?.head?null:await project(this.db,this.table,rows,this.selection)
    return {data:this.one?data?.[0]??null:data,error:null,count:rows.length}
  }catch(error:any){return {data:null,error,count:0}}}
  then<TResult1=any,TResult2=never>(resolve?:((value:any)=>TResult1|PromiseLike<TResult1>)|null,reject?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2>{return this.execute().then(resolve,reject)}
}
export function adminDb(){return {from:(table:string)=>new Query(table),storage,rpc:async(name:string,args:any)=>{try{return {data:await rpc(name,args),error:null}}catch(error:any){return {data:null,error}}}}}
