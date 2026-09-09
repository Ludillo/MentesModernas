import { env } from './context'
import { paymentErrorMessage } from '../shared/payment-errors'
export class QrProviderError extends Error {}
export async function qrProvider(path: string, init: RequestInit = {}) {
  const token = env().ARPALSOFT_QR_API_TOKEN
  if (!token) throw new QrProviderError('La integración QR no está configurada.')
  const base = (env().ARPALSOFT_QR_API_URL || 'https://api.arpalsoft.com').trim().replace(/\/v1\/mentes-modernas\/qrs\/?$/, '').replace(/\/$/, '')
  const response = await fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', 'X-Client-Token': token, ...init.headers } })
  const body: any = await response.json().catch(() => null)
  if (!response.ok || body?.error) throw new QrProviderError(paymentErrorMessage(body, 'El proveedor QR no pudo completar la solicitud. Intenta nuevamente en unos momentos.'))
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new QrProviderError('El proveedor QR devolvió una respuesta inválida.')
  return body
}
export function validateGeneratedQr(qr: any) {
  if (!['string', 'number'].includes(typeof qr.transactionId) || !String(qr.transactionId).trim() || typeof qr.qrImage !== 'string' || !qr.qrImage.trim()) {
    throw new QrProviderError('El proveedor no devolvió una imagen QR válida. Vuelve a solicitar el QR.')
  }
}
export function validateQrStatus(result: any, transactionId: string) {
  if (typeof result.paid !== 'boolean' || (result.transactionId !== undefined && String(result.transactionId) !== transactionId)) {
    throw new QrProviderError('La respuesta bancaria no permite verificar este pago. Intenta nuevamente.')
  }
}
