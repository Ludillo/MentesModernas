import type { AdminSession } from '../types/models'
import { api, googleLogin, session } from '../lib/backend'
const STORAGE_KEY='mm_admin_session_firebase'
export function getAdminSession():AdminSession|null {try{const raw=sessionStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):null}catch{return null}}
export function clearAdminSession(){sessionStorage.removeItem(STORAGE_KEY)}
export function signInAdminWithGoogle(){return googleLogin('/admin/login')}
export async function restoreGoogleAdminSession(){if(!await session())return null;const data=await api('admin-google-auth',{});sessionStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data as AdminSession}
export async function adminApi(action:string,payload:Record<string,unknown>={}){return api('admin-api',{action,...payload})}
export async function uploadLogo(file:File){const current=await session();if(!current)throw Error('Inicia sesión.');const form=new FormData();form.append('file',file);const res=await fetch('/api/admin-upload-logo',{method:'POST',headers:{Authorization:`Bearer ${current.access_token}`},body:form});const data=await res.json();if(!res.ok)throw Error(data.error);return data}
