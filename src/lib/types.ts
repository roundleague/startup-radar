export type FundingStage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+'

export type Signal =
  | 'recent_funding'
  | 'accelerator'
  | 'hiring_engineers'
  | 'new_domain'
  | 'ai_company'
  | 'fintech'
  | 'us_based'
  | 'crypto'

export interface SourceLink {
  label: string
  url: string
}

export interface Startup {
  id: string
  name: string
  domain: string
  description: string
  funding_stage: FundingStage
  funding_amount: number
  funding_date: string // ISO date string
  investors: string[]
  location: string
  employee_count: number
  industry: string
  lead_score: number
  signals: string[]
  source_links: SourceLink[]
}

export interface ScoreResult {
  score: number
  reasons: string[]
}

export type LeadTier = 'hot' | 'warm' | 'neutral'

export function getLeadTier(score: number): LeadTier {
  if (score >= 71) return 'hot'
  if (score >= 41) return 'warm'
  return 'neutral'
}

export type DateRangeFilter = 'all' | '30' | '90' | '365'

export interface Filters {
  search: string
  fundingStage: string
  industry: string
  location: string
  dateRange: DateRangeFilter
  minScore: number
}
