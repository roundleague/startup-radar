import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Startup } from '@/lib/types'

interface ExportButtonProps {
  startups: Startup[]
  disabled?: boolean
}

function toCSV(startups: Startup[]): string {
  const headers = [
    'Company', 'Domain', 'Industry', 'Stage', 'Amount (USD)',
    'Funding Date', 'Location', 'Employees', 'Lead Score',
    'Investors', 'Signals',
  ]

  const rows = startups.map(s => [
    s.name,
    s.domain,
    s.industry,
    s.funding_stage,
    s.funding_amount,
    s.funding_date,
    s.location,
    s.employee_count,
    s.lead_score,
    s.investors.join('; '),
    s.signals.join('; '),
  ])

  const escape = (val: unknown) => `"${String(val).replace(/"/g, '""')}"`
  return [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
}

export function ExportButton({ startups, disabled }: ExportButtonProps) {
  const handleExport = () => {
    if (!startups.length) return
    const csv = toCSV(startups)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `startup-radar-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || startups.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
      {startups.length > 0 && (
        <span className="ml-0.5 text-muted-foreground">({startups.length})</span>
      )}
    </Button>
  )
}
