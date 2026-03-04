import { ExternalLink, MapPin, Users, Calendar, DollarSign, Zap, TrendingUp } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { getLeadTier } from '@/lib/types'
import { scoreStartup as computeScore } from '@/lib/scoring'
import type { Startup } from '@/lib/types'
import { useStore } from '@/store'

interface DetailSheetProps {
  startup: Startup | null
}

function ScoreMeter({ score }: { score: number }) {
  const tier = getLeadTier(score)
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold',
          tier === 'hot' && 'bg-[hsl(152_70%_50%/0.15)] text-[hsl(152_70%_65%)] border border-[hsl(152_70%_50%/0.3)]',
          tier === 'warm' && 'bg-[hsl(38_92%_55%/0.15)] text-[hsl(38_92%_65%)] border border-[hsl(38_92%_55%/0.3)]',
          tier === 'neutral' && 'bg-muted text-muted-foreground border border-border',
        )}
      >
        {tier === 'hot' && '🔥 Hot Lead'}
        {tier === 'warm' && '⚡ Warm Lead'}
        {tier === 'neutral' && 'Lead'}
        <span className="ml-1 opacity-80">{score}</span>
      </div>
    </div>
  )
}

export function DetailSheet({ startup }: DetailSheetProps) {
  const { selectedId, setSelectedId } = useStore()
  const isOpen = !!selectedId && !!startup

  const scoreResult = startup ? computeScore(startup) : null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && setSelectedId(null)}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        {startup && (
          <>
            {/* Header */}
            <div className="px-6 pt-8 pb-5 border-b border-border">
              <SheetHeader>
                <div className="flex items-start justify-between gap-4 pr-6">
                  <div className="min-w-0">
                    <SheetTitle className="text-xl font-bold leading-tight">{startup.name}</SheetTitle>
                    <a
                      href={startup.domain.startsWith('http') ? startup.domain : `https://${startup.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-0.5"
                    >
                      {startup.domain.startsWith('http') ? 'Source Article' : startup.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <ScoreMeter score={startup.lead_score} />
                </div>
                <SheetDescription className="mt-3 text-sm leading-relaxed">
                  {startup.description}
                </SheetDescription>
              </SheetHeader>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-6 py-5 space-y-6">

                {/* Quick Facts */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: DollarSign, label: 'Raised', value: formatCurrency(startup.funding_amount) },
                    { icon: TrendingUp, label: 'Stage', value: startup.funding_stage },
                    { icon: Calendar, label: 'Funded', value: formatDate(startup.funding_date) },
                    { icon: Users, label: 'Team Size', value: `~${startup.employee_count}` },
                    { icon: MapPin, label: 'Location', value: startup.location },
                    { icon: Zap, label: 'Industry', value: startup.industry },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-medium text-foreground truncate" title={value}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Investors */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Investors</h4>
                  <div className="flex flex-wrap gap-2">
                    {startup.investors.map(inv => (
                      <Badge key={inv} variant="outline" className="text-xs">{inv}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Signals */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Signals</h4>
                  <div className="flex flex-wrap gap-2">
                    {startup.signals.map(signal => (
                      <Badge
                        key={signal}
                        variant={signal === 'crypto' ? 'neutral' : 'signal'}
                        className="text-xs"
                      >
                        {signal.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Scoring Breakdown */}
                {scoreResult && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Score Breakdown</h4>
                    <div className="space-y-2">
                      {scoreResult.reasons.map((reason, i) => {
                        const isPositive = reason.startsWith('+')
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs font-mono font-semibold',
                              isPositive ? 'text-[hsl(152_70%_60%)]' : 'text-destructive'
                            )}>
                              {reason.split('—')[0].trim()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {reason.split('—')[1]?.trim()}
                            </span>
                          </div>
                        )
                      })}
                      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="text-sm font-bold text-foreground">{startup.lead_score}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Evidence / Source Links */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Evidence</h4>
                  <div className="space-y-2">
                    {startup.source_links.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-sm hover:bg-accent/60 transition-colors group"
                      >
                        <span className="font-medium text-foreground">{link.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
