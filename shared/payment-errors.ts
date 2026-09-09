/** Extract a readable message without coercing structured API errors to strings. */
export function paymentErrorMessage(value: unknown, fallback = 'No se pudo procesar el pago QR.'): string {
  function extract(item: unknown, depth = 0): string | undefined {
    if (depth > 5) return undefined
    if (typeof item === 'string') { const text = item.trim(); return text && !text.includes('[object Object]') ? text.slice(0, 400) : undefined }
    if (!item || typeof item !== 'object') return undefined
    for (const key of ['message', 'error', 'description', 'detail', 'details']) {
      const text = extract((item as Record<string, unknown>)[key], depth + 1)
      if (text) return text
    }
    return undefined
  }
  return extract(value) || fallback
}
