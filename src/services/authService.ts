import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithCustomToken, signOut as firebaseSignOut, updateProfile, sendEmailVerification } from 'firebase/auth'
import { api, firebaseAuth, googleLogin } from '../lib/backend'
export async function signInWithGoogle(){const saved=sessionStorage.getItem('mm_auth_return_to')??'';return googleLogin(/^\/acceso\/[A-Z0-9_]+$/.test(saved)?saved:'/cuenta')}
export async function sendEmailOtp(email:string){await api('email-auth',{action:'send',email})}
export async function verifyEmailOtp(email:string,token:string){const data=await api('email-auth',{action:'verify',email,token});return signInWithCustomToken(firebaseAuth,data.token)}
export async function signUpWithPassword(email:string,password:string,fullName:string){if(password.length<8)throw Error('Usa una contraseña de al menos 8 caracteres.');const result=await createUserWithEmailAndPassword(firebaseAuth,email.trim(),password);await updateProfile(result.user,{displayName:fullName.trim()});await sendEmailVerification(result.user);return result}
export async function signInWithPassword(email:string,password:string){const result=await signInWithEmailAndPassword(firebaseAuth,email.trim(),password);if(!result.user.emailVerified)throw Error('Verifica tu correo o ingresa con un código por correo para activar tu cuenta.');return result}
export async function signOut(){await firebaseSignOut(firebaseAuth);sessionStorage.removeItem('mm_admin_session')}
