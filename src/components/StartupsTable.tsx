import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { subDays, parseISO } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { getLeadTier } from '@/lib/types'
import type { Startup } from '@/lib/types'
import { useStore } from '@/store'

function ScorePill({ score }: { score: number }) {
  const tier = getLeadTier(score)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums transition-all duration-300',
        tier === 'hot' && 'bg-[hsl(152_70%_50%/0.15)] text-[hsl(152_70%_65%)] border border-[hsl(152_70%_50%/0.3)]',
        tier === 'warm' && 'bg-[hsl(38_92%_55%/0.15)] text-[hsl(38_92%_65%)] border border-[hsl(38_92%_55%/0.3)]',
        tier === 'neutral' && 'bg-muted text-muted-foreground border border-border',
      )}
    >
      {tier === 'hot' && <span className="text-[10px]">🔥</span>}
      {score}
    </div>
  )
}

function StageBadge({ stage }: { stage: string }) {
  return <Badge variant="stage" className="font-medium">{stage}</Badge>
}

function InvestorsList({ investors }: { investors: string[] }) {
  const shown = investors.slice(0, 2)
  const rest = investors.length - shown.length
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(inv => (
        <span key={inv} className="text-xs text-muted-foreground truncate max-w-[120px]" title={inv}>
          {inv.split(' ')[0]}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-xs text-muted-foreground">+{rest}</span>
      )}
    </div>
  )
}

function SignalBadges({ signals }: { signals: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {signals.slice(0, 3).map(s => (
        <Badge key={s} variant="signal">
          {s.replace(/_/g, ' ')}
        </Badge>
      ))}
      {signals.length > 3 && (
        <Badge variant="signal">+{signals.length - 3}</Badge>
      )}
    </div>
  )
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (!sorted) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  if (sorted === 'asc') return <ArrowUp className="ml-1 h-3 w-3 text-primary" />
  return <ArrowDown className="ml-1 h-3 w-3 text-primary" />
}

const columns: ColumnDef<Startup>[] = [
  {
    accessorKey: 'lead_score',
    header: ({ column }) => (
      <button
        className="flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Score <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => <ScorePill score={getValue() as number} />,
    sortDescFirst: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button
        className="flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Company <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-sm text-foreground">{row.original.name}</p>
      </div>
    ),
  },
  {
    accessorKey: 'domain',
    header: () => <span className="text-xs uppercase tracking-wider text-muted-foreground">Domain</span>,
    cell: ({ getValue }) => {
      const domain = getValue() as string
      return (
        <span className="text-xs text-muted-foreground font-mono">
          {domain.startsWith('http') ? 'Source Article' : domain}
        </span>
      )
    },
  },
  {
    accessorKey: 'funding_stage',
    header: () => <span className="text-xs uppercase tracking-wider text-muted-foreground">Stage</span>,
    cell: ({ getValue }) => <StageBadge stage={getValue() as string} />,
  },
  {
    accessorKey: 'funding_amount',
    header: ({ column }) => (
      <button
        className="flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Amount <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => (
      <span className="text-sm font-medium tabular-nums">{formatCurrency(getValue() as number)}</span>
    ),
    sortDescFirst: true,
  },
  {
    accessorKey: 'funding_date',
    header: ({ column }) => (
      <button
        className="flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Funded <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{formatDate(getValue() as string)}</span>
    ),
    sortDescFirst: true,
  },
  {
    accessorKey: 'investors',
    header: () => <span className="text-xs uppercase tracking-wider text-muted-foreground">Investors</span>,
    cell: ({ getValue }) => <InvestorsList investors={getValue() as string[]} />,
    enableSorting: false,
  },
  {
    accessorKey: 'location',
    header: () => <span className="text-xs uppercase tracking-wider text-muted-foreground">Location</span>,
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'employee_count',
    header: ({ column }) => (
      <button
        className="flex items-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Team <SortIcon sorted={column.getIsSorted()} />
      </button>
    ),
    cell: ({ getValue }) => (
      <span className="text-sm tabular-nums">{(getValue() as number).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'industry',
    header: () => <span className="text-xs uppercase tracking-wider text-muted-foreground">Industry</span>,
    cell: ({ getValue }) => <Badge variant="outline">{getValue() as string}</Badge>,
  },
  {
    accessorKey: 'signals',
    header: () => <span className="text-xs uppercase tracking-wider text-muted-foreground">Signals</span>,
    cell: ({ getValue }) => <SignalBadges signals={getValue() as string[]} />,
    enableSorting: false,
  },
  {
    id: 'source',
    header: () => null,
    cell: ({ row }) => {
      const first = row.original.source_links[0]
      if (!first) return null
      return (
        <a
          href={first.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )
    },
    enableSorting: false,
  },
]

function TableSkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[44, 130, 90, 80, 70, 80, 120, 110, 50, 80, 140, 24].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 w-[${w}px]`} style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

interface StartupsTableProps {
  startups: Startup[]
  isLoading: boolean
}

export function StartupsTable({ startups, isLoading }: StartupsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'lead_score', desc: true }])
  const { selectedId, setSelectedId } = useStore()

  const table = useReactTable({
    data: startups,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {columns.map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => <TableSkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (startups.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">📡</div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No startups found</h3>
        <p className="text-sm text-muted-foreground">
          {startups.length === 0
            ? 'Click "Refresh Leads" to pull in the latest venture-backed startups.'
            : 'Try adjusting your filters to see more results.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {table.getHeaderGroups().map(hg =>
                hg.headers.map(header => (
                  <th key={header.id} className="px-4 py-3 text-left">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {table.getRowModel().rows.map((row, idx) => {
                const isHot = row.original.lead_score >= 71
                const isSelected = row.original.id === selectedId
                return (
                  <motion.tr
                    key={row.original.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.02, 0.3) }}
                    onClick={() => setSelectedId(isSelected ? null : row.original.id)}
                    className={cn(
                      'border-b border-border cursor-pointer transition-all duration-150 group',
                      'hover:-translate-y-px hover:bg-accent/60',
                      isSelected && 'bg-accent/80',
                      isHot && 'hover:[box-shadow:0_0_20px_hsl(152_70%_50%/0.15)]',
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-4 py-3',
                          isHot && 'group-hover:bg-[hsl(152_70%_50%/0.04)]',
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 border-t border-border bg-muted/10">
        <p className="text-xs text-muted-foreground">
          {table.getRowModel().rows.length} startup{table.getRowModel().rows.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
