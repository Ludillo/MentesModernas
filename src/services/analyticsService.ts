import { getVisitorId } from './feedbackService'

export async function trackPage(path: string) {
  try {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      },
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
