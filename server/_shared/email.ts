import { env } from '../context'
type EmailMessage = {
  to: string[]
  subject: string
  html: string
  attachments?: { name: string; content: string }[]
}

export async function sendEmail(message: EmailMessage) {
  const brevoKey = env().BREVO_API_KEY
  const brevoFromEmail = env().BREVO_FROM_EMAIL
  const brevoFromName = env().BREVO_FROM_NAME || 'MentesModernas'
  const replyTo = env().BREVO_REPLY_TO
  if (brevoKey && brevoFromEmail && message.to.length > 0) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': brevoKey, accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: brevoFromName, email: brevoFromEmail },
        to: message.to.map(email => ({ email })),
        replyTo: replyTo ? { email: replyTo, name: 'MentesModernas' } : undefined,
        subject: message.subject,
        htmlContent: message.html,
        attachment: message.attachments?.map(file => ({ name: file.name, content: file.content }))
      })
    })
    if (!response.ok) {
      console.error('No se pudo enviar la notificación con Brevo:', response.status)
      return false
    }
    return true
  }

  const apiKey = env().RESEND_API_KEY
  const from = env().RESEND_FROM
  if (!apiKey || !from || message.to.length === 0) {
    console.warn('Notificación omitida: faltan RESEND_API_KEY, RESEND_FROM o destinatarios.')
    return false
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: message.to, subject: message.subject, html: message.html,
      attachments: message.attachments?.map(file => ({ filename: file.name, content: file.content })) })
  })
  if (!response.ok) {
    console.error('No se pudo enviar la notificación:', response.status)
    return false
  }
  return true
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}
