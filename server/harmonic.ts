import { differenceInDays, parseISO, format, isValid } from 'date-fns'
import { scoreStartup } from './scoring.js'
import type { Startup } from './generator.js'

const HARMONIC_BASE = 'https://api.harmonic.ai'

type FundingStage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+'

// ── Raw Harmonic response types ──────────────────────────────────────────────

interface HarmonicLocation {
  city?: string
  state?: string
  country?: string
}

interface HarmonicInvestor {
  name?: string
  entity_urn?: string
}

interface HarmonicFundingRound {
  funding_amount?: number
  announced_date?: string
  investors?: HarmonicInvestor[]
  funding_round_type?: string
}

interface HarmonicTag {
  type?: string
  value?: string
}

interface HarmonicCompany {
  id: string
  name?: string
  description?: string
  website?: { domain?: string; url?: string }
  headcount?: number
  location?: HarmonicLocation
  funding_stage?: string
  funding_total?: number
  last_funding_at?: string
  num_funding_rounds?: number
  investors?: HarmonicInvestor[]
  funding_rounds?: HarmonicFundingRound[]
  tags?: HarmonicTag[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function apiKey(): string {
  const key = process.env.HARMONIC_API_KEY
  if (!key) throw new Error('HARMONIC_API_KEY is not set in environment')
  return key
}

function harmonicHeaders() {
  return { apikey: apiKey(), 'Content-Type': 'application/json' }
}

function urnToId(urn: string): string {
  return urn.split(':').pop()!
}

function mapFundingStage(stage?: string): FundingStage {
  const normalized = stage?.toUpperCase().replace(/[- ]/g, '_') ?? ''
  const map: Record<string, FundingStage> = {
    PRE_SEED: 'Pre-Seed',
    PRESEED: 'Pre-Seed',
    ANGEL: 'Pre-Seed',
    SEED: 'Seed',
    SERIES_A: 'Series A',
    SERIESA: 'Series A',
    SERIES_B: 'Series B',
    SERIESB: 'Series B',
    SERIES_C: 'Series C+',
    SERIESC: 'Series C+',
    SERIES_D: 'Series C+',
    SERIES_E: 'Series C+',
    GROWTH: 'Series C+',
    LATE_STAGE: 'Series C+',
    IPO: 'Series C+',
  }
  return map[normalized] ?? 'Seed'
}

function formatLocation(loc?: HarmonicLocation): string {
  if (!loc) return 'Unknown'
  return [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
}

function inferIndustry(tags?: HarmonicTag[]): string {
  const vals = tags?.map(t => (t.value ?? '').toLowerCase()) ?? []
  const join = vals.join(' ')
  if (/\bai\b|machine.?learning|llm|generative/.test(join)) return 'AI'
  if (/fintech|payments?|banking|lending|insurtech/.test(join)) return 'Fintech'
  if (/health|medtech|biotech|clinical|pharma/.test(join)) return 'Healthcare'
  if (/security|cyber|infosec|identity/.test(join)) return 'Security'
  if (/devtools?|developer.tool|observ|infra/.test(join)) return 'Developer Tools'
  if (/crypto|web3|blockchain|defi/.test(join)) return 'Crypto'
  if (/climate|sustainability|carbon|cleantech/.test(join)) return 'Climate Tech'
  if (/edtech|education|learning/.test(join)) return 'EdTech'
  if (/saas|b2b/.test(join)) return 'B2B SaaS'
  return 'B2B SaaS'
}

function deriveSignals(company: HarmonicCompany, fundingDate: string, location: string): string[] {
  const signals: string[] = []
  const industry = inferIndustry(company.tags)
  if (/ai|machine/.test(industry.toLowerCase())) signals.push('ai_company')
  if (industry === 'Fintech') signals.push('fintech')
  if (industry === 'Crypto') signals.push('crypto')

  try {
    const parsed = parseISO(fundingDate)
    if (isValid(parsed) && differenceInDays(new Date(), parsed) <= 30) {
      signals.push('recent_funding')
    }
  } catch { /* ignore */ }

  if (/united states|usa|\bUS\b/i.test(location)) signals.push('us_based')

  const investorNames = (company.investors ?? []).map(i => i.name ?? '')
  if (investorNames.some(n => /y combinator|yc/i.test(n))) signals.push('accelerator')

  return [...new Set(signals)]
}

function safeDate(raw?: string): string {
  if (!raw) return format(new Date(), 'yyyy-MM-dd')
  try {
    const parsed = new Date(raw)
    return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  } catch {
    return format(new Date(), 'yyyy-MM-dd')
  }
}

function lastRoundAmount(company: HarmonicCompany): number {
  // Prefer the most recent individual round's amount
  if (company.funding_rounds?.length) {
    const sorted = [...company.funding_rounds].sort((a, b) => {
      const da = a.announced_date ? new Date(a.announced_date).getTime() : 0
      const db = b.announced_date ? new Date(b.announced_date).getTime() : 0
      return db - da
    })
    const amount = sorted[0]?.funding_amount
    if (amount && amount > 0) return amount
  }
  // Fall back to total raised
  return company.funding_total ?? 0
}

// ── Harmonic API calls ────────────────────────────────────────────────────────

async function searchCompanyUrns(query: string, size: number): Promise<string[]> {
  const params = new URLSearchParams({ query, size: String(size) })
  const res = await fetch(`${HARMONIC_BASE}/search/search_agent?${params}`, {
    headers: harmonicHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Harmonic search failed (${res.status}): ${text}`)
  }
  const data = await res.json() as { results?: Array<{ urn: string }> }
  return (data.results ?? []).map(r => r.urn)
}

async function batchGetCompanies(ids: string[]): Promise<HarmonicCompany[]> {
  const res = await fetch(`${HARMONIC_BASE}/companies/batchGet`, {
    method: 'POST',
    headers: harmonicHeaders(),
    body: JSON.stringify({
      ids,
      fields: [
        'id', 'name', 'description', 'website', 'headcount',
        'location', 'funding_stage', 'funding_total', 'last_funding_at',
        'num_funding_rounds', 'investors', 'funding_rounds', 'tags',
      ],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Harmonic batchGet failed (${res.status}): ${text}`)
  }
  const data = await res.json()
  // Response may be { companies: [...] } or just an array
  return Array.isArray(data) ? data : (data.companies ?? [])
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchStartupsFromHarmonic(
  query = 'recently funded early-stage B2B SaaS and AI startups',
  count = 20,
): Promise<Startup[]> {
  const urns = await searchCompanyUrns(query, count)
  if (!urns.length) return []

  const ids = urns.map(urnToId).filter(Boolean)
  const companies = await batchGetCompanies(ids)

  const startups: Startup[] = companies
    .filter(c => c.name)
    .map(c => {
      const location = formatLocation(c.location)
      const industry = inferIndustry(c.tags)
      const fundingStage = mapFundingStage(c.funding_stage)
      const fundingDate = safeDate(c.last_funding_at)
      const signals = deriveSignals(c, fundingDate, location)
      const { score } = scoreStartup({
        funding_date: fundingDate,
        location,
        industry,
        employee_count: c.headcount ?? 50,
        signals,
      })

      const slug = (c.website?.domain ?? c.name!.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .replace(/^https?:\/\//, '')
        .split('/')[0]

      const investorNames = (c.investors ?? [])
        .map(i => i.name)
        .filter((n): n is string => Boolean(n))

      return {
        id: c.id,
        name: c.name!,
        domain: slug,
        description: c.description ?? '',
        funding_stage: fundingStage,
        funding_amount: lastRoundAmount(c),
        funding_date: fundingDate,
        investors: investorNames,
        location,
        employee_count: c.headcount ?? 0,
        industry,
        lead_score: score,
        signals,
        source_links: [
          { label: 'Crunchbase', url: `https://crunchbase.com/organization/${slug}` },
          { label: 'LinkedIn', url: `https://linkedin.com/company/${slug}` },
        ],
      } satisfies Startup
    })

  return startups.sort((a, b) => b.lead_score - a.lead_score)
}
