import { useMemo } from 'react'
import { subDays, parseISO } from 'date-fns'
import { RefreshCw, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { KpiCards } from '@/components/KpiCards'
import { FiltersBar } from '@/components/FiltersBar'
import { StartupsTable } from '@/components/StartupsTable'
import { DetailSheet } from '@/components/DetailSheet'
import { ExportButton } from '@/components/ExportButton'
import { useStartups, useIngest } from '@/hooks/api'
import { useStore } from '@/store'
import type { Startup } from '@/lib/types'

function useFilteredStartups(startups: Startup[]) {
  const { search, fundingStage, industry, dateRange, minScore } = useStore()

  return useMemo(() => {
    let filtered = [...startups]

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        s => s.name.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q)
      )
    }

    if (fundingStage) {
      filtered = filtered.filter(s => s.funding_stage === fundingStage)
    }

    if (industry) {
      filtered = filtered.filter(s => s.industry === industry)
    }

    if (dateRange !== 'all') {
      const cutoff = subDays(new Date(), parseInt(dateRange))
      filtered = filtered.filter(s => parseISO(s.funding_date) >= cutoff)
    }

    if (minScore > 0) {
      filtered = filtered.filter(s => s.lead_score >= minScore)
    }

    return filtered
  }, [startups, search, fundingStage, industry, dateRange, minScore])
}

export default function Dashboard() {
  const { data: startups = [], isLoading, isError } = useStartups()
  const ingest = useIngest()
  const { selectedId } = useStore()

  const filteredStartups = useFilteredStartups(startups)
  const selectedStartup = startups.find(s => s.id === selectedId) ?? null

  const isRefreshing = ingest.isPending

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border header-gradient backdrop-blur-md">
        <div className="mx-auto max-w-[1600px] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
              <Radio className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">Startup Radar</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Venture-backed sales intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ExportButton startups={filteredStartups} disabled={isRefreshing} />

            <Button
              size="sm"
              onClick={() => ingest.mutate()}
              disabled={isRefreshing}
              className="gap-2 relative overflow-hidden"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Scanning...' : 'Refresh Leads'}
              {/* Shimmer effect while loading */}
              {isRefreshing && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        {isError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Failed to connect to the API server. Make sure the backend is running on port 3001.
          </div>
        )}

        <Tabs defaultValue="leads">
          <div className="flex items-center justify-between mb-5">
            <TabsList className="bg-muted/40 border border-border">
              <TabsTrigger value="leads" className="text-sm">
                Leads
                {startups.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    {startups.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="signals" className="text-sm">Signals Feed</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="leads" className="space-y-4 mt-0">
            <KpiCards startups={startups} isLoading={isLoading || isRefreshing} />
            <FiltersBar startups={startups} />
            <StartupsTable startups={filteredStartups} isLoading={isLoading || isRefreshing} />
          </TabsContent>

          <TabsContent value="signals" className="mt-0">
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                <Radio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Signals Feed</h3>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                Coming soon — real-time funding announcements, job postings, and domain registrations.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail sheet — rendered outside main for full viewport overlay */}
      <DetailSheet startup={selectedStartup} />
    </div>
  )
}
