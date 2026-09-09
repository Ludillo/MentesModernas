import { initializeApp } from 'firebase/app'
import { getAuth, onIdTokenChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import firebaseConfig from './firebase-config.json'
export const firebaseAuth=getAuth(initializeApp(firebaseConfig))
firebaseAuth.languageCode='es'
export async function session(){await firebaseAuth.authStateReady();const user=firebaseAuth.currentUser;return user?{access_token:await user.getIdToken(),user:{id:user.uid,email:user.email,user_metadata:{full_name:user.displayName}}}:null}
export async function api(name:string,body:unknown){const current=await session();const res=await fetch(`/api/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(current?{Authorization:`Bearer ${current.access_token}`}:{})},body:JSON.stringify(body)});const data=await res.json();if(!res.ok)throw Error(data.error??'No se pudo completar la solicitud.');return data}
export async function googleLogin(path:string){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(firebaseAuth,provider);window.location.assign(path)}
class Query implements PromiseLike<any>{
  filters:any[]=[];sort?:[string,boolean];maximum?:number;one=false;optional=false;mode='read'
  constructor(public table:string){}
  select(_selection='*'){return this}
  eq(k:string,v:any){this.filters.push(['eq',k,v]);return this}
  order(k:string,o:any={}){this.sort=[k,o.ascending!==false];return this}
  limit(n:number){this.maximum=n;return this}
  single(){this.one=true;return this}
  maybeSingle(){this.one=true;this.optional=true;return this}
  delete(){this.mode='delete';return this}
  async run(){try{return await api('data',{table:this.table,filters:this.filters,sort:this.sort,maximum:this.maximum,one:this.one,optional:this.optional,mode:this.mode})}catch(error){return {data:null,error}}}
  then<TResult1=any,TResult2=never>(resolve?:((value:any)=>TResult1|PromiseLike<TResult1>)|null,reject?:((reason:any)=>TResult2|PromiseLike<TResult2>)|null):PromiseLike<TResult1|TResult2>{return this.run().then(resolve,reject)}
}
export const backend={
  from:(table:string)=>new Query(table),
  async rpc(rpc:string,args:unknown={}){try{return await api('data',{rpc,args})}catch(error){return {data:null,error}}},
  auth:{async getSession(){return {data:{session:await session()}}},onAuthStateChange(callback:(event:string,current:Awaited<ReturnType<typeof session>>)=>void){const unsubscribe=onIdTokenChanged(firebaseAuth,async()=>callback('TOKEN_CHANGED',await session()));return {data:{subscription:{unsubscribe}}}}}
}
