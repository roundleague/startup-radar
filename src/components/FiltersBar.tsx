import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useStore } from '@/store'
import type { Startup } from '@/lib/types'

const FUNDING_STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+']
const DATE_RANGES = [
  { label: 'All time', value: 'all' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last 365 days', value: '365' },
]

interface FiltersBarProps {
  startups: Startup[]
}

export function FiltersBar({ startups }: FiltersBarProps) {
  const {
    search, setSearch,
    fundingStage, setFundingStage,
    industry, setIndustry,
    dateRange, setDateRange,
    minScore, setMinScore,
    resetFilters,
  } = useStore()

  const industries = [...new Set(startups.map(s => s.industry))].sort()

  const hasActiveFilters = search || fundingStage || industry || dateRange !== 'all' || minScore > 0

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        {/* Funding Stage */}
        <Select value={fundingStage || 'all'} onValueChange={(v) => setFundingStage(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {FUNDING_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Industry */}
        <Select value={industry || 'all'} onValueChange={(v) => setIndustry(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Date Range */}
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Score Slider */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground whitespace-nowrap w-[90px]">
          Min score: <span className="text-foreground font-medium">{minScore}</span>
        </span>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[minScore]}
          onValueChange={([v]) => setMinScore(v)}
          className="max-w-[200px]"
        />
        <span className="text-xs text-muted-foreground">
          {startups.length} total
        </span>
      </div>
    </div>
  )
}
