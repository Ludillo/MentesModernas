import { supabase } from '../lib/supabase'

export async function loadContent() {
  const { data, error } = await supabase
    .from('site_content')
    .select('key,value')
    .eq('is_active', true)

  if (error) throw error
  return Object.fromEntries((data ?? []).map((x: any) => [x.key, x.value]))
}
