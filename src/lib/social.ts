export type SocialSettings = {
  whatsapp?: { enabled?: boolean; number?: string; message?: string }
  facebook?: { enabled?: boolean; url?: string }
  instagram?: { enabled?: boolean; url?: string }
  tiktok?: { enabled?: boolean; url?: string }
  youtube?: { enabled?: boolean; url?: string }
  linkedin?: { enabled?: boolean; url?: string }
}

export const EMPTY_SOCIAL_SETTINGS: SocialSettings = {
  whatsapp: { enabled: false, number: '', message: 'Hola MentesModernas, quisiera recibir más información.' },
  facebook: { enabled: false, url: '' },
  instagram: { enabled: false, url: '' },
  tiktok: { enabled: false, url: '' },
  youtube: { enabled: false, url: '' },
  linkedin: { enabled: false, url: '' }
}

export function whatsappUrl(settings?: SocialSettings) {
  const number = settings?.whatsapp?.number?.replace(/\D/g, '')
  if (!settings?.whatsapp?.enabled || !number) return ''
  const message = settings.whatsapp.message || 'Hola MentesModernas, quisiera recibir más información.'
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function activeSocialLinks(settings?: SocialSettings) {
  const links = [
    { key: 'facebook', label: 'Facebook', url: settings?.facebook?.url, enabled: settings?.facebook?.enabled },
    { key: 'instagram', label: 'Instagram', url: settings?.instagram?.url, enabled: settings?.instagram?.enabled },
    { key: 'tiktok', label: 'TikTok', url: settings?.tiktok?.url, enabled: settings?.tiktok?.enabled },
    { key: 'youtube', label: 'YouTube', url: settings?.youtube?.url, enabled: settings?.youtube?.enabled },
    { key: 'linkedin', label: 'LinkedIn', url: settings?.linkedin?.url, enabled: settings?.linkedin?.enabled }
  ]
  return links.filter(x => x.enabled && /^https?:\/\//i.test(x.url || '')) as Array<{key:string;label:string;url:string}>
}
