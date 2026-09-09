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

// Banco Económico reports use Bolivia's calendar date, not UTC.
export function bankDate(value = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
}
export async function verifiedQrStatus(payment: { provider_transaction_id: string; qr_session_id: string; created_at: string }, current = new Date()) {
  const path = '/v1/mentes-modernas/qrs/' + encodeURIComponent(payment.provider_transaction_id) + '/status?sessionId=' + encodeURIComponent(payment.qr_session_id)
  let result = await qrProvider(path)
  validateQrStatus(result, payment.provider_transaction_id)
  if (result.paid) return result
  const created = new Date(payment.created_at)
  const dates = Number.isFinite(created.getTime()) ? [current, created] : [current]
  const alreadyQueried = new Set(dates.map(date => date.toISOString().slice(0, 10)))
  const missingDates = [...new Set(dates.map(date => bankDate(date)))].filter(date => !alreadyQueried.has(date))
  for (const date of missingDates) {
    await qrProvider('/v1/mentes-modernas/payments?date=' + date)
  }
  if (missingDates.length) {
    // The report reconciles the gateway. Confirm through the original QR/session,
    // because the bank's settlement transaction ID can differ from the request ID.
    result = await qrProvider(path)
    validateQrStatus(result, payment.provider_transaction_id)
  }
  return result
}
