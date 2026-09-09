import { getVisitorId } from './feedbackService'

export async function trackPage(path: string) {
  try {
    await fetch(`/api/public-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'},
      body: JSON.stringify({
        visitorId: getVisitorId(),
        path,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent
      })
    })
  } catch {
    // Analytics must never block the experience.
  }
}
