import { identity } from '../auth'
import { adminDb } from '../database'
export { adminDb }
export async function requireUser(req:Request){const user=await identity(req);if(!user.email_verified)throw Error('Verifica tu correo antes de continuar.');return {user,db:adminDb()}}
