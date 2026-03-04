import { format, isValid } from 'date-fns'
import { scoreStartup } from './scoring.js'
import type { Startup } from './generator.js'

type FundingStage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+'

const NEWS_API_KEY = process.env.NEWS_API_KEY

const FUNDING_TITLE_RE = /\b(raises?|raised|secures?|secured|lands?|landed|close[sd]?|nabs?|bags?|scores?|funding|investment|seed round|series [a-f])\b/i

// ── Extraction helpers ────────────────────────────────────────────────────────

function extractCompanyName(title: string): string | null {
  const verbPat = 'raises?|raised|secures?|secured|lands?|landed|closes?|closed|nabs?|bags?|scores?|gets?|has raised|is raising'
  const m = title.match(new RegExp(`^(.+?)\\s+(?:${verbPat})\\b`, 'i'))
  if (!m) return null
  let name = m[1].trim()
  name = name.replace(/^(?:YC[-\s]backed|Y\.?C\.?[-\s]backed|Former|New|AI|B2B|SaaS|Fintech)\s+/i, '')
  name = name.replace(/^\w+-(?:based|led|backed|founded)\s+/i, '')
  name = name.replace(/^(?:startup|company|firm|platform|app)\s+/i, '')
  return name.length >= 2 ? name : null
}

function extractAmount(text: string): number {
  const m = text.match(/\$(\d+(?:\.\d+)?)\s*(K|M|B|thousand|million|billion)\b/i)
  if (!m) return 0
  const num = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit === 'k' || unit === 'thousand') return Math.round(num * 1_000)
  if (unit === 'm' || unit === 'million') return Math.round(num * 1_000_000)
  if (unit === 'b' || unit === 'billion') return Math.round(num * 1_000_000_000)
  return 0
}

function extractStage(text: string, amount: number): FundingStage {
  const lower = text.toLowerCase()
  if (/pre-?seed/.test(lower)) return 'Pre-Seed'
  if (/series [cdefg]/.test(lower)) return 'Series C+'
  if (/series b/.test(lower)) return 'Series B'
  if (/series a/.test(lower)) return 'Series A'
  if (/\bseed\b/.test(lower)) return 'Seed'
  if (/growth.?round|late.?stage/.test(lower)) return 'Series C+'
  if (amount > 0 && amount < 1_500_000) return 'Pre-Seed'
  if (amount >= 1_500_000 && amount < 7_000_000) return 'Seed'
  if (amount >= 7_000_000 && amount < 30_000_000) return 'Series A'
  if (amount >= 30_000_000 && amount < 90_000_000) return 'Series B'
  if (amount >= 90_000_000) return 'Series C+'
  return 'Seed'
}

function extractInvestors(text: string): string[] {
  const found = new Set<string>()
  const namedVCRe = /(?:Sequoia|Andreessen Horowitz|a16z|Y Combinator|Accel|Benchmark|Founders Fund|Lightspeed|General Catalyst|Tiger Global|Coatue|GV|Google Ventures|First Round Capital|Bessemer|Greylock|Khosla Ventures|Index Ventures|Insight Partners|IVP|NEA|Battery Ventures|Redpoint|Spark Capital)/g
  let m: RegExpExecArray | null
  while ((m = namedVCRe.exec(text)) !== null) found.add(m[0])
  const ledByM = text.match(/led by ([^,\.\n]{3,50})/i)
  if (ledByM) {
    const raw = ledByM[1].trim().replace(/\s+(and|with)\s+.*/i, '')
    if (raw.length >= 3) found.add(raw)
  }
  return [...found].slice(0, 3)
}

function extractLocation(text: string): string {
  const usPattern = /\b(?:San Francisco|New York|Austin|Seattle|Boston|Los Angeles|Chicago|Denver|Miami|Atlanta|Cambridge|Palo Alto|Mountain View|Menlo Park|Brooklyn),?\s*(?:CA|NY|TX|WA|MA|IL|CO|FL|GA)?\s*(?:,\s*USA?|,\s*United States)?\b/i
  const intlPattern = /\b(?:London|Berlin|Toronto|Paris|Amsterdam|Singapore|Tel Aviv|Sydney|Dublin)\b/i
  const usM = text.match(usPattern)
  if (usM) {
    const city = usM[0].trim()
    return city.includes('USA') || city.includes('United States') ? city : `${city}, USA`
  }
  const intlM = text.match(intlPattern)
  if (intlM) return intlM[0]
  return 'USA'
}

function inferIndustry(text: string): string {
  const lower = text.toLowerCase()
  if (/\bai\b|artificial intelligence|machine learning|llm|generative|openai|gpt/.test(lower)) return 'AI'
  if (/\bfintech\b|payments?|banking|lending|insurtech|neobank/.test(lower)) return 'Fintech'
  if (/health|medical|clinical|biotech|pharma|hospital/.test(lower)) return 'Healthcare'
  if (/\bsecurity\b|cybersecuri|identity|infosec/.test(lower)) return 'Security'
  if (/devtool|developer tool|observ|infra|platform|api|sdk/.test(lower)) return 'Developer Tools'
  if (/crypto|blockchain|web3|defi|nft|token/.test(lower)) return 'Crypto'
  if (/climate|sustainability|carbon|cleantech|renewable|energy/.test(lower)) return 'Climate Tech'
  if (/edtech|education|learning|tutoring|student/.test(lower)) return 'EdTech'
  return 'B2B SaaS'
}

function defaultEmployeeCount(stage: FundingStage): number {
  const map: Record<FundingStage, number> = {
    'Pre-Seed': 6, 'Seed': 18, 'Series A': 45, 'Series B': 120, 'Series C+': 280,
  }
  return map[stage]
}

function safeDate(raw: string): string {
  try {
    const d = new Date(raw)
    if (isValid(d)) return format(d, 'yyyy-MM-dd')
  } catch { /* ignore */ }
  return format(new Date(), 'yyyy-MM-dd')
}

function deriveSignals(industry: string, stage: FundingStage, location: string, fundingDate: string, investors: string[]): string[] {
  const signals: string[] = []
  const lower = industry.toLowerCase()
  if (lower.includes('ai')) signals.push('ai_company')
  if (lower === 'fintech') signals.push('fintech')
  if (lower === 'crypto') signals.push('crypto')
  if (/usa|united states/i.test(location)) signals.push('us_based')
  if (investors.some(i => /y combinator|yc/i.test(i))) signals.push('accelerator')
  try {
    const d = new Date(fundingDate)
    if (Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000) signals.push('recent_funding')
  } catch { /* ignore */ }
  return [...new Set(signals)]
}

// ── NewsAPI fetch ─────────────────────────────────────────────────────────────

interface NewsArticle {
  title: string
  description: string | null
  url: string
  publishedAt: string
  source: { name: string }
}

async function fetchNewsArticles(): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) throw new Error('NEWS_API_KEY is not set')

  const query = 'startup raises funding "series a" OR "series b" OR "seed round" OR "raised"'
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${NEWS_API_KEY}`

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`NewsAPI request failed (${res.status})`)

  const json = await res.json() as { status: string; articles: NewsArticle[]; message?: string }
  if (json.status !== 'ok') throw new Error(`NewsAPI error: ${json.message ?? json.status}`)

  return json.articles.filter(a =>
    a.title &&
    a.title !== '[Removed]' &&
    FUNDING_TITLE_RE.test(a.title)
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchStartupsFromRSS(count = 20): Promise<Startup[]> {
  const articles = await fetchNewsArticles()

  if (!articles.length) throw new Error('No relevant articles from NewsAPI')

  const startups: Startup[] = []

  for (const article of articles) {
    if (startups.length >= count) break

    const name = extractCompanyName(article.title)
    if (!name) continue

    const fullText = `${article.title} ${article.description ?? ''}`
    const amount = extractAmount(fullText)
    const stage = extractStage(fullText, amount)
    const investors = extractInvestors(fullText)
    const location = extractLocation(fullText)
    const industry = inferIndustry(fullText)
    const fundingDate = safeDate(article.publishedAt)
    const signals = deriveSignals(industry, stage, location, fundingDate, investors)
    const employeeCount = defaultEmployeeCount(stage)

    const description = (article.description ?? article.title).slice(0, 220).replace(/\s\S*$/, '') + '…'
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const { score } = scoreStartup({ funding_date: fundingDate, location, industry, employee_count: employeeCount, signals })

    startups.push({
      id: crypto.randomUUID(),
      name,
      domain: `${slug}.com`,
      description,
      funding_stage: stage,
      funding_amount: amount,
      funding_date: fundingDate,
      investors,
      location,
      employee_count: employeeCount,
      industry,
      lead_score: score,
      signals,
      source_links: [
        { label: article.source.name, url: article.url },
        { label: 'Crunchbase', url: `https://crunchbase.com/organization/${slug}` },
        { label: 'LinkedIn', url: `https://linkedin.com/company/${slug}` },
      ],
    })
  }

  return startups.sort((a, b) => b.lead_score - a.lead_score)
}
