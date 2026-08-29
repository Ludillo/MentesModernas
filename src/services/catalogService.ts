import { supabase } from '../lib/supabase'

export type TestCatalogItem = {
  type_code:string
  name:string
  description:string
  icon:string
  free_code:string
  free_questions:number
  premium_code:string
  premium_questions:number
  price:number
  currency:string
}

export async function getTestCatalog():Promise<TestCatalogItem[]> {
  const {data,error}=await supabase.rpc('get_test_catalog')
  if(error)throw error
  return (data??[]) as TestCatalogItem[]
}
