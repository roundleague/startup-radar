import { subDays, format } from 'date-fns'
import { scoreStartup } from './scoring.js'

type FundingStage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+'

interface SourceLink { label: string; url: string }

export interface Startup {
  id: string
  name: string
  domain: string
  description: string
  funding_stage: FundingStage
  funding_amount: number
  funding_date: string
  investors: string[]
  location: string
  employee_count: number
  industry: string
  lead_score: number
  signals: string[]
  source_links: SourceLink[]
}

const PREFIXES = [
  'Veridian', 'Nexlayer', 'Prismatic', 'Helios', 'Zephyr', 'Meridian', 'Cortex',
  'Fulcrum', 'Stratify', 'Luminary', 'Axiom', 'Synapse', 'Stellar', 'Forge',
  'Cascade', 'Apex', 'Quantum', 'Vortex', 'Halcyon', 'Ecliptic', 'Solstice',
  'Atlas', 'Pathfinder', 'Chronicle', 'Beacon', 'Radiant', 'Pinnacle', 'Momentum',
  'Foundry', 'Prism', 'Aether', 'Nova', 'Horizon', 'Catalyst', 'Flux', 'Orbit',
  'Zenith', 'Lattice', 'Cipher', 'Onyx', 'Cobalt', 'Rift', 'Conduit', 'Vertex',
  'Tangent', 'Vector', 'Scalar', 'Quanta', 'Stratum', 'Fenix',
]

const SUFFIXES = [
  'AI', 'Labs', 'HQ', 'Finance', 'Cloud', 'Data', 'Pay', 'Analytics',
  'Commerce', 'Networks', 'Health', 'Revenue', 'Capital', 'HR', 'Dev',
  'Ops', 'Stack', 'Base', 'Engine', 'Platform',
]

const TLD_OPTIONS = ['.io', '.com', '.ai', '.co', '.app']

interface IndustryConfig {
  industry: string
  descriptionTemplate: string
  signals: string[]
}

const INDUSTRY_CONFIGS: IndustryConfig[] = [
  {
    industry: 'AI',
    descriptionTemplate: 'AI-native platform that automates revenue operations workflows using large language models — helping GTM teams close deals 3x faster.',
    signals: ['ai_company', 'hiring_engineers'],
  },
  {
    industry: 'B2B SaaS',
    descriptionTemplate: 'Developer-first SaaS platform that streamlines infrastructure provisioning and reduces cloud spend by up to 40% for engineering-led companies.',
    signals: ['hiring_engineers'],
  },
  {
    industry: 'Fintech',
    descriptionTemplate: 'Embedded finance infrastructure enabling marketplace and e-commerce businesses to offer banking, lending, and cards to their own customers.',
    signals: ['fintech', 'hiring_engineers'],
  },
  {
    industry: 'AI + SaaS',
    descriptionTemplate: 'Intelligent document processing platform combining generative AI with enterprise workflow automation — eliminating manual data entry at scale.',
    signals: ['ai_company', 'hiring_engineers'],
  },
  {
    industry: 'Healthcare',
    descriptionTemplate: 'Healthcare data platform that uses AI to surface predictive clinical insights, helping hospital systems reduce readmission rates by 25%.',
    signals: [],
  },
  {
    industry: 'Security',
    descriptionTemplate: 'AI-powered cloud security platform that detects and auto-remediates identity-based threats in real-time across hybrid cloud environments.',
    signals: ['ai_company', 'hiring_engineers'],
  },
  {
    industry: 'Developer Tools',
    descriptionTemplate: 'Developer platform that makes distributed tracing and observability accessible — used by 500+ engineering teams to debug production incidents faster.',
    signals: ['hiring_engineers'],
  },
  {
    industry: 'Crypto',
    descriptionTemplate: 'Web3 infrastructure for decentralized financial applications — enabling developers to build compliant onchain products with a single API.',
    signals: ['crypto'],
  },
  {
    industry: 'EdTech',
    descriptionTemplate: 'AI tutoring platform that personalizes learning paths for K-12 students, improving standardized test scores by an average of 22%.',
    signals: ['ai_company'],
  },
  {
    industry: 'Climate Tech',
    descriptionTemplate: 'Carbon accounting SaaS that helps enterprise companies track, verify, and report Scope 1–3 emissions with audit-ready accuracy.',
    signals: ['hiring_engineers'],
  },
]

interface LocationConfig {
  name: string
  isUS: boolean
}

const LOCATIONS: LocationConfig[] = [
  { name: 'San Francisco, CA, USA', isUS: true },
  { name: 'New York, NY, USA', isUS: true },
  { name: 'Austin, TX, USA', isUS: true },
  { name: 'Seattle, WA, USA', isUS: true },
  { name: 'Boston, MA, USA', isUS: true },
  { name: 'Los Angeles, CA, USA', isUS: true },
  { name: 'Chicago, IL, USA', isUS: true },
  { name: 'Denver, CO, USA', isUS: true },
  { name: 'Miami, FL, USA', isUS: true },
  { name: 'Atlanta, GA, USA', isUS: true },
  { name: 'London, UK', isUS: false },
  { name: 'Berlin, Germany', isUS: false },
  { name: 'Toronto, Canada', isUS: false },
  { name: 'Amsterdam, Netherlands', isUS: false },
]

const INVESTORS = [
  'Andreessen Horowitz (a16z)', 'Sequoia Capital', 'Y Combinator', 'Bessemer Venture Partners',
  'Accel', 'Kleiner Perkins', 'Lightspeed Venture Partners', 'General Catalyst',
  'GV (Google Ventures)', 'Tiger Global', 'Coatue Management', 'Matrix Partners',
  'Founders Fund', 'First Round Capital', 'SV Angel', 'Insight Partners',
  'Battery Ventures', 'Emergence Capital', 'NEA', 'Spark Capital',
  'Benchmark', 'Index Ventures', 'Greylock Partners', 'Khosla Ventures',
  'Redpoint Ventures', 'IVP', 'CRV', 'True Ventures', 'Lux Capital', 'Union Square Ventures',
]

const STAGES: FundingStage[] = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

function generateDaysAgo(): number {
  const r = Math.random()
  if (r < 0.42) return Math.floor(Math.random() * 30)         // recent ~42%
  if (r < 0.72) return 31 + Math.floor(Math.random() * 59)   // 31-90 days ~30%
  return 91 + Math.floor(Math.random() * 274)                  // 91-365 days ~28%
}

function generateAmount(stage: FundingStage): number {
  const ranges: Record<FundingStage, [number, number]> = {
    'Pre-Seed': [200_000, 1_500_000],
    'Seed': [1_500_000, 7_000_000],
    'Series A': [7_000_000, 30_000_000],
    'Series B': [30_000_000, 90_000_000],
    'Series C+': [90_000_000, 400_000_000],
  }
  const [min, max] = ranges[stage]
  return Math.round((min + Math.random() * (max - min)) / 100_000) * 100_000
}

function generateEmployeeCount(stage: FundingStage): number {
  const ranges: Record<FundingStage, [number, number]> = {
    'Pre-Seed': [2, 12],
    'Seed': [5, 35],
    'Series A': [20, 90],
    'Series B': [60, 250],
    'Series C+': [150, 600],
  }
  const [min, max] = ranges[stage]
  return min + Math.floor(Math.random() * (max - min))
}

export function generateStartups(count = 20): Startup[] {
  const usedNames = new Set<string>()
  const startups: Startup[] = []

  for (let i = 0; i < count; i++) {
    let name: string
    let attempts = 0
    do {
      const prefix = pick(PREFIXES)
      const suffix = Math.random() > 0.35 ? ' ' + pick(SUFFIXES) : ''
      name = prefix + suffix
      attempts++
    } while (usedNames.has(name) && attempts < 50)
    usedNames.add(name)

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const tld = pick(TLD_OPTIONS)
    const domain = slug + tld

    const industryConfig = pick(INDUSTRY_CONFIGS)
    const locationConfig = pick(LOCATIONS)
    const stage = pick(STAGES)
    const daysAgo = generateDaysAgo()
    const fundingDate = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
    const amount = generateAmount(stage)
    const employeeCount = generateEmployeeCount(stage)
    const investorCount = 1 + Math.floor(Math.random() * 3)
    const investors = pickN(INVESTORS, investorCount)

    const signals: string[] = [...industryConfig.signals]
    if (daysAgo <= 30) signals.push('recent_funding')
    if (investors.some(inv => inv.includes('Y Combinator'))) signals.push('accelerator')
    if (locationConfig.isUS) signals.push('us_based')
    const uniqueSignals = [...new Set(signals)]

    const { score } = scoreStartup({
      funding_date: fundingDate,
      location: locationConfig.name,
      industry: industryConfig.industry,
      employee_count: employeeCount,
      signals: uniqueSignals,
    })

    const sourceLinks: SourceLink[] = [
      { label: 'TechCrunch', url: `https://techcrunch.com/search?q=${encodeURIComponent(name)}` },
      { label: 'Crunchbase', url: `https://crunchbase.com/organization/${slug}` },
      { label: 'LinkedIn', url: `https://linkedin.com/company/${slug}` },
    ]

    startups.push({
      id: crypto.randomUUID(),
      name,
      domain,
      description: industryConfig.descriptionTemplate,
      funding_stage: stage,
      funding_amount: amount,
      funding_date: fundingDate,
      investors,
      location: locationConfig.name,
      employee_count: employeeCount,
      industry: industryConfig.industry,
      lead_score: score,
      signals: uniqueSignals,
      source_links: sourceLinks,
    })
  }

  return startups.sort((a, b) => b.lead_score - a.lead_score)
}
