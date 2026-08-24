export type AreaCode = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export interface TestQuestion {
  id: string
  test_version_id: string
  number: number
  dimension_code: string
  prompt: string
  is_active: boolean
}

export interface AreaResult {
  code: string
  name: string
  score: number
  maxScore: number
  percent: number
  description: string
  careers: string[]
}

export interface SiteContent {
  key: string
  value: Record<string, unknown>
}

export interface AdminSession {
  token: string
  expiresAt: string
  admin: {
    id: string
    email: string
    displayName: string
    role: string
  }
}
