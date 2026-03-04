import type { ScoreResult } from './types'
import { differenceInDays, parseISO } from 'date-fns'

interface ScoringInput {
  funding_date: string
  location: string
  industry: string
  employee_count: number
  signals: string[]
}

export function scoreStartup(startup: ScoringInput): ScoreResult {
  let score = 0
  const reasons: string[] = []

  // +50 if funding_date within last 30 days
  const daysSinceFunding = differenceInDays(new Date(), parseISO(startup.funding_date))
  if (daysSinceFunding <= 30) {
    score += 50
    reasons.push('+50 — Funded within last 30 days')
  }

  // +20 if US-based
  if (startup.location.includes('USA')) {
    score += 20
    reasons.push('+20 — US-based company')
  }

  // +15 if SaaS or AI
  const industryLower = startup.industry.toLowerCase()
  if (industryLower.includes('saas') || industryLower.includes('ai')) {
    score += 15
    reasons.push('+15 — SaaS / AI industry')
  }

  // +10 if < 100 employees
  if (startup.employee_count < 100) {
    score += 10
    reasons.push('+10 — Early-stage team (<100 employees)')
  }

  // +10 if hiring engineers
  if (startup.signals.includes('hiring_engineers')) {
    score += 10
    reasons.push('+10 — Actively hiring engineers')
  }

  // -10 if Crypto
  if (industryLower.includes('crypto') || startup.signals.includes('crypto')) {
    score -= 10
    reasons.push('-10 — Crypto / Web3 company')
  }

  return { score: Math.max(0, score), reasons }
}
