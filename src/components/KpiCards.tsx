import { motion } from 'framer-motion'
import { subDays, parseISO } from 'date-fns'
import { TrendingUp, Flame, Database, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Startup } from '@/lib/types'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  accentClass: string
  delay?: number
}

function KpiCard({ title, value, subtitle, icon, accentClass, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      {/* Subtle gradient accent */}
      <div className={cn('absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-10', accentClass)} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('rounded-lg p-2 text-white', accentClass)}>{icon}</div>
      </div>
    </motion.div>
  )
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-1.5" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

interface KpiCardsProps {
  startups: Startup[]
  isLoading: boolean
}

export function KpiCards({ startups, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <KpiCardSkeleton key={i} />)}
      </div>
    )
  }

  const sevenDaysAgo = subDays(new Date(), 7)
  const newCount = startups.filter(s => parseISO(s.funding_date) >= sevenDaysAgo).length
  const hotCount = startups.filter(s => s.lead_score >= 71).length
  const totalCount = startups.length
  const avgScore = totalCount > 0
    ? Math.round(startups.reduce((sum, s) => sum + s.lead_score, 0) / totalCount)
    : 0

  const cards = [
    {
      title: 'New This Week',
      value: newCount,
      subtitle: 'Funded in last 7 days',
      icon: <TrendingUp className="h-4 w-4" />,
      accentClass: 'bg-primary',
    },
    {
      title: 'Hot Leads',
      value: hotCount,
      subtitle: 'Score ≥ 71',
      icon: <Flame className="h-4 w-4" />,
      accentClass: 'bg-[hsl(152_70%_40%)]',
    },
    {
      title: 'Total Tracked',
      value: totalCount,
      subtitle: 'All startups in radar',
      icon: <Database className="h-4 w-4" />,
      accentClass: 'bg-[hsl(280_70%_50%)]',
    },
    {
      title: 'Avg Lead Score',
      value: avgScore,
      subtitle: 'Across all leads',
      icon: <BarChart3 className="h-4 w-4" />,
      accentClass: 'bg-[hsl(38_80%_45%)]',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <KpiCard key={card.title} {...card} delay={i * 0.07} />
      ))}
    </div>
  )
}
