type EmailMessage = {
  to: string[]
  subject: string
  html: string
}

export async function sendEmail(message: EmailMessage) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM')
  if (!apiKey || !from || message.to.length === 0) {
    console.warn('Notificación omitida: faltan RESEND_API_KEY, RESEND_FROM o destinatarios.')
    return false
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, ...message })
  })
  if (!response.ok) {
    console.error('No se pudo enviar la notificación:', await response.text())
    return false
  }
  return true
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}
