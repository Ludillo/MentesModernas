import { supabase } from '../lib/supabase'

export function getVisitorId() {
  const key = 'mm_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

export async function recordTestCompletion(testCode:string) {
  await supabase.rpc('record_test_completion', { p_test_code:testCode, p_visitor_id:getVisitorId() })
}

export async function submitTestFeedback(testCode:string, helpful:boolean, clarity:number, evaluationId?:string) {
  const { error } = await supabase.rpc('submit_test_feedback', {
    p_test_code:testCode,
    p_visitor_id:getVisitorId(),
    p_helpful:helpful,
    p_clarity:clarity,
    p_evaluation_id:evaluationId ?? null
  })
  if (error) throw error
}

export async function loadPublicTestStats() {
  const { data, error } = await supabase.rpc('get_public_test_stats')
  if (error) throw error
  return data?.[0] ?? { completed_tests:0, survey_responses:0, helpful_percentage:0, average_clarity:0 }
}
