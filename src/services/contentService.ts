import { backend } from '../lib/backend'

export async function loadContent() {
  const { data, error } = await backend
    .from('site_content')
    .select('key,value')
    .eq('is_active', true)

  if (error) throw error
  return Object.fromEntries((data ?? []).map((x: any) => [x.key, x.value]))
}
